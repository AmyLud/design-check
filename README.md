# design-check

- [Problem](#problem)
- [Solution](#solution)
- [What it checks](#what-it-checks)
- [Prerequisites](#prerequisites)
- [Quickstart](#quickstart)
- [Usage](#usage)
- [Examples](#examples)
- [Config file](#config-file)
- [Auto-fix with Claude](#auto-fix-with-claude)
- [GitHub Actions — automatic PR comments](#github-actions--automatic-pr-comments)
- [Artifacts](#artifacts)
- [Exit codes](#exit-codes)
- [Development](#development)

---

## Problem

Working across product, design, and engineering, I’ve consistently noticed that developers often miss small design details—even when using AI code assistance.  

AI tools can generate UI code quickly, but they frequently make simple visual mistakes when translating designs into implementation. For example, something as basic as **forgetting the border radius on half of an option selector** can slip through.

Design QA between **Figma and implemented UI** is often:

- slow  
- manual  
- inconsistent  

These issues are usually minor, but they create unnecessary back-and-forth between designers and developers.

---

## Solution

I built a small **CLI / GitHub tool** that automatically checks implemented UI against a Figma frame.

The tool:

1. Takes a **Figma frame link**
2. **Renders the current UI locally**
3. Extracts **layout and style data** from both the design and the rendered page
4. Compares them using a set of **deterministic rules**
5. Reports **simple design mismatches**

### Examples of issues it detects

- font size mismatches  
- incorrect font weights  
- incorrect button heights  
- border radius differences  
- missing text elements  

Instead of waiting for manual design review, developers can run a command and **immediately see small design errors before pushing their code**.

---

## AI Assist

I purposely targeted a problem that AI currently struggles with, since I myself have been frustrated with the small errors made during execution. I'm a front end dev and designer mostly, so built something that I A) have never built (so cool!) and B) that would help me simplify my AI flow so Im not asking it to fix designs over and over but can instead pass it one big command to fix a good chunk of the issues.

## How AI Helped Build This in Under 3 Hours

I used AI as a **force multiplier for the parts of software development that are high-effort but low-creativity**, while staying involved in the decisions that required judgment, product sense, or tradeoffs.

### What AI Did Well

**Rapid scaffolding**

AI generated the initial project structure — including the Figma client, DOM extraction layer, rule engine, and reporting system. Writing that foundation manually would have taken hours, but AI produced a working baseline almost immediately.

**Fast iteration on features**

Once the pattern for a design check existed, AI could quickly replicate it. Adding additional rules like spacing checks, color comparisons, or accessibility checks became very fast because the structure was already in place.

**Handling repetitive boilerplate**

AI handled a lot of the mechanical work developers typically dislike writing:

- GitHub Actions workflow files  
- TypeScript types  
- README documentation  
- small refactors and helper utilities  

This freed me to focus on the core logic rather than setup and formatting.

**Applying known APIs quickly**

AI was able to apply several APIs and tools without requiring me to dig through documentation first, including:

- Figma REST API
- Playwright DOM extraction
- WCAG contrast calculations
- Anthropic/Claude SDK patterns

That made the initial build much faster.

### Where I Had to Step In

**Product and business logic**

AI can generate code, but it doesn't inherently understand the product context. For example, I had to identify that some checks were too noisy — such as ignoring composed text like date ranges — and then guide AI on how the rule should behave.

**Debugging edge cases**

When issues came up (such as CI permission problems), AI initially suggested incorrect fixes. I had to investigate, test, and guide the debugging process until the real root cause was identified.

**Scope control**

AI naturally tends to expand scope. I had to make deliberate product decisions about what the tool should *not* do yet — such as removing certain layout checks that were too noisy or complex for the prototype.

**Direction and sequencing**

AI was most effective when given clear direction at each step. The overall workflow — building the CLI, condensing the architecture, modernizing the structure, adding CI, introducing AI output, and exploring auto-fix capabilities — came from my planning. AI primarily accelerated execution of each step.

### My good friend Claude said this:

"The honest summary:
You did the product thinking. I did the typing. The 3 hours came from the fact that you never had to context-switch into documentation, never had to remember boilerplate syntax, and could treat each feature as a one-sentence instruction rather than an hour of implementation. The mistakes that slowed you down were almost all mine — wrong assumptions about permissions, stale references after a refactor — and they cost you maybe 20 minutes combined."


---

## Tradeoffs

The prototype optimizes for speed of validation, not completeness.

### 1. Limited comparison scope

The prototype only checks a few properties:

- text presence
- font size
- font weight
- container size
- border radius

It does not attempt full layout validation, nor does it handle many edge cases or advanced styling things like responsive layouts and dynamic rendering. 

However, the above are things that are very tedious to check for a designer, and easily fixed so still provides some value despite the limited scope. 

### 2. Simplified element matching

The prototype primarily matches elements by:

- identical text
- approximate size

This works for headings and buttons but for items that are dynamic, this may not work perfectly. Ideally, there would be a more advanced method of scanning the generated ui and comparing it to the figma prototype with a bit more fuzziness.

---

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
| `--prompt` | off | Output a copyable AI prompt with exact CSS fix instructions |
| `--json` | off | JSON output (for CI pipelines or scripting) |
| `--verbose` | off | Show detailed progress and confidence scores |
| `--auto-fix` | off | Use Claude to automatically apply CSS fixes (requires `ANTHROPIC_API_KEY`) |
| `--css <paths...>` | — | CSS file(s) to update when using `--auto-fix` |

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

## Auto-fix with Claude

The `--auto-fix` flag sends your findings and CSS files to **Claude Opus** and applies the suggested property changes directly to your files.

### Setup

Add `ANTHROPIC_API_KEY` to your `.env` file:

```
FIGMA_TOKEN=your-figma-token
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Usage

```bash
node dist/cli/index.js \
  --figma "https://www.figma.com/design/..." \
  --url http://localhost:3000 \
  --auto-fix \
  --css src/styles/main.css src/styles/components.css
```

Claude receives all findings and the contents of each CSS file, then applies targeted fixes — changing only the specific properties listed in the report. Each change is printed as a coloured diff:

```
  ✔  src/styles/main.css
       .hero h1 { font-size: 24px → 30px }
       .hero h1 { font-weight: 400 → 700 }
  ✔  src/styles/components.css
       .btn { border-radius: 4px → 8px }
```

`--css` accepts multiple space-separated paths. Use `--verbose` to see skipped changes where the selector or value wasn't found.

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




