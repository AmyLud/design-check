"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMarkdownReport = formatMarkdownReport;
const CATEGORY_LABELS = {
    'missing-text': 'Missing Text',
    'font-size': 'Font Size',
    'font-weight': 'Font Weight',
    'radius': 'Border Radius',
    'spacing': 'Spacing',
    'color': 'Color',
    'contrast': 'Contrast',
    'broken-image': 'Broken Images',
};
function groupBy(items, key) {
    return items.reduce((acc, item) => ({ ...acc, [key(item)]: [...(acc[key(item)] ?? []), item] }), {});
}
function severityIcon(severity) {
    return severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';
}
function summaryLine(findings) {
    const counts = findings.reduce((acc, f) => ({ ...acc, [f.severity]: acc[f.severity] + 1 }), { error: 0, warning: 0, info: 0 });
    const parts = [
        counts.error > 0 ? `**${counts.error} error${counts.error === 1 ? '' : 's'}**` : null,
        counts.warning > 0 ? `**${counts.warning} warning${counts.warning === 1 ? '' : 's'}**` : null,
        counts.info > 0 ? `**${counts.info} info**` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : '**0 findings**';
}
function findingsTable(findings) {
    const rows = findings
        .map((f) => `| ${f.targetName} | ${f.expected} | ${f.actual ?? '—'} |`)
        .join('\n');
    return `| Element | Expected | Actual |\n|---|---|---|\n${rows}`;
}
function categorySection(category, findings) {
    const label = CATEGORY_LABELS[category];
    const icon = severityIcon(findings[0].severity);
    return [
        `<details>`,
        `<summary>${icon} ${label} (${findings.length})</summary>`,
        ``,
        findingsTable(findings),
        ``,
        `</details>`,
    ].join('\n');
}
function severitySection(severity, findings) {
    const icon = severityIcon(severity);
    const label = severity === 'error' ? 'Errors' : severity === 'warning' ? 'Warnings' : 'Info';
    const byCategory = groupBy(findings, (f) => f.category);
    const sections = Object.entries(byCategory)
        .map(([cat, items]) => categorySection(cat, items))
        .join('\n\n');
    return [`### ${icon} ${label} (${findings.length})`, '', sections].join('\n');
}
function formatMarkdownReport(findings, figmaLink, url) {
    const header = [
        `## 🎨 Design Check`,
        ``,
        `${summaryLine(findings)} against [\`${url}\`](${url}) · [Figma frame](${figmaLink})`,
    ].join('\n');
    if (findings.length === 0) {
        return [header, '', '✅ No findings — design and implementation match!'].join('\n');
    }
    const bySeverity = groupBy(findings, (f) => f.severity);
    const severityOrder = ['error', 'warning', 'info'];
    const sections = severityOrder
        .filter((s) => bySeverity[s]?.length > 0)
        .map((s) => severitySection(s, bySeverity[s]))
        .join('\n\n');
    return [header, '', sections].join('\n');
}
//# sourceMappingURL=markdown-reporter.js.map