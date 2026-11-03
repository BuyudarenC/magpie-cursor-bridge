#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
command -v node >/dev/null
command -v npm >/dev/null
command -v magpie >/dev/null
npm ci --ignore-scripts
npm test
bash build.sh
bridge_root="$HOME/.config/magpie-cursor-private"
umask 077
mkdir -p "$bridge_root"
chmod 700 "$bridge_root"
CURSOR_BYOK_DATA_DIR="$bridge_root/data" ./bin/cursor-private-engine --init-ca
bridge_cert="$bridge_root/data/ca/ca.crt"
if ! /usr/bin/security verify-cert -c "$bridge_cert" -p ssl >/dev/null 2>&1; then
  echo 'macOS will request trust for this locally generated CA. Review the prompt before approving.'
  /usr/bin/security add-trusted-cert -r trustRoot -p ssl -k "$HOME/Library/Keychains/login.keychain-db" "$bridge_cert"
fi
/usr/bin/security verify-cert -c "$bridge_cert" -p ssl >/dev/null
magpie plugin add "$PWD"
node manage.js install
echo 'In Magpie select Cursor · 私人桥接, choose a model, then restart Cursor.'
