#!/usr/bin/env bash
set -euo pipefail

REPORT_URL="${OPENCLAW_AUDIT_REPORT_URL:-https://distilledchild.space/api/security-audit/report}"
REPORT_TOKEN="${OPENCLAW_AUDIT_REPORT_TOKEN:-}"
SOURCE_MACHINE="${OPENCLAW_AUDIT_SOURCE_MACHINE:-$(hostname)}"
SOURCE_TIMEZONE="${OPENCLAW_AUDIT_SOURCE_TIMEZONE:-$(timedatectl show -p Timezone --value 2>/dev/null || echo UTC)}"
INTERVAL_SECONDS="${OPENCLAW_AUDIT_INTERVAL_SECONDS:-600}"
UPLOAD_MAX_RETRIES="${OPENCLAW_AUDIT_UPLOAD_MAX_RETRIES:-3}"
UPLOAD_RETRY_DELAY_SECONDS="${OPENCLAW_AUDIT_UPLOAD_RETRY_DELAY_SECONDS:-5}"
UPLOAD_CONNECT_TIMEOUT_SECONDS="${OPENCLAW_AUDIT_UPLOAD_CONNECT_TIMEOUT_SECONDS:-10}"
UPLOAD_MAX_TIME_SECONDS="${OPENCLAW_AUDIT_UPLOAD_MAX_TIME_SECONDS:-30}"

if [[ -z "${REPORT_TOKEN}" ]]; then
  echo "[openclaw-audit-reporter] OPENCLAW_AUDIT_REPORT_TOKEN is required" >&2
  exit 1
fi

if ! [[ "${INTERVAL_SECONDS}" =~ ^[0-9]+$ ]]; then
  echo "[openclaw-audit-reporter] OPENCLAW_AUDIT_INTERVAL_SECONDS must be numeric" >&2
  exit 1
fi

for numeric_var_name in \
  UPLOAD_MAX_RETRIES \
  UPLOAD_RETRY_DELAY_SECONDS \
  UPLOAD_CONNECT_TIMEOUT_SECONDS \
  UPLOAD_MAX_TIME_SECONDS; do
  numeric_var_value="${!numeric_var_name}"
  if ! [[ "${numeric_var_value}" =~ ^[0-9]+$ ]]; then
    echo "[openclaw-audit-reporter] ${numeric_var_name} must be numeric" >&2
    exit 1
  fi
done

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
import re
import sys

status, exit_code, started_at, finished_at, next_run_at, duration_ms, source_machine, source_timezone, reported_at = sys.argv[1:]
output = sys.stdin.read()

summary_match = re.search(r"summary:\s*(\d+)\s*critical[^\d]+(\d+)\s*warn[^\d]+(\d+)\s*info", output, re.IGNORECASE)
if summary_match:
    critical = int(summary_match.group(1))
    warn = int(summary_match.group(2))
    info = int(summary_match.group(3))
else:
    critical = len(re.findall(r"\bcritical\b", output, flags=re.IGNORECASE))
    warn = len(re.findall(r"\bwarn(?:ing)?\b", output, flags=re.IGNORECASE))
    info = len(re.findall(r"\binfo\b", output, flags=re.IGNORECASE))

payload = {
    "command": "openclaw security audit --deep",
    "status": status,
    "exitCode": int(exit_code),
    "critical": critical,
    "warn": warn,
    "info": info,
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

upload_attempt=1
while (( upload_attempt <= UPLOAD_MAX_RETRIES )); do
  if curl --fail --silent --show-error \
    --connect-timeout "${UPLOAD_CONNECT_TIMEOUT_SECONDS}" \
    --max-time "${UPLOAD_MAX_TIME_SECONDS}" \
    -X POST "${REPORT_URL}" \
    -H "Authorization: Bearer ${REPORT_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "${payload}"; then
    break
  fi

  if (( upload_attempt == UPLOAD_MAX_RETRIES )); then
    echo "[openclaw-audit-reporter] failed to upload audit report after ${UPLOAD_MAX_RETRIES} attempts" >&2
    exit 1
  fi

  echo "[openclaw-audit-reporter] upload attempt ${upload_attempt}/${UPLOAD_MAX_RETRIES} failed, retrying in ${UPLOAD_RETRY_DELAY_SECONDS}s" >&2
  sleep "${UPLOAD_RETRY_DELAY_SECONDS}"
  upload_attempt=$((upload_attempt + 1))
done

exit "${exit_code}"
