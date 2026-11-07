#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")/.."
[[ "$(uname -s)" == Darwin && "$(uname -m)" == arm64 ]] || { echo 'Requires Apple Silicon macOS'; exit 1; }
command -v cargo >/dev/null
command -v node >/dev/null
mkdir -p .build
bridge_source="$(mktemp -d "$PWD/.build/source.XXXXXX")"
trap 'rm -rf -- "$bridge_source"' EXIT
git clone --depth 1 --branch v1.0.1 https://github.com/leookun/cursor-byok.git "$bridge_source"
[[ "$(git -C "$bridge_source" rev-parse HEAD)" == 2068ab20513288e6a0289d33febe872a30608610 ]]
git -C "$bridge_source" apply "$PWD/native/bridge.patch"
CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-4}" cargo build --manifest-path "$bridge_source/Cargo.toml" --target-dir "$PWD/.build/target" --release --locked -p cursor-server --bin cursor-magpie-bridge
mkdir -p bin
cp .build/target/release/cursor-magpie-bridge bin/cursor-private-engine
chmod 755 bin/cursor-private-engine
node --input-type=module -e 'import fs from "node:fs"; import {createHash} from "node:crypto"; const sha256=createHash("sha256").update(fs.readFileSync("bin/cursor-private-engine")).digest("hex"); fs.writeFileSync("integrity.json",JSON.stringify({version:"1.0.1",sha256},null,2)+"\n");'
echo 'Native engine built locally; integrity.json updated.'
