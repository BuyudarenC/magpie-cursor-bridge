# Third-party notices

- **cursor-byok**, https://github.com/leookun/cursor-byok — MIT. Base: tag v1.0.1, commit `2068ab20513288e6a0289d33febe872a30608610`. `build.sh` checks this exact commit before applying `native.patch`. The original copyright and MIT license are retained in LICENSE and in the fetched source.
- **magpie-agent-cursor-bridge**, https://github.com/nodlles/magpie-agent-cursor-bridge — MIT. Compatibility patch and settings-journal implementation were adapted; original license retained in reference-LICENSE. `native.patch` contains the final modifications, including project-specific protections. The raw Bidi diagnostic dump was excluded.
- **jsonc-parser 3.3.1**, Microsoft — MIT. Dependency pinned in package.json and package-lock.json; its package includes its own license.
- Rust dependencies retain their individual licenses and are resolved by the fixed upstream Cargo.lock.

Original third-party notices must be retained when redistributing relevant code. This project makes no claim that the full third-party dependency graph has undergone an independent security audit.
