"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printCondensedReport = printCondensedReport;
exports.printReport = printReport;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const SEVERITY_ICONS = {
    error: '✖',
    warning: '⚠',
    info: 'ℹ'
};
const SEVERITY_LABELS = {
    error: 'ERROR',
    warning: 'WARN',
    info: 'INFO'
};
function colorBySeverity(severity, text) {
    switch (severity) {
        case 'error':
            return chalk_1.default.red(text);
        case 'warning':
            return chalk_1.default.yellow(text);
        case 'info':
            return chalk_1.default.cyan(text);
    }
}
function formatSeverityBadge(severity) {
    const icon = SEVERITY_ICONS[severity];
    const label = SEVERITY_LABELS[severity];
    return colorBySeverity(severity, `${icon} ${label}`);
}
function groupBySeverity(findings) {
    return findings.reduce((acc, finding) => ({ ...acc, [finding.severity]: [...acc[finding.severity], finding] }), { error: [], warning: [], info: [] });
}
function printCondensedReport(findings) {
    if (findings.length === 0) {
        console.log(chalk_1.default.green('✔ No findings'));
        return;
    }
    const errorCount = findings.filter((f) => f.severity === 'error').length;
    const warnCount = findings.filter((f) => f.severity === 'warning').length;
    const infoCount = findings.filter((f) => f.severity === 'info').length;
    const parts = [];
    if (errorCount > 0)
        parts.push(chalk_1.default.red(`${errorCount} error${errorCount === 1 ? '' : 's'}`));
    if (warnCount > 0)
        parts.push(chalk_1.default.yellow(`${warnCount} warning${warnCount === 1 ? '' : 's'}`));
    if (infoCount > 0)
        parts.push(chalk_1.default.cyan(`${infoCount} info`));
    console.log(parts.join(chalk_1.default.dim(' · ')));
    console.log();
    for (const finding of findings) {
        const badge = formatSeverityBadge(finding.severity);
        const name = chalk_1.default.bold(finding.targetName);
        const detail = `${chalk_1.default.green(String(finding.expected))} → ${chalk_1.default.red(String(finding.actual ?? '(not found)'))}`;
        console.log(`  ${badge}  ${name}  ${chalk_1.default.dim(finding.category)}  ${detail}`);
    }
    console.log();
}
function printReport(findings, figmaLink, url, artifactsDir, verbose) {
    const divider = chalk_1.default.dim('─'.repeat(60));
    console.log();
    console.log(divider);
    console.log(chalk_1.default.bold('  Design Check Report'));
    console.log(divider);
    console.log();
    // Summary line
    const totalCount = findings.length;
    if (totalCount === 0) {
        console.log(chalk_1.default.green.bold('  ✔ No findings — design and implementation match!'));
    }
    else {
        const errorCount = findings.filter((f) => f.severity === 'error').length;
        const warnCount = findings.filter((f) => f.severity === 'warning').length;
        const infoCount = findings.filter((f) => f.severity === 'info').length;
        const headerColor = errorCount > 0 ? chalk_1.default.red.bold : chalk_1.default.yellow.bold;
        console.log(headerColor(`  Design check: ${totalCount} finding${totalCount === 1 ? '' : 's'}`));
        const parts = [];
        if (errorCount > 0)
            parts.push(chalk_1.default.red(`${errorCount} error${errorCount === 1 ? '' : 's'}`));
        if (warnCount > 0)
            parts.push(chalk_1.default.yellow(`${warnCount} warning${warnCount === 1 ? '' : 's'}`));
        if (infoCount > 0)
            parts.push(chalk_1.default.cyan(`${infoCount} info`));
        console.log(`  ${parts.join(chalk_1.default.dim(' · '))}`);
    }
    console.log();
    if (findings.length > 0) {
        const groups = groupBySeverity(findings);
        const severityOrder = ['error', 'warning', 'info'];
        for (const severity of severityOrder) {
            const group = groups[severity];
            if (group.length === 0)
                continue;
            console.log(chalk_1.default.bold(`  ${formatSeverityBadge(severity)} findings (${group.length})`));
            console.log();
            for (const finding of group) {
                console.log(`  ${formatSeverityBadge(finding.severity)}  ${chalk_1.default.bold(finding.targetName)}`);
                console.log(`    ${chalk_1.default.dim('Category:')}  ${finding.category}`);
                console.log(`    ${chalk_1.default.dim('Expected:')}  ${chalk_1.default.green(String(finding.expected))}`);
                console.log(`    ${chalk_1.default.dim('Actual:  ')}  ${finding.actual !== null ? chalk_1.default.red(String(finding.actual)) : chalk_1.default.red('(not found)')}`);
                console.log(`    ${chalk_1.default.dim('Message:')}  ${finding.message}`);
                if (verbose) {
                    console.log(`    ${chalk_1.default.dim('Confidence:')} ${(finding.confidence * 100).toFixed(0)}%  ${chalk_1.default.dim(`[id: ${finding.id}]`)}`);
                }
                console.log();
            }
        }
    }
    console.log(divider);
    console.log(chalk_1.default.bold('  Sources'));
    console.log();
    console.log(`  ${chalk_1.default.dim('Figma:')}      ${figmaLink}`);
    console.log(`  ${chalk_1.default.dim('URL:')}        ${url}`);
    console.log();
    console.log(chalk_1.default.bold('  Artifacts'));
    console.log();
    const resolvedDir = path_1.default.resolve(artifactsDir);
    console.log(`  ${chalk_1.default.dim('Directory:')} ${resolvedDir}`);
    console.log(`  ${chalk_1.default.dim('Files:')}`);
    console.log(`    ${chalk_1.default.cyan('screenshot.png')}    — rendered page screenshot`);
    console.log(`    ${chalk_1.default.cyan('figma-frame.json')} — raw Figma node data`);
    console.log(`    ${chalk_1.default.cyan('rendered-dom.json')} — extracted DOM nodes`);
    console.log(`    ${chalk_1.default.cyan('findings.json')}    — this report in JSON format`);
    console.log();
    console.log(divider);
    console.log();
}
//# sourceMappingURL=console-reporter.js.map