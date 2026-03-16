"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJsonReport = generateJsonReport;
function generateJsonReport(findings, figmaLink, url, designRoot, renderedNodes) {
    const counts = findings.reduce((acc, f) => ({ ...acc, [f.severity]: acc[f.severity] + 1 }), { error: 0, warning: 0, info: 0 });
    return {
        metadata: {
            generatedAt: new Date().toISOString(),
            figmaLink,
            url,
            summary: {
                total: findings.length,
                errors: counts.error,
                warnings: counts.warning,
                info: counts.info
            }
        },
        findings,
        design: {
            rootNode: {
                id: designRoot.id,
                name: designRoot.name,
                type: designRoot.type,
                width: designRoot.width,
                height: designRoot.height
            }
        },
        rendered: {
            nodeCount: renderedNodes.length
        }
    };
}
//# sourceMappingURL=json-reporter.js.map