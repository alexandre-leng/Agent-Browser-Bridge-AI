# Changelog

## Unreleased

### Security
- WebSocket upgrades from other web origins are now rejected when `BRIDGE_ALLOWED_ORIGINS` is unset (previously any page open in the user's browser could drive the bridge and read its cookies); a non-local `Host` is rejected when bound to localhost (DNS rebinding)
- `sessionId` values are sanitized before being used in screenshot/annotation/trace file names (path traversal)
- Typed text from `dom.type`, `input.text`, `form.fill`, `dom.fillForm` (also inside `batch` / `script.execute`) is redacted from traces; sensitive keys are matched case-insensitively

### Fixed
- Server crash (unhandled rejection) on a `null` / non-object WebSocket message; prototype names (`constructor`…) are no longer dispatched as commands; rate-limit replies carry the request `id`
- MCP server: logs go to stderr so they no longer corrupt the stdio JSON-RPC stream
- `search`, `agent.search`, `agent.task`, `combo.searchAndClick` and `web.search { useForm: false }` were always blocked by the polite direct-search guard; unknown engines now return a clear error
- XPath queries such as `(//a)[1]` or `/html/body/...` were parsed as CSS
- Numeric string refs (`"3"`, e.g. from scripts or `${stepN...}`) are looked up by id instead of fuzzy-matching a random unnamed element
- Elements inside nested iframes had their offsets counted twice in `page.annotate`
- Concurrent commands on a fresh session no longer launch (and leak) several browser contexts
- `script.execute`: `${stepN.path}` placeholders keep their type when they are the whole value
- `human.clickText` fallback and `vision.screenshot` now respect the active session
- `agent.select` targets the annotated `<select>` (names with quotes broke the selector); `form.fill` radios stay in the matched group
- `dom.extract` `form` no longer throws on ids with quotes; `listings` ratings are no longer taken from house numbers/postcodes
- `vision.start` after `vision.stop` no longer leaves the previous capture loop running
- `dom.fillForm` with a missing value typed "undefined"; `viewport.set` returned NaN sizes
- Viewer is served regardless of the working directory (and shipped in the npm package); `?token=` is forwarded to its WebSocket
- `agentbridge` CLI: no longer hangs after auto-starting the server, finds the server from the package root, rejects pending commands when the connection drops, writes valid CSV files
- `bridge` TS CLI: `extract --type X` mapping, broadcast events no longer treated as failures
- `install`: valid SKILL.md frontmatter; `--workspace <path>` before the target
- `package-lock.json` regenerated (it was out of sync with `package.json`, so `npm ci` failed)

## 3.2.8 (2026-05-19)

### Added
- `scrape-emails` command: full lead generation pipeline (search → visit → extract emails → CSV)
- `extract-emails` / `extract-phones` commands and server handlers
- `--fast` mode (`BRIDGE_SCRAPE_SPEED=fast`): minimal delays for automated scraping
- `--emails` / `--phones` filter flags on `visibleText`
- `--out` CSV/JSON export support on `webSearch`, `extract`, `scrape`
- `--json-lines` compact output mode
- `--version` / `-v` CLI flag
- `BRIDGE_URL` environment variable support in CLI
- CHANGELOG.md

### Fixed
- CLI `run` command: preserved browser state across commands in one WebSocket session
- CLI output: logs go to stderr, data to stdout (clean JSON parsing)
- `human.feedback` events no longer pollute stdout
- Auto-start server path resolution in fast mode

### Changed
- Unified version source (`src/version.ts` matches `package.json`)
- Docs consolidated (canonical install guide in `docs/install.md`)
- CI: Windows + Ubuntu test matrix, code coverage reporting, npm publish workflow
- Stealth patches reinforced for better anti-detection

## 3.2.7 (2026-05-19)

### Added
- REPL mode (`repl` command)
- Batch `run` command for multi-step workflows
- Unified CLI help with categorized commands
- `docs/install.md` with agent instruction line

### Changed
- Reduced CLI entry points (single `bridge-cli.cjs`)
- `bridge.cmd` now uses CJS CLI directly (no tsx dependency)

### Fixed
- Version mismatch: `src/version.ts` synced to `package.json`
- `--help` / `--version` flags now work

## 3.2.6 (2026-05-19)

### Added
- GitHub Packages registry configuration
- `@alexandre-leng/agentbridge-ai` scoped npm package

### Fixed
- Bin entries simplified to `agentbridge` and `bridge-check` (CJS wrappers)
- Repository field in package.json

## 3.2.5 (2026-05-19)

### Changed
- Package renamed to `browser-agentbridge-ai` for npm

## 3.2.4 (2026-05-19)

### Added
- GitHub release automation
- npm package publication

## 3.2.0 - 3.2.3

Initial published releases with core AgentBridge functionality:
- WebSocket browser bridge server
- DOM-first element annotation and interaction
- Human-like behavior (Bezier curves, typing, scroll inertia)
- 12 stealth patches for anti-detection
- MCP server for AI agent integration
- Web search with auto-pagination
- Structured data extraction (7 types)
- Multi-session isolation
- Trace recording and replay
- Polite browsing with adaptive throttling
- Docker support
