# design-check

A CLI tool that compares a Figma design frame against a live rendered web page and reports visual discrepancies. Run it locally or wire it into CI to get automatic PR comments.

## What it checks

| Check | Severity | Description |
|-------|----------|-------------|
| **Text presence** | Error | Text from the Figma design that is missing from the page |
| **Color** | Warning | Text color differs from the Figma fill color |
| **Contrast** | Error | Text fails WCAG AA contrast requirements |
| **Broken images** | Error | `<img>` elements that failed to load |
| **Font size** | Warning | Size differs beyond the configured threshold |
| **Font weight** | Warning | Weight differs beyond the configured tolerance |
| **Spacing** | Warning | Padding or margin differs from the Figma frame values |
| **Border radius** | Info | Corner radius differs beyond the configured threshold |

---

## Prerequisites

- Node.js 18 or higher
- A Figma Personal Access Token

### Get a Figma token

1. Open Figma → click your avatar → **Settings**
2. Scroll to **Personal access tokens** → **Generate new token**
3. Copy the value — you'll need it in the next step

---

## Quickstart

### 1. Clone and build

```bash
git clone https://github.com/AmyLud/design-check.git
cd design-check
npm install
npm run build
```

### 2. Set your Figma token

Create a `.env` file in the `design-check` directory:

```
FIGMA_TOKEN=your-figma-personal-access-token-here
```

### 3. Run against your app

Your app needs to be running locally first (e.g. `npm run dev` in another terminal).

```bash
node dist/cli/index.js \
  --figma "https://www.figma.com/design/YOUR_FILE_KEY/Name?node-id=12%3A34" \
  --url http://localhost:3000/your-page
```

---

## Usage

```
node dist/cli/index.js --figma <figma-url> [--url <page-url> | --route <path>] [options]
```

### Required

| Flag | Description |
|------|-------------|
| `--figma <link>` | Figma frame URL — must include `?node-id=` |

### URL (one required)

| Flag | Description |
|------|-------------|
| `--url <url>` | Full URL of the page to check (e.g. `http://localhost:3000/dashboard`) |
| `--route <path>` | Route shorthand — uses `http://localhost:3000` as the base |

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--viewport <WxH>` | `1440x1024` | Browser viewport size |
| `--config <path>` | `./design-check.json` | Path to a config file |
| `--output <dir>` | `./artifacts` | Directory to save debug artifacts |
| `--condensed` | off | One line per finding, no detailed breakdown |
| `--markdown` | off | GitHub-flavored markdown output (for PR comments) |
| `--json` | off | JSON output (for CI pipelines or scripting) |
| `--verbose` | off | Show detailed progress and confidence scores |

### How to get a Figma frame link

1. Open your Figma file
2. Click the top-level frame you want to check
3. Right-click → **Copy link** (or **Cmd/Ctrl+L**)
4. The URL will look like: `https://www.figma.com/design/AbCdEfGhIj/App?node-id=12%3A34&...`
5. Pass it directly to `--figma`

---

## Examples

**Basic check:**
```bash
node dist/cli/index.js \
  --figma "https://www.figma.com/design/AbCdEfGhIj/My-App?node-id=12%3A34" \
  --url http://localhost:3000/home
```

**Condensed output:**
```bash
node dist/cli/index.js \
  --figma "https://www.figma.com/design/AbCdEfGhIj/My-App?node-id=12%3A34" \
  --url http://localhost:3000/home \
  --condensed
```

**Mobile viewport:**
```bash
node dist/cli/index.js \
  --figma "https://www.figma.com/design/AbCdEfGhIj/My-App?node-id=12%3A34" \
  --url http://localhost:3000/home \
  --viewport 375x812
```

**JSON output:**
```bash
node dist/cli/index.js \
  --figma "https://www.figma.com/design/AbCdEfGhIj/My-App?node-id=12%3A34" \
  --url http://localhost:3000/home \
  --json | jq '.metadata.summary'
```

---

## Config file

Place a `design-check.json` in your project root to override defaults:

```json
{
  "viewport": {
    "width": 1440,
    "height": 1024
  },
  "thresholds": {
    "fontSizeDelta": 2,
    "fontWeightTolerance": 100,
    "borderRadiusDelta": 2,
    "spacingDelta": 4,
    "colorDelta": 10
  }
}
```

All fields are optional.

| Threshold | Default | Meaning |
|-----------|---------|---------|
| `fontSizeDelta` | `2` | Max font size difference in px |
| `fontWeightTolerance` | `100` | Max font weight difference (e.g. 400 vs 500 = 100) |
| `borderRadiusDelta` | `2` | Max border-radius difference in px |
| `spacingDelta` | `4` | Max padding or margin difference in px |
| `colorDelta` | `10` | Max per-channel color difference (0–255) |

---

## GitHub Actions — automatic PR comments

You can run design-check on every pull request and post the findings as a PR comment that updates automatically on each new push.

### Step 1 — Add the workflow to your repo

Create `.github/workflows/design-check.yml` in your application repository:

```yaml
name: Design Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  design-check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout app
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Serve app
        run: |
          npx --yes serve . -p 3000 &
          npx --yes wait-on http://localhost:3000 --timeout 15000

      - name: Checkout design-check
        uses: actions/checkout@v4
        with:
          repository: AmyLud/design-check
          path: design-check-tool

      - name: Install and build design-check
        run: |
          cd design-check-tool
          npm ci
          npm run build
          npx playwright install chromium --with-deps

      - name: Run design-check
        env:
          FIGMA_TOKEN: ${{ secrets.FIGMA_TOKEN }}
        run: |
          cd design-check-tool
          node dist/cli/index.js \
            --figma "YOUR_FIGMA_FRAME_URL" \
            --url http://localhost:3000 \
            --markdown > ../comment.md
        continue-on-error: true

      - name: Post PR comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs')
            const body = fs.readFileSync('comment.md', 'utf8')
            const marker = '<!-- design-check -->'

            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            })

            const existing = comments.find(c => c.body.includes(marker))

            if (existing) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existing.id,
                body: marker + '\n' + body,
              })
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: marker + '\n' + body,
              })
            }
```

Replace `YOUR_FIGMA_FRAME_URL` with the Figma link for the page you want to check.

> **Note:** The example above uses `npx serve` to serve a static site. If your app requires a build step, replace the **Serve app** step with your own build and start commands — for example `npm run build && npm run preview` for a Vite app.

### Step 2 — Add your Figma token as a secret

In your repository on GitHub: **Settings → Secrets and variables → Actions → New repository secret**

- Name: `FIGMA_TOKEN`
- Value: your Figma personal access token

### Step 3 — Open a pull request

The action runs automatically on every PR. Findings are posted as a comment and updated on each new push:

> **🎨 Design Check**
> **3 errors · 12 warnings** against `http://localhost:3000` · Figma frame
>
> ❌ Errors (3)
> <details><summary>Contrast (2)</summary>…</details>
> <details><summary>Broken Images (1)</summary>…</details>
>
> ⚠️ Warnings (12)
> <details><summary>Font Size (8)</summary>…</details>
> <details><summary>Spacing (4)</summary>…</details>

---

## Artifacts

After each run the tool saves debug files to the output directory (default `./artifacts`):

| File | Description |
|------|-------------|
| `screenshot.png` | Screenshot of the rendered page |
| `figma-frame.json` | Raw Figma API response for the frame |
| `rendered-dom.json` | All DOM nodes extracted from the page |
| `findings.json` | Complete report in JSON format |

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | No errors (warnings and info are OK) |
| `1` | One or more error-severity findings, or a fatal runtime error |

---

## Development

```bash
# Run without building (uses ts-node)
npm run dev -- --figma "..." --url http://localhost:3000

# Build TypeScript
npm run build

# Run built output
npm start -- --figma "..." --url http://localhost:3000
```
