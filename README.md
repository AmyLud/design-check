# design-check

A CLI tool that compares a Figma design frame against a live rendered web page and reports visual discrepancies.

## What it checks

- **Text presence** — flags text from the Figma design that is missing from the page
- **Font size** — flags size mismatches beyond a configurable threshold
- **Font weight** — flags weight mismatches (e.g. regular vs bold)
- **Size** — flags element width/height differences
- **Border radius** — flags rounded corner differences

## Installation

### Prerequisites

- Node.js 18 or higher
- A Figma Personal Access Token (see below)

### Install and build

```bash
cd design-check
npm install
npm run build
```

### Link globally (optional)

```bash
npm link
```

After linking you can run `design-check` from anywhere in your terminal.

## Getting a Figma token

1. Open Figma in your browser
2. Click your avatar in the top-left → **Settings**
3. Scroll to **Personal access tokens**
4. Click **Generate new token**, give it a name, and copy the value

## Configuration

Set your token as an environment variable. The easiest way is to create a `.env` file in the project root (or in whatever directory you run the tool from):

```
FIGMA_TOKEN=your-figma-personal-access-token-here
```

See `.env.example` for a template.

Alternatively, export it in your shell:

```bash
export FIGMA_TOKEN=your-token-here
```

## Usage

```
design-check --figma <figma-url> [--url <page-url> | --route <path>] [options]
```

### Required flags

| Flag | Description |
|------|-------------|
| `--figma <link>` | Figma frame URL. Must include a `?node-id=` parameter. |

### URL flags (one required)

| Flag | Description |
|------|-------------|
| `--url <url>` | Full URL of the page to render (e.g. `http://localhost:3000/dashboard`) |
| `--route <path>` | Route path; uses `http://localhost:3000` as the base (e.g. `--route /dashboard`) |

### Optional flags

| Flag | Default | Description |
|------|---------|-------------|
| `--viewport <WxH>` | `1440x1024` | Browser viewport size |
| `--config <path>` | `./design-check.json` | Path to a config file |
| `--output <dir>` | `./artifacts` | Directory for saved artifacts |
| `--verbose` | off | Print detailed progress and confidence scores |
| `--json` | off | Output the report as JSON (useful for CI) |

## Examples

**Compare a Figma frame to a locally running page:**
```bash
design-check \
  --figma "https://www.figma.com/design/AbCdEfGhIj/My-App?node-id=12%3A34" \
  --url http://localhost:3000/home
```

**Use a route path shorthand:**
```bash
design-check \
  --figma "https://www.figma.com/design/AbCdEfGhIj/My-App?node-id=12%3A34" \
  --route /home
```

**Different viewport (mobile):**
```bash
design-check \
  --figma "https://www.figma.com/file/AbCdEfGhIj/My-App?node-id=12%3A34" \
  --url http://localhost:3000/home \
  --viewport 375x812
```

**Verbose mode to see confidence scores:**
```bash
design-check \
  --figma "https://www.figma.com/design/AbCdEfGhIj/My-App?node-id=12%3A34" \
  --url http://localhost:3000/home \
  --verbose
```

**JSON output (for CI pipelines):**
```bash
design-check \
  --figma "https://www.figma.com/design/AbCdEfGhIj/My-App?node-id=12%3A34" \
  --url http://localhost:3000/home \
  --json | jq '.metadata.summary'
```

**Custom output directory:**
```bash
design-check \
  --figma "https://www.figma.com/design/AbCdEfGhIj/My-App?node-id=12%3A34" \
  --url http://localhost:3000/home \
  --output ./ci-artifacts
```

## Config file

You can place a `design-check.json` in your project root to set default thresholds and viewport:

```json
{
  "viewport": {
    "width": 1440,
    "height": 1024
  },
  "thresholds": {
    "fontSizeDelta": 2,
    "fontWeightTolerance": 100,
    "widthDelta": 4,
    "heightDelta": 4,
    "borderRadiusDelta": 2
  }
}
```

All fields are optional — any omitted values fall back to the defaults shown above.

| Threshold | Default | Meaning |
|-----------|---------|---------|
| `fontSizeDelta` | `2` | Max allowed font size difference in px |
| `fontWeightTolerance` | `100` | Max allowed font weight difference (e.g. 400 vs 500 = 100) |
| `widthDelta` | `4` | Max allowed width difference in px |
| `heightDelta` | `4` | Max allowed height difference in px |
| `borderRadiusDelta` | `2` | Max allowed border-radius difference in px |

## Artifacts

After each run the tool saves debug artifacts to the output directory (default `./artifacts`):

| File | Description |
|------|-------------|
| `screenshot.png` | Full screenshot of the rendered page at the given viewport |
| `figma-frame.json` | Raw Figma API response for the target frame |
| `rendered-dom.json` | All DOM nodes extracted from the rendered page |
| `findings.json` | Complete report in JSON format |

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | No errors found (warnings and info findings are OK) |
| `1` | One or more error-severity findings, or a fatal runtime error |

## How to get a Figma frame link

1. Open your Figma file
2. Click on the frame you want to check (the top-level frame, not a nested element)
3. Right-click → **Copy link** — or use **Cmd/Ctrl+L**
4. The copied URL will look like: `https://www.figma.com/design/AbCdEfGhIj/App-Name?node-id=12%3A34&...`
5. Pass this URL directly to `--figma`

## Development

```bash
# Run without building (uses ts-node)
npm run dev -- --figma "..." --url http://localhost:3000

# Build TypeScript
npm run build

# Run built output
npm start -- --figma "..." --url http://localhost:3000
```
