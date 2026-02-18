#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

mkdir -p "${HOME}/.local/bin" "${HOME}/.config/systemd/user" "${HOME}/.config"

install -m 0755 "${PROJECT_ROOT}/scripts/openclaw-audit-reporter.sh" "${HOME}/.local/bin/openclaw-audit-reporter.sh"
install -m 0644 "${PROJECT_ROOT}/scripts/systemd/openclaw-audit-report.service" "${HOME}/.config/systemd/user/openclaw-audit-report.service"
install -m 0644 "${PROJECT_ROOT}/scripts/systemd/openclaw-audit-report.timer" "${HOME}/.config/systemd/user/openclaw-audit-report.timer"

if [[ ! -f "${HOME}/.config/openclaw-audit.env" ]]; then
  cat > "${HOME}/.config/openclaw-audit.env" <<'ENV'
OPENCLAW_AUDIT_REPORT_URL=https://distilledchild.space/api/security-audit/report
OPENCLAW_AUDIT_REPORT_TOKEN=replace_with_the_same_backend_token
OPENCLAW_AUDIT_SOURCE_MACHINE=ubuntu-laptop
OPENCLAW_AUDIT_SOURCE_TIMEZONE=Asia/Seoul
OPENCLAW_AUDIT_INTERVAL_SECONDS=600
OPENCLAW_AUDIT_UPLOAD_MAX_RETRIES=3
OPENCLAW_AUDIT_UPLOAD_RETRY_DELAY_SECONDS=5
OPENCLAW_AUDIT_UPLOAD_CONNECT_TIMEOUT_SECONDS=10
OPENCLAW_AUDIT_UPLOAD_MAX_TIME_SECONDS=30
ENV
  echo "Created ${HOME}/.config/openclaw-audit.env (fill token before running)"
fi

systemctl --user daemon-reload
systemctl --user enable --now openclaw-audit-report.timer

# Keep user systemd running across reboot/logouts.
if command -v loginctl >/dev/null 2>&1; then
  if sudo -n loginctl enable-linger "${USER}" >/dev/null 2>&1; then
    echo "Enabled linger for ${USER}."
  else
    echo "Could not enable linger without sudo prompt."
    echo "Run once manually: sudo loginctl enable-linger ${USER}"
  fi
fi

systemctl --user status openclaw-audit-report.timer --no-pager || true
