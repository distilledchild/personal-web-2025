# OpenClaw Audit End-to-End Flow

This document explains the full flow for OpenClaw audit in this project:

1. Ubuntu runs `openclaw security audit --deep`
2. Ubuntu posts the result to backend API
3. Backend validates token and stores data in MongoDB (latest + history)
4. Frontend polls latest status and renders health/warnings

## 1) Components and Responsibilities

- Ubuntu reporter:
  - File: `scripts/openclaw-audit-reporter.sh`
  - Runs OpenClaw command
  - Builds JSON payload
  - Sends `POST /api/security-audit/report`
- Scheduler:
  - Files: `scripts/systemd/openclaw-audit-report.service`, `scripts/systemd/openclaw-audit-report.timer`
  - Default interval: every 10 minutes (`OnUnitActiveSec=10m`)
- Backend:
  - File: `server/index.js`
  - API:
    - `POST /api/security-audit/report`
    - `GET /api/security-audit/latest?email=...`
- Frontend panel:
  - File: `pages/Todo.tsx`
  - Polls every 5 minutes and supports manual refresh

## 2) API Contract

### POST `/api/security-audit/report`

Auth:
- Preferred: `Authorization: Bearer <OPENCLAW_AUDIT_REPORT_TOKEN>`
- Optional fallback: `x-api-key: <BLOG_API_KEY>` when `OPENCLAW_AUDIT_ALLOW_BLOG_API_KEY=true`

Payload fields (main):
- `command`
- `status`
- `exitCode`
- `critical`
- `warn`
- `info`
- `startedAt`
- `finishedAt`
- `nextRunAt`
- `durationMs`
- `output`
- `sourceMachine`
- `sourceTimezone`
- `reportedAt`

### GET `/api/security-audit/latest?email=<admin_email>`

- Requires admin user in `MEMBER` collection.
- Returns latest document for key `openclaw_security_audit_deep`.
- Includes `critical`, `warn`, `info`, timestamps, status, source, output.

## 3) Database Storage

Collection:
- `SECURITY_AUDIT_RESULT`
- `SECURITY_AUDIT_HISTORY`

Model:
- `SecurityAuditResult` in `server/index.js`

Primary record key:
- `key = openclaw_security_audit_deep`

Write behavior:
- `SECURITY_AUDIT_RESULT`: `findOneAndUpdate(..., { upsert: true })`
- `SECURITY_AUDIT_HISTORY`: one document appended per report/run

Core fields:
- `status`, `startedAt`, `finishedAt`, `nextRunAt`, `durationMs`, `exitCode`
- `critical`, `warn`, `info`
- `output` (ANSI-stripped)
- `sourceMachine`, `sourceTimezone`, `reportedAt`, `updatedAt`

History retention:
- TTL index on `SECURITY_AUDIT_HISTORY.createdAt`
- Retention window: 30 days
- Implementation: `expireAfterSeconds = 2592000`

## 4) Frontend Health Logic

In `/todo` OpenClaw panel:
- Poll interval: 5 minutes
- Shows:
  - Status
  - Source / Last Run / Last Seen / Next Run
  - Counts: `critical`, `warn`, `info`
- Visual rules:
  - `critical > 0`: red badge
  - `STALE`: no fresh update for 2+ hours
  - `Overdue`: `nextRunAt + 5m` passed with no update

## 5) Recommended Auth Strategy

Recommended:
- Use dedicated token: `OPENCLAW_AUDIT_REPORT_TOKEN`

Optional (not preferred):
- Reuse blog key (`BLOG_API_KEY`) by setting:
  - `OPENCLAW_AUDIT_ALLOW_BLOG_API_KEY=true`

Reason to avoid sharing:
- Blast radius increases if one key leaks.
- Separate keys keep blog automation and audit ingestion isolated.

## 6) Ubuntu Setup (Reboot-Safe)

Use one-shot setup script:

```bash
chmod +x scripts/systemd/setup-openclaw-audit-user-timer.sh
./scripts/systemd/setup-openclaw-audit-user-timer.sh
sudo loginctl enable-linger $USER
loginctl show-user $USER -p Linger
```

Expected:
- `Linger=yes`
- user timer survives reboot/logout and keeps posting audit results.

## 7) Current Operating Mode

- Ubuntu reporter pushes every 10 minutes.
- Backend audit scheduler can be disabled with `ENABLE_OPENCLAW_AUDIT=false` (recommended when Ubuntu is source of truth).
- Frontend polls latest status every 5 minutes and shows stale/overdue warnings.
