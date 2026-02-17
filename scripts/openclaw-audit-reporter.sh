#!/usr/bin/env bash
set -euo pipefail

REPORT_URL="${OPENCLAW_AUDIT_REPORT_URL:-https://distilledchild.space/api/security-audit/report}"
REPORT_TOKEN="${OPENCLAW_AUDIT_REPORT_TOKEN:-}"
SOURCE_MACHINE="${OPENCLAW_AUDIT_SOURCE_MACHINE:-$(hostname)}"
SOURCE_TIMEZONE="${OPENCLAW_AUDIT_SOURCE_TIMEZONE:-$(timedatectl show -p Timezone --value 2>/dev/null || echo UTC)}"
INTERVAL_SECONDS="${OPENCLAW_AUDIT_INTERVAL_SECONDS:-3600}"

if [[ -z "${REPORT_TOKEN}" ]]; then
  echo "[openclaw-audit-reporter] OPENCLAW_AUDIT_REPORT_TOKEN is required" >&2
  exit 1
fi

if ! [[ "${INTERVAL_SECONDS}" =~ ^[0-9]+$ ]]; then
  echo "[openclaw-audit-reporter] OPENCLAW_AUDIT_INTERVAL_SECONDS must be numeric" >&2
  exit 1
fi

output_file="$(mktemp)"
trap 'rm -f "${output_file}"' EXIT

start_epoch="$(date +%s)"
started_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if openclaw security audit --deep >"${output_file}" 2>&1; then
  exit_code=0
  status="success"
else
  exit_code=$?
  status="failed"
fi

end_epoch="$(date +%s)"
finished_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
reported_at="${finished_at}"
duration_ms="$(( (end_epoch - start_epoch) * 1000 ))"
next_run_epoch="$(( end_epoch + INTERVAL_SECONDS ))"
next_run_at="$(date -u -d "@${next_run_epoch}" +"%Y-%m-%dT%H:%M:%SZ")"

payload="$(python3 - "${status}" "${exit_code}" "${started_at}" "${finished_at}" "${next_run_at}" "${duration_ms}" "${SOURCE_MACHINE}" "${SOURCE_TIMEZONE}" "${reported_at}" < "${output_file}" <<'PY'
import json
import sys

status, exit_code, started_at, finished_at, next_run_at, duration_ms, source_machine, source_timezone, reported_at = sys.argv[1:]
output = sys.stdin.read()

payload = {
    "command": "openclaw security audit --deep",
    "status": status,
    "exitCode": int(exit_code),
    "startedAt": started_at,
    "finishedAt": finished_at,
    "nextRunAt": next_run_at,
    "durationMs": int(duration_ms),
    "output": output,
    "sourceMachine": source_machine,
    "sourceTimezone": source_timezone,
    "reportedAt": reported_at,
}

print(json.dumps(payload))
PY
)"

if ! curl --fail --silent --show-error \
  -X POST "${REPORT_URL}" \
  -H "Authorization: Bearer ${REPORT_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "${payload}"; then
  echo "[openclaw-audit-reporter] failed to upload audit report" >&2
  exit 1
fi

exit "${exit_code}"
