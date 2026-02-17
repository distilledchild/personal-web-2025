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

Create env file:

```bash
cat > ~/.config/openclaw-audit.env <<'ENV'
OPENCLAW_AUDIT_REPORT_URL=https://distilledchild.space/api/security-audit/report
OPENCLAW_AUDIT_REPORT_TOKEN=replace_with_the_same_backend_token
OPENCLAW_AUDIT_SOURCE_MACHINE=ubuntu-laptop
OPENCLAW_AUDIT_SOURCE_TIMEZONE=Asia/Seoul
OPENCLAW_AUDIT_INTERVAL_SECONDS=3600
ENV
```

## 3) Enable timer

```bash
systemctl --user daemon-reload
systemctl --user enable --now openclaw-audit-report.timer
systemctl --user status openclaw-audit-report.timer
```

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
- `STALE`: shown when no fresh update has arrived for 2+ hours

