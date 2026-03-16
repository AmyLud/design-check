"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoFix = autoFix;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const zod_1 = require("@anthropic-ai/sdk/helpers/beta/zod");
const zod_2 = require("zod");
const chalk_1 = __importDefault(require("chalk"));
const prompt_reporter_1 = require("../report/prompt-reporter");
// ─── Tool definition ───────────────────────────────────────────────────────────
const updateCssFilesTool = (0, zod_1.betaZodTool)({
    name: 'update_css_files',
    description: 'Apply CSS property changes to fix design check findings. ' +
        'Each update targets a specific selector and property in a specific file.',
    inputSchema: zod_2.z.object({
        updates: zod_2.z.array(zod_2.z.object({
            file: zod_2.z.string().describe('Relative or absolute path to the CSS file'),
            selector: zod_2.z.string().describe('CSS selector to update, e.g. ".hero h1"'),
            property: zod_2.z.string().describe('CSS property name, e.g. "font-size"'),
            oldValue: zod_2.z.string().describe('Current value being replaced'),
            newValue: zod_2.z.string().describe('New value to set'),
        })).describe('List of individual property changes to apply'),
    }),
    run: async (input) => {
        // executed in-loop by the tool runner, but we override via finalMessage below
        return JSON.stringify(input.updates);
    },
});
// ─── Helpers ──────────────────────────────────────────────────────────────────
function readCssFiles(cssGlobs) {
    const files = {};
    for (const pattern of cssGlobs) {
        const resolved = path_1.default.resolve(pattern);
        if (fs_1.default.existsSync(resolved) && fs_1.default.statSync(resolved).isFile()) {
            files[resolved] = fs_1.default.readFileSync(resolved, 'utf-8');
        }
    }
    return files;
}
function applyUpdate(content, selector, property, oldValue, newValue) {
    // Normalize whitespace for matching
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedProp = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedOld = oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match: selector { ... property: oldValue; ... } (simplified single-block match)
    const blockPattern = new RegExp(`(${escapedSelector}\\s*\\{[^}]*?)(${escapedProp}\\s*:\\s*)${escapedOld}(\\s*;)`, 'gs');
    let changed = false;
    const updated = content.replace(blockPattern, (_match, pre, propPart, semi) => {
        changed = true;
        return `${pre}${propPart}${newValue}${semi}`;
    });
    return { updated, changed };
}
async function autoFix(opts) {
    const { cssPaths, findings, figmaLink, url, verbose } = opts;
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is required for --auto-fix. Add it to your .env file.');
    }
    // ── Read CSS files ──────────────────────────────────────────────────────────
    const cssFiles = readCssFiles(cssPaths);
    const fileCount = Object.keys(cssFiles).length;
    if (fileCount === 0) {
        throw new Error(`No CSS files found at the path(s) provided: ${cssPaths.join(', ')}`);
    }
    console.log(chalk_1.default.blue(`\n  Auto-fix: loaded ${fileCount} CSS file(s)`));
    // ── Build prompt ────────────────────────────────────────────────────────────
    const prompt = (0, prompt_reporter_1.formatPromptReport)(findings, figmaLink, url);
    const fileSection = Object.entries(cssFiles)
        .map(([p, content]) => `### ${path_1.default.basename(p)}\nPath: ${p}\n\`\`\`css\n${content}\n\`\`\``)
        .join('\n\n');
    const fullPrompt = [
        prompt,
        '',
        '---',
        '',
        'Here are the CSS files to update:',
        '',
        fileSection,
        '',
        'Call the `update_css_files` tool with all the changes needed to fix every finding above.',
        'Only update properties that directly address a finding — do not reorganize or reformat any other CSS.',
    ].join('\n');
    if (verbose) {
        console.log(chalk_1.default.dim(`\n  Sending ${findings.length} finding(s) to Claude Opus 4.6...`));
    }
    // ── Call Claude ─────────────────────────────────────────────────────────────
    const client = new sdk_1.default();
    const runner = client.beta.messages.toolRunner({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        thinking: { type: 'adaptive' },
        tools: [updateCssFilesTool],
        tool_choice: { type: 'tool', name: 'update_css_files' },
        messages: [{ role: 'user', content: fullPrompt }],
    });
    process.stdout.write(chalk_1.default.dim('  Waiting for Claude'));
    const dots = setInterval(() => process.stdout.write(chalk_1.default.dim('.')), 800);
    let finalMessage;
    try {
        finalMessage = await runner;
    }
    finally {
        clearInterval(dots);
        process.stdout.write('\n');
    }
    // ── Extract updates from tool call ──────────────────────────────────────────
    const toolUseBlock = finalMessage.content.find((b) => b.type === 'tool_use');
    if (!toolUseBlock) {
        console.log(chalk_1.default.yellow('\n  Auto-fix: Claude did not return any updates.'));
        return;
    }
    const { updates } = toolUseBlock.input;
    if (!updates || updates.length === 0) {
        console.log(chalk_1.default.yellow('\n  Auto-fix: no changes needed.'));
        return;
    }
    // ── Apply updates ───────────────────────────────────────────────────────────
    console.log(chalk_1.default.blue(`\n  Applying ${updates.length} fix(es)...\n`));
    // Group by file
    const byFile = updates.reduce((acc, u) => {
        const key = path_1.default.resolve(u.file);
        return { ...acc, [key]: [...(acc[key] ?? []), u] };
    }, {});
    let totalApplied = 0;
    let totalSkipped = 0;
    for (const [filePath, fileUpdates] of Object.entries(byFile)) {
        const original = cssFiles[filePath] ?? fs_1.default.readFileSync(filePath, 'utf-8');
        let content = original;
        const applied = [];
        const skipped = [];
        for (const u of fileUpdates) {
            const { updated, changed } = applyUpdate(content, u.selector, u.property, u.oldValue, u.newValue);
            if (changed) {
                content = updated;
                applied.push(u);
            }
            else {
                skipped.push(u);
            }
        }
        if (applied.length > 0) {
            fs_1.default.writeFileSync(filePath, content, 'utf-8');
            console.log(chalk_1.default.green(`  ✔  ${path_1.default.relative(process.cwd(), filePath)}`));
            for (const u of applied) {
                console.log(chalk_1.default.dim(`       ${u.selector} { ${u.property}: `) +
                    chalk_1.default.red(u.oldValue) +
                    chalk_1.default.dim(' → ') +
                    chalk_1.default.green(u.newValue) +
                    chalk_1.default.dim(' }'));
            }
            totalApplied += applied.length;
        }
        if (skipped.length > 0 && verbose) {
            console.log(chalk_1.default.yellow(`  ⚠  Skipped ${skipped.length} change(s) in ${path_1.default.basename(filePath)} (selector/value not found):`));
            for (const u of skipped) {
                console.log(chalk_1.default.dim(`       ${u.selector} { ${u.property}: ${u.oldValue} }`));
            }
            totalSkipped += skipped.length;
        }
    }
    console.log(chalk_1.default.bold(`\n  ${totalApplied} fix(es) applied`) +
        (totalSkipped > 0 ? chalk_1.default.yellow(`, ${totalSkipped} skipped`) : '') +
        '\n');
}
//# sourceMappingURL=auto-fix.js.map