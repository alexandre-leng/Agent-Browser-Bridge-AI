---
name: agentbridge
description: "Agent-Browser-Bridge-AI — Anti-detection browser control for AI agents. DOM-first, human-like interactions (Bezier), lead gen, extraction, MCP."
metadata:
  openclaw:
    emoji: "🌉"
    requires:
      bins:
        - agentbridge
      pkgs:
        - browser-agentbridge-ai
---

# AgentBridge 🌉 — Anti-Detection Browser Control for AI Agents

> **The browser that doesn't look like a bot.** Full anti-detection browser bridge for AI agents. DOM-first interactions, human-like mouse movements (Bezier), typing jitter, stealth anti-fingerprinting, and **MCP-native** (16+ tools) integration.

---

## 📋 Complete Feature Reference (40+ commands)

### 1. 🕹️ Navigation

| Command | Action | Internals |
|---------|--------|-----------|
| `navigate <url>` | Go to any URL | Uses `politeGoto` with human-safe waits |
| `navigate --annotate` | Navigate + auto-annotate elements | Two-in-one shortcut |
| `back` | Go back in history | Human pause (250-900ms) before + scroll after |
| `forward` | Go forward in history | Same human behavior |
| `search <query>` | Quick Google/Bing/DuckDuckGo search | `SEARCH_URLS[engine](query)` |
| `wait [ms]` | Wait for page load or N ms | Smart: no arg = wait for `load` event |

### 2. 🎯 Page Analysis

| Command | Action | Internals |
|---------|--------|-----------|
| `annotate` | ✅ **Screenshot + numbered DOM tree** | All interactive elements with stable refs, roles, names, boxes |
| `summary` | Page metadata (URL, title, element count) | Quick overview |
| `visibleText` | Extract visible DOM text | Filters: `--filter`, `--filter-any`, `--filter-lines`, `--emails`, `--phones` |
| `screenshot [--full-page]` | Full-page or viewport screenshot | Saves to `logs/screenshots/` + returns URL + base64 |

### 3. 🖱️ Element Interaction

| Command | Action | Internals |
|---------|--------|-----------|
| `click <ref>` | ✅ Click numbered element | Bezier mouse move → human pause → click with delay (15-60ms) |
| `click <text>` | Click visible text (fuzzy match) | Uses DOM query, not annotation ref |
| `doubleClick <ref>` | Double-click element | Same anti-detection pipeline |
| `type <ref> <text>` | ✅ Type into form field | Clear first (Ctrl+A/Delete) then human typing with jitter |
| `press <key>` | Press keyboard key | Smart: Enter triggers waitForNavigation |
| `hover <ref>` | Hover over element | Mouse move without click |
| `select <ref> <option>` | Select dropdown option | Supports `<select>` elements |

### 4. 🔍 Smart Text Search

| Command | Action | Internals |
|---------|--------|-----------|
| `findText <text>` | ✅ Search text (scrolls if needed) | Scans all visible DOM, scores by relevance + viewport |
| `clickText <text>` | ✅ Find AND click text | Coordinates first, then falls back to agent.click(ref) |
| Options | `--timeout-ms`, `--max-scrolls`, `--exact` | Fine-grained control |

### 5. 📄 Structured Extraction

| Command | Action | Internals |
|---------|--------|-----------|
| `extract article` | Article content (h1 + all paragraphs) | CSS selector driven |
| `extract table` | ✅ HTML tables + ARIA grids | Detects `<table>` AND `role="grid"` |
| `extract form` | Map all form fields with labels | Full input/select/textarea analysis |
| `extract listings` | ✅ Directory/listings extraction | Names, ratings, reviews, addresses, phones, hours |
| `extract marketplace` | ✅ E-commerce scraping | Titles, prices, locations, images, delivery, sponsored |
| `extract search-results` | ✅ Search engine SERP extraction | Organic/sponsored/video classification |
| `extract google-maps` | ✅ Maps/local business extraction | Names, phones, ratings, reviews, addresses, hours |
| `extract custom` | Custom CSS/XPath schema | `--schema` with `itemSelector` + `fields` |
| Options | `--limit=N`, `--format=json|csv`, `--out=file` | All outputs |

### 6. 📧 Lead Generation Pipeline

| Command | Action | Internals |
|---------|--------|-----------|
| `scrape-emails <query>` | 🔥 **Full pipeline**: search → visit each result → extract emails → CSV | Auto-pagination, dedup, CSV export |
| Options | `--limit=N` (default 20), `--out=file.csv`, `--engine=google|bing`, `--fast`, `--pages=N` | |
| `extract-emails <url>` | Single-page email extraction | Scans HTML + visible text, dedup |
| `extract-phones <url>` | ✅ Single-page phone extraction | Uses `libphonenumber-js`, French (+33) support, excludes ref/code/SIRET patterns |
| `scrape` | Full marketplace scraper | Same as `extract marketplace` |

### 7. 🌐 Web Search

| Command | Action | Internals |
|---------|--------|-----------|
| `webSearch <query>` | ✅ Full web search with auto-pagination | Google/Bing/DuckDuckGo, dedup results |
| Options | `--limit=N`, `--engine`, `--pages=N`, `--organic`, `--out=file.json` | |
| `siteSearch <query>` | Use current site's built-in search form | Smart field detection (search, recherche, q) |

### 8. 🧍 Human Behavior Emulation

| Command | Action | Internals |
|---------|--------|-----------|
| `scan` | 🔥 Human-like page reading | Scroll → read → pause → scroll... with configurable timing |
| `idle [ms]` | Wait + random cursor movement | Looks human even while "doing nothing" |
| `jitter [radius] [n]` | Small cursor hesitation | Realistic micro-movements |
| `skim [steps] [px]` | Natural scroll + read | Alternates scroll/pause like a real user |
| `backtrack` | Scroll up a bit + pause | Emulates re-reading something |
| `focusCycle [n]` | Tab through controls naturally | Presses Tab with random pauses |

### 9. ⏱️ Timing & Anti-Spam

| Command | Action | Internals |
|---------|--------|-----------|
| `timing get` | View current human timing profile | consultSpeed, WPM ranges, feedback interval |
| `timing set consultSpeed=2` | Adjust reading speed | 0.25 (slow) to 8 (fast) |
| `timing reset` | Back to defaults | Always safe |
| `antispam` | Check page for anti-bot blockers | Non-throwing check, returns blocked/unblocked |

### 10. 👁️ Vision System

| Command | Action | Internals |
|---------|--------|-----------|
| `vision.start` | Start live frame streaming | FPS-configurable, sends frames via WebSocket |
| `vision.stop` | Stop streaming | Clean shutdown |
| `agent.hover` | Hover with element find | Uses agent element tracking |

### 11. ⚡ Automation & Batch

| Command | Action | Internals |
|---------|--------|-----------|
| `run <cmd1> <args1> ...` | ✅ Chain commands in sequence | Preserves browser state between steps |
| `batch <recipe.json>` | ✅ Execute JSON recipe file | Lightweight batch (no interpolation) |
| `repl` | ✅ Interactive REPL mode | WebSocket REPL, type commands live |
| `script <file.json>` | Full script with variable interpolation | `${stepN.result.path}` references |
| `start` | Launch the bridge server | Spawns Express + WebSocket server |

### 12. 🔄 Special Combos

| Command | Action | Internals |
|--------|--------|-----------|
| `combo.searchAndClick <query>` | Search Google → click first result | One-shot for quick lookups |
| `agent.search <query>` | Search + extract 10 results | Structured result extraction |
| `agent.task <goal>` | 🔥 **Full autonomous task**: search → auto-cookies → extract locals + web | Combines maps extraction + search results |

### 13. 🧪 Page JavaScript Execution

| Command | Action | Internals |
|--------|--------|-----------|
| `exec.script <code>` | ✅ Run arbitrary JS in page context | Protected by security token |
| `dom.html` | Get full page HTML | With optional selector filter |
| `dom.inspect <query>` | Element inspection | Tag, id, class, text, bounding box |
| `dom.search <text>` | Text search on page | Returns positions |

### 14. 🧩 MCP Mode (16+ Tools)

| Tool | Description | Input Schema |
|------|-------------|-------------|
| `browser_status` | Check browser connection health | — |
| `navigate` | Navigate to URL | `{ url, autoAnnotate?, sessionId? }` |
| `annotate_page` | Screenshot + numbered elements | `{ noImage?, sessionId? }` |
| `click_ref` | Click element by ref | `{ ref: number|string, sessionId? }` |
| `type_ref` | Type text into field | `{ ref, text, clearFirst?, sessionId? }` |
| `inspect_forms` | Map visible forms + fields | `{ sessionId? }` |
| `fill_form` | Auto-fill form by labels | `{ values|fields, clearFirst?, sessionId? }` |
| `submit_form` | Submit active form | `{ query?, selector?, timeout?, sessionId? }` |
| `site_search` | Use current site search | `{ query, field?, submit?, timeout?, sessionId? }` |
| `web_search` | Full web search with pagination | `{ query, engine?, limit?, pages?, sessionId? }` |
| `extract_schema` | Custom CSS/XPath extraction | `{ schema: { fields }, llm?, sessionId? }` |
| `extract_marketplace` | Marketplace listing scraper | `{ limit?, format?, sessionId? }` |
| `human_timing_get` | Get timing profile | — |
| `human_timing_set` | Adjust timing for speed/slow | `{ consultSpeed?, focusedWpmMin/Max?, etc }` |
| `human_antispam_check` | Check page for blocking | — |
| `browser_command` (raw) | Any AgentBridge command (opt-in) | `{ type, payload }` — requires `BRIDGE_MCP_ALLOW_RAW=1` |

### 15. 🖥️ Live Viewer

```
http://localhost:8080/viewer
```

Watch the browser in real time via web GUI. Debug interactions, inspect the page, take over manually when needed.

---

## 🛡️ Anti-Detection System Details

| Feature | How It Works |
|---------|-------------|
| **Bezier cursor** | Cubic Bezier curves (24-90 steps) for every mouse movement — never a straight line |
| **Position tracking** | Server-side cursor state; every move starts from last known position, never (0,0) |
| **Typing jitter** | Each character typed with variable delay (15-180ms between keystrokes) |
| **Timing profiles** | 10 parameters adjustable live: consultSpeed, focusedWpmMin/Max, skimWpmMin/Max, pause ranges |
| **Anti-spam** | Structured page checks for known blocking patterns; returns clean result instead of throwing |
| **Stealth scripts** | Patches `navigator.webdriver` (=undefined), injects `window.chrome` runtime, spoofs `languages`, `plugins`, `platform`, `userAgent`, WebGL vendor |
| **Cookie auto-accept** | Detects and clicks "Accept all" / "Tout accepter" buttons automatically |
| **Human behavior layer** | scroll+read cycles, pause+backtrack, idle cursor jitter, focus cycles — all configurable |
| **Flash click** | Visual indicator on click position (visible when not headless) |

## 🏆 Anti-Detection Bypass Comparison

| Tool | YouTube | Google Search | Cloudflare JS sites | Bot score |
|------|---------|---------------|-------------------|-----------|
| curl / wget | ❌ 429 | ❌ Blocked | ❌ JS-locked | 100% bot |
| Puppeteer-Extra + StealthPlugin | ❌ "Sign in" overlay | ❌ Detected | ⚠️ Partial | ~60% |
| Playwright + stealth | ❌ Blocked | ❌ Detected | ⚠️ Partial | ~55% |
| Selenium + undetected | ❌ Blocked | ❌ Detected | ❌ Blocked | ~70% |
| Camoufox | ❌ Sign-in prompt | ⚠️ Partial | ⚠️ Partial | ~35% |
| yt-dlp (no cookies) | ❌ LOGIN_REQUIRED | N/A | N/A | N/A |
| Tor Browser | ❌ Blocked by most | ❌ CAPTCHA loop | ❌ Blocked | 100% |
| Puppeteer-Extra | ❌ "Sign in" | ❌ Detected | ⚠️ Works some | ~50% |
| **AgentBridge + Chrome CDP** | ✅ **Full access** | ✅ **Works** | ✅ **Works** | **<5%** |

---

## 🔧 Use Cases

1. **Bug Bounty & Security** — Automate recon, bypass WAF, navigate authenticated sessions, extract findings
2. **Lead Generation** — `scrape-emails "AI consultants France" --limit=100 --out=leads.csv`
3. **Web Scraping** — JS-heavy e-commerce, directories, marketplaces
4. **SaaS Automation** — Fill forms, navigate dashboards, extract reports
5. **Market Research** — Price monitoring, competitor analysis, directory scraping
6. **YouTube Research** — No-cookie access to descriptions, comments, metadata, related videos
7. **AI Training Data** — Collect real-world content from protected sites
8. **Data Pipelines** — Integrate with Claude, Cursor, Windsurf via MCP or n8n/Make via HTTP

---

## 🚀 Quick Start

```bash
# 1. Install
npm install -g browser-agentbridge-ai
npm run build

# 2. Start the bridge server
agentbridge start
# → WebSocket: ws://localhost:8080/ws/browser-bridge
# → Live GUI:  http://localhost:8080/viewer

# 3. Navigate
agentbridge navigate https://example.com

# 4. Analyze
agentbridge annotate

# 5. Interact
agentbridge click 3
agentbridge type 5 "hello world"
agentbridge press Enter

# 6. Extract
agentbridge extract article --format=json
agentbridge extract-emails https://example.com/contact

# 7. Lead gen (one command)
agentbridge scrape-emails "AI consultants France" --limit=50 --out=leads.csv --fast

# 8. REPL (interactive)
agentbridge repl
```

### Without Playwright (CDP Fallback)

Works on any system with Chrome, even when Playwright isn't supported:

```bash
# Launch Chrome headless with remote debugging
google-chrome --headless=new --no-sandbox --remote-debugging-port=9222 &
sleep 1

# Get WebSocket URL
WS_URL=$(curl -s http://127.0.0.1:9222/json/version | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['webSocketDebuggerUrl'])")

# Point AgentBridge at it
export CHROME_CDP_URL="$WS_URL"
export BRIDGE_HEADLESS=true
npx agentbridge start
```

### MCP Integration

```bash
# Start MCP server (stdin/stdout transport for Claude/Cursor/Windsurf)
npm run mcp

# Now you can use all 16+ MCP tools in any MCP-compatible host
```

---

## 📄 Output Formats

| Format | Available for | Example |
|--------|--------------|---------|
| **JSON** | All extract commands | `--format=json` |
| **CSV** | Marketplace, listings, emails | `--format=csv --out=data.csv` |
| **Screenshots** | Annotate, screenshot, vision | JPEG, return URL + base64 |
| **Visible text** | `visibleText` | Filtered or raw |
| **File save** | Any extraction | `--out=file.json` or `--out=data.csv` |
| **JSON Lines** | CLI output | `--json-lines` flag |

---

## 🔗 Links

- **ClawHub**: https://clawhub.ai/skills/agentbridge
- **npm package**: `npm install -g browser-agentbridge-ai`
- **Source code**: https://github.com/alexandre-leng/AgentBridge-AI
- **Author**: Alexandre Leng (@alexandre-leng)

---

## 📦 Requirements

- **Node.js** ^18.0.0
- **Browser**: Chromium (via Playwright) OR any Chrome-based browser via CDP
- **RAM**: ~100MB for bridge server + browser memory

## License

MIT-0 — Free to use, modify, and redistribute. No attribution required.
