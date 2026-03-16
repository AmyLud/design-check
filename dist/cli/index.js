#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const parse_link_1 = require("../figma/parse-link");
const client_1 = require("../figma/client");
const normalize_1 = require("../figma/normalize");
const capture_page_1 = require("../render/capture-page");
const compare_1 = require("../match/compare");
const console_reporter_1 = require("../report/console-reporter");
const markdown_reporter_1 = require("../report/markdown-reporter");
const prompt_reporter_1 = require("../report/prompt-reporter");
const json_reporter_1 = require("../report/json-reporter");
const auto_fix_1 = require("../fix/auto-fix");
const config_1 = require("../shared/config");
const utils_1 = require("../shared/utils");
// ─── CLI definition ────────────────────────────────────────────────────────────
commander_1.program
    .name('design-check')
    .description('Compare a Figma design frame against a rendered web page')
    .version('1.0.0')
    .requiredOption('--figma <link>', 'Figma frame URL (must include ?node-id=...)')
    .option('--url <local-url>', 'Local page URL to render (e.g. http://localhost:3000/path)')
    .option('--route <path>', 'Route path to render against http://localhost:3000 base')
    .option('--viewport <WxH>', 'Viewport size in WIDTHxHEIGHT format', '1440x1024')
    .option('--config <path>', 'Path to design-check.json config file')
    .option('--output <dir>', 'Directory to save artifacts', './artifacts')
    .option('--verbose', 'Print detailed progress and confidence scores', false)
    .option('--condensed', 'Print one line per finding with no detailed breakdown', false)
    .option('--markdown', 'Output report as GitHub-flavored markdown (for PR comments)', false)
    .option('--prompt', 'Output an AI prompt with fix instructions for each finding', false)
    .option('--json', 'Output report as JSON instead of human-readable text', false)
    .option('--auto-fix', 'Use Claude to automatically apply CSS fixes (requires ANTHROPIC_API_KEY)', false)
    .option('--css <paths...>', 'CSS file path(s) to update when using --auto-fix')
    .addHelpText('after', `
Examples:
  $ design-check --figma "https://www.figma.com/design/abc123/App?node-id=10:20" --url http://localhost:3000/home
  $ design-check --figma "https://www.figma.com/file/abc123/App?node-id=10:20" --route /home --verbose
  $ design-check --figma "..." --url http://localhost:3000 --output ./my-artifacts --json
`);
// ─── Helper ────────────────────────────────────────────────────────────────────
function log(message, jsonMode) {
    if (!jsonMode) {
        console.log(message);
    }
}
function fatal(message) {
    console.error(chalk_1.default.red(`\n  Error: ${message}\n`));
    process.exit(1);
}
// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    commander_1.program.parse(process.argv);
    const opts = commander_1.program.opts();
    const isJson = opts.json;
    const isVerbose = opts.verbose;
    const isCondensed = opts.condensed;
    const isMarkdown = opts.markdown;
    const isPrompt = opts.prompt;
    const isAutoFix = opts.autoFix;
    // ── 1. Validate inputs ────────────────────────────────────────────────────────
    if (!opts.url && !opts.route) {
        fatal('You must provide either --url <local-url> or --route <path>.');
    }
    if (isAutoFix && (!opts.css || opts.css.length === 0)) {
        fatal('--auto-fix requires --css <path(s)> to specify which CSS files to update.');
    }
    // ── 2. Determine target URL ───────────────────────────────────────────────────
    let targetUrl;
    if (opts.url) {
        targetUrl = opts.url;
    }
    else {
        const route = opts.route.startsWith('/') ? opts.route : `/${opts.route}`;
        targetUrl = `http://localhost:3000${route}`;
    }
    // ── 3. Parse viewport ─────────────────────────────────────────────────────────
    let viewport;
    try {
        viewport = (0, utils_1.parseViewport)(opts.viewport);
    }
    catch (err) {
        fatal(err.message);
    }
    // ── 4. Load config ────────────────────────────────────────────────────────────
    log(chalk_1.default.dim('  Loading config...'), isJson);
    let config;
    try {
        config = await (0, config_1.loadConfig)(opts.config);
        // CLI viewport overrides config viewport if explicitly set
        if (opts.viewport !== '1440x1024') {
            config.viewport = viewport;
        }
        else {
            // Use config viewport if not overridden by CLI
            viewport = config.viewport;
        }
    }
    catch (err) {
        fatal(err.message);
    }
    const outputDir = path_1.default.resolve(opts.output);
    (0, utils_1.ensureDir)(outputDir);
    // ── 5. Parse Figma link ───────────────────────────────────────────────────────
    log(chalk_1.default.blue('\n  Parsing Figma link...'), isJson);
    let fileKey;
    let nodeId;
    try {
        const parsed = (0, parse_link_1.parseFigmaLink)(opts.figma);
        fileKey = parsed.fileKey;
        nodeId = parsed.nodeId;
        if (isVerbose && !isJson) {
            console.log(chalk_1.default.dim(`    File key: ${fileKey}`));
            console.log(chalk_1.default.dim(`    Node ID:  ${nodeId}`));
        }
    }
    catch (err) {
        fatal(err.message);
    }
    // ── 6. Fetch Figma node ───────────────────────────────────────────────────────
    log(chalk_1.default.blue('  Fetching Figma frame...'), isJson);
    let rawFigmaNode;
    try {
        rawFigmaNode = await (0, client_1.fetchFigmaNode)(fileKey, nodeId);
        if (isVerbose && !isJson) {
            console.log(chalk_1.default.dim(`    Frame name: ${rawFigmaNode.name}`));
            console.log(chalk_1.default.dim(`    Frame type: ${rawFigmaNode.type}`));
        }
    }
    catch (err) {
        fatal(err.message);
    }
    // ── 7. Normalize Figma node ───────────────────────────────────────────────────
    log(chalk_1.default.blue('  Normalizing Figma data...'), isJson);
    let designRoot;
    try {
        designRoot = (0, normalize_1.normalizeFigmaNode)(rawFigmaNode);
    }
    catch (err) {
        fatal(`Failed to normalize Figma data: ${err.message}`);
    }
    // Save figma frame artifact
    (0, utils_1.saveJson)(path_1.default.join(outputDir, 'figma-frame.json'), rawFigmaNode);
    // ── 8. Render page ────────────────────────────────────────────────────────────
    log(chalk_1.default.blue(`  Rendering page: ${targetUrl}`), isJson);
    let captureResult;
    try {
        captureResult = await (0, capture_page_1.capturePage)({
            url: targetUrl,
            viewport: config.viewport,
            outputDir,
            verbose: isVerbose && !isJson
        });
    }
    catch (err) {
        fatal(`Failed to render page: ${err.message}`);
    }
    const { screenshotPath, nodes: renderedNodes } = captureResult;
    // Save rendered DOM artifact
    (0, utils_1.saveJson)(path_1.default.join(outputDir, 'rendered-dom.json'), renderedNodes);
    if (isVerbose && !isJson) {
        console.log(chalk_1.default.dim(`    Captured ${renderedNodes.length} DOM nodes`));
        console.log(chalk_1.default.dim(`    Screenshot: ${screenshotPath}`));
    }
    // ── 9. Compare ────────────────────────────────────────────────────────────────
    log(chalk_1.default.blue('  Comparing design to implementation...'), isJson);
    let findings;
    try {
        findings = await (0, compare_1.compare)(designRoot, renderedNodes, config);
    }
    catch (err) {
        fatal(`Comparison failed: ${err.message}`);
    }
    // ── 10. Save findings artifact ────────────────────────────────────────────────
    const jsonReport = (0, json_reporter_1.generateJsonReport)(findings, opts.figma, targetUrl, designRoot, renderedNodes);
    (0, utils_1.saveJson)(path_1.default.join(outputDir, 'findings.json'), jsonReport);
    // ── 11. Report ────────────────────────────────────────────────────────────────
    if (isJson) {
        console.log(JSON.stringify(jsonReport, null, 2));
    }
    else if (isMarkdown) {
        console.log((0, markdown_reporter_1.formatMarkdownReport)(findings, opts.figma, targetUrl));
    }
    else if (isPrompt) {
        console.log((0, prompt_reporter_1.formatPromptReport)(findings, opts.figma, targetUrl));
    }
    else if (isCondensed) {
        (0, console_reporter_1.printCondensedReport)(findings);
    }
    else {
        (0, console_reporter_1.printReport)(findings, opts.figma, targetUrl, outputDir, isVerbose);
    }
    // ── 12. Auto-fix ──────────────────────────────────────────────────────────────
    if (isAutoFix && findings.length > 0) {
        try {
            await (0, auto_fix_1.autoFix)({
                cssPaths: opts.css,
                findings: findings,
                figmaLink: opts.figma,
                url: targetUrl,
                verbose: isVerbose,
            });
        }
        catch (err) {
            fatal(`Auto-fix failed: ${err.message}`);
        }
    }
    // ── 13. Exit code ─────────────────────────────────────────────────────────────
    const hasErrors = findings.some((f) => f.severity === 'error');
    process.exit(hasErrors ? 1 : 0);
}
main().catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    fatal(`Unexpected error: ${message}`);
});
//# sourceMappingURL=index.js.map