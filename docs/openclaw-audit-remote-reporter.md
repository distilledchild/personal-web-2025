# Remote OpenClaw Audit Reporter (Ubuntu)

This setup runs `openclaw security audit --deep` on your Ubuntu laptop and uploads the latest result to this backend.

## 1) Backend configuration

Set one env var on your backend runtime (Railway/Cloud Run/etc):

- `OPENCLAW_AUDIT_REPORT_TOKEN=<a long random token>`

Optional but recommended for remote-only mode:

- `ENABLE_OPENCLAW_AUDIT=false`

This disables server-local execution so only your laptop reports are shown.

## 2) Install script and systemd units on Ubuntu

```bash
mkdir -p ~/.local/bin ~/.config/systemd/user ~/.config
cp scripts/openclaw-audit-reporter.sh ~/.local/bin/openclaw-audit-reporter.sh
cp scripts/systemd/openclaw-audit-report.service ~/.config/systemd/user/
cp scripts/systemd/openclaw-audit-report.timer ~/.config/systemd/user/
chmod +x ~/.local/bin/openclaw-audit-reporter.sh
```

One-shot setup (recommended):

```bash
chmod +x scripts/systemd/setup-openclaw-audit-user-timer.sh
./scripts/systemd/setup-openclaw-audit-user-timer.sh
```

Create env file:

```bash
cat > ~/.config/openclaw-audit.env <<'ENV'
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
```

## 3) Enable timer

```bash
systemctl --user daemon-reload
systemctl --user enable --now openclaw-audit-report.timer
systemctl --user status openclaw-audit-report.timer
```

Ensure auto-run after reboot/logout:

```bash
sudo loginctl enable-linger $USER
loginctl show-user $USER -p Linger
```

Expected output: `Linger=yes`

Manual test:

```bash
~/.local/bin/openclaw-audit-reporter.sh
```

Logs:

```bash
journalctl --user -u openclaw-audit-report.service -n 200 --no-pager
```

## 4) Frontend behavior

In `/todo`, OpenClaw Audit shows:

- `Source`: reporter machine id
- `Last Seen`: when backend last received a report
- `Counts`: `critical`, `warn`, `info` (numeric)
- `critical > 0` is highlighted in red
- `STALE`: shown when no fresh update has arrived for 2+ hours
- `Overdue` warning: shown when `nextRunAt + 5m` has passed with no new report (check Ubuntu power/network/reporter)
- Polling interval: every 5 minutes (manual Refresh available)

Backend storage policy:
- Latest snapshot: `SECURITY_AUDIT_RESULT` (upsert)
- Run history: `SECURITY_AUDIT_HISTORY` (append)
- History retention: TTL 30 days
