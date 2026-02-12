import express from 'express';
import { google } from 'googleapis';

const router = express.Router();

const bigquery = google.bigquery('v2');
const cloudbilling = google.cloudbilling('v1');

const DEFAULT_BQ_LOCATION = process.env.BILLING_BQ_LOCATION || 'US';
const DEFAULT_BQ_DATASET = process.env.BILLING_BQ_EXPORT_DATASET || 'billing_export';

const parseNumber = (raw) => {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
};

const getRowValue = (row, index) => row?.f?.[index]?.v;

const buildPeriod = (yearParam, monthParam) => {
    const now = new Date();
    const year = Number(yearParam) || now.getFullYear();
    const month = Number(monthParam) || now.getMonth() + 1;

    if (month < 1 || month > 12) {
        throw new Error('month must be between 1 and 12');
    }

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    return {
        year,
        month,
        startIso: start.toISOString(),
        endIso: end.toISOString(),
        periodLabel: start.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    };
};

const resolveBillingTables = async ({ projectId, datasetId, location }) => {
    const tableFromEnv = process.env.BILLING_BQ_EXPORT_TABLE;
    if (tableFromEnv) {
        return [tableFromEnv];
    }

    const tableListFromEnv = process.env.BILLING_BQ_EXPORT_TABLES;
    if (tableListFromEnv) {
        const parsed = tableListFromEnv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        if (parsed.length > 0) {
            return parsed;
        }
    }

    const discoverySql = `
        SELECT table_name
        FROM \`${projectId}.${datasetId}.INFORMATION_SCHEMA.TABLES\`
        WHERE table_name LIKE 'gcp_billing_export_resource_v1_%'
           OR table_name LIKE 'gcp_billing_export_v1_%'
        ORDER BY creation_time DESC
    `;

    const discovery = await bigquery.jobs.query({
        projectId,
        requestBody: {
            query: discoverySql,
            useLegacySql: false,
            location
        }
    });

    const rows = discovery?.data?.rows || [];
    const tableNames = rows.map((row) => String(getRowValue(row, 0)));

    // Prefer detailed resource export tables if present to avoid mixing schemas and double counting.
    const resourceTables = tableNames.filter((name) => name.startsWith('gcp_billing_export_resource_v1_'));
    const standardTables = tableNames.filter((name) => name.startsWith('gcp_billing_export_v1_'));
    const selected = resourceTables.length > 0 ? resourceTables : standardTables;

    return selected.map((name) => `${projectId}.${datasetId}.${name}`);
};

const loadBillingAccountMap = async () => {
    const response = await cloudbilling.billingAccounts.list();
    const items = response?.data?.billingAccounts || [];
    const map = new Map();

    for (const item of items) {
        const fullName = String(item?.name || '');
        const id = fullName.replace('billingAccounts/', '');
        if (!id) continue;
        map.set(id, {
            billingAccountId: id,
            billingAccountName: item?.displayName || id
        });
    }

    return map;
};

router.get('/', async (req, res) => {
    try {
        const authClient = await google.auth.getClient({
            scopes: [
                'https://www.googleapis.com/auth/bigquery.readonly',
                'https://www.googleapis.com/auth/cloud-billing.readonly'
            ]
        });
        google.options({ auth: authClient });

        const projectId = process.env.GCP_PROJECT_ID;
        const datasetId = process.env.BILLING_BQ_EXPORT_DATASET || DEFAULT_BQ_DATASET;
        const bqLocation = process.env.BILLING_BQ_LOCATION || DEFAULT_BQ_LOCATION;
        const accountIdFilter = String(req.query.billingAccountId || '').trim();
        const { year, month, startIso, endIso, periodLabel } = buildPeriod(req.query.year, req.query.month);

        if (!projectId) {
            return res.status(400).json({
                error: 'GCP_PROJECT_ID is not configured'
            });
        }

        const tableRefs = await resolveBillingTables({
            projectId,
            datasetId,
            location: bqLocation
        });

        if (tableRefs.length === 0) {
            return res.status(400).json({
                error: 'Billing export table not found',
                message: `No table like gcp_billing_export_resource_v1_* or gcp_billing_export_v1_* found in ${projectId}.${datasetId} yet. Billing export can take time to populate.`
            });
        }

        const perTableQueries = tableRefs.map((tableRef) => `
            SELECT
              billing_account_id,
              COALESCE(project.id, '(no-project)') AS project_id,
              SUM(cost + IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS total_cost,
              ANY_VALUE(currency) AS currency
            FROM \`${tableRef}\`
            WHERE usage_start_time >= TIMESTAMP(@periodStart)
              AND usage_start_time < TIMESTAMP(@periodEnd)
            GROUP BY billing_account_id, project_id
        `);

        const sql = `
            WITH combined AS (
              ${perTableQueries.join('\nUNION ALL\n')}
            )
            SELECT
              billing_account_id,
              project_id,
              SUM(total_cost) AS total_cost,
              ANY_VALUE(currency) AS currency
            FROM combined
            WHERE (@billingAccountId = '' OR billing_account_id = @billingAccountId)
            GROUP BY billing_account_id, project_id
            HAVING total_cost != 0
            ORDER BY billing_account_id, total_cost DESC
        `;

        const queryResponse = await bigquery.jobs.query({
            projectId,
            requestBody: {
                query: sql,
                useLegacySql: false,
                location: bqLocation,
                parameterMode: 'NAMED',
                queryParameters: [
                    { name: 'periodStart', parameterType: { type: 'STRING' }, parameterValue: { value: startIso } },
                    { name: 'periodEnd', parameterType: { type: 'STRING' }, parameterValue: { value: endIso } },
                    { name: 'billingAccountId', parameterType: { type: 'STRING' }, parameterValue: { value: accountIdFilter } }
                ]
            }
        });

        const rows = queryResponse?.data?.rows || [];
        const accountMap = await loadBillingAccountMap();
        const grouped = new Map();

        for (const row of rows) {
            const billingAccountId = String(getRowValue(row, 0) || '').trim();
            const projectId = String(getRowValue(row, 1) || '(no-project)');
            const cost = parseNumber(getRowValue(row, 2));
            const currency = String(getRowValue(row, 3) || 'USD');
            if (!billingAccountId) continue;

            if (!grouped.has(billingAccountId)) {
                const accountInfo = accountMap.get(billingAccountId);
                grouped.set(billingAccountId, {
                    billingAccountId,
                    billingAccountName: accountInfo?.billingAccountName || billingAccountId,
                    totalCost: 0,
                    currency,
                    projects: []
                });
            }

            const entry = grouped.get(billingAccountId);
            entry.projects.push({
                projectId,
                cost: Number(cost.toFixed(6)),
                currency
            });
            entry.totalCost += cost;
        }

        // Optional: include empty billing accounts only when explicitly requested.
        const includeEmptyAccounts = String(req.query.includeEmptyAccounts || '').toLowerCase() === 'true';
        if (includeEmptyAccounts) {
            for (const [billingAccountId, accountInfo] of accountMap.entries()) {
                if (accountIdFilter && billingAccountId !== accountIdFilter) continue;
                if (!grouped.has(billingAccountId)) {
                    grouped.set(billingAccountId, {
                        billingAccountId,
                        billingAccountName: accountInfo.billingAccountName,
                        totalCost: 0,
                        currency: 'USD',
                        projects: []
                    });
                }
            }
        }

        const billingAccounts = Array.from(grouped.values())
            .map((entry) => ({
                ...entry,
                totalCost: Number(entry.totalCost.toFixed(6)),
                projectCount: entry.projects.length
            }))
            .sort((a, b) => b.totalCost - a.totalCost);

        const totalCost = billingAccounts.reduce((sum, account) => sum + account.totalCost, 0);
        const totalProjects = billingAccounts.reduce((sum, account) => sum + account.projectCount, 0);

        res.json({
            period: periodLabel,
            periodStart: startIso,
            periodEnd: endIso,
            year,
            month,
            currency: billingAccounts.find((x) => x.currency)?.currency || 'USD',
            totalCost: Number(totalCost.toFixed(6)),
            totalProjects,
            totalBillingAccounts: billingAccounts.length,
            billingAccounts,
            source: {
                tables: tableRefs,
                dataset: `${projectId}.${datasetId}`,
                location: bqLocation
            }
        });
    } catch (error) {
        console.error('Error fetching billing data:', error);
        res.status(500).json({
            error: 'Failed to fetch billing data',
            details: error.message
        });
    }
});

export default router;
