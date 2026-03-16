"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSize = checkSize;
const utils_1 = require("../../shared/utils");
/**
 * Check that element dimensions in the rendered page match the Figma design.
 * Returns warning findings where width or height differs beyond the configured deltas.
 */
function checkSize(matches, thresholds) {
    const findings = [];
    for (const match of matches) {
        if (!match.renderedNode || match.confidence === 0)
            continue;
        const { designNode, renderedNode } = match;
        const widthDiff = Math.abs(designNode.width - renderedNode.width);
        const heightDiff = Math.abs(designNode.height - renderedNode.height);
        const widthExceeds = widthDiff > thresholds.widthDelta;
        const heightExceeds = heightDiff > thresholds.heightDelta;
        if (widthExceeds || heightExceeds) {
            const parts = [];
            if (widthExceeds) {
                parts.push(`width expected ${designNode.width}px got ${renderedNode.width}px (diff: ${widthDiff}px)`);
            }
            if (heightExceeds) {
                parts.push(`height expected ${designNode.height}px got ${renderedNode.height}px (diff: ${heightDiff}px)`);
            }
            const expectedDesc = `${designNode.width}x${designNode.height}`;
            const actualDesc = `${renderedNode.width}x${renderedNode.height}`;
            findings.push({
                id: (0, utils_1.generateId)(),
                severity: 'warning',
                category: 'size',
                targetName: designNode.name,
                expected: expectedDesc,
                actual: actualDesc,
                confidence: match.confidence,
                message: `Size mismatch on "${designNode.name}": ${parts.join(', ')} ` +
                    `(thresholds: w±${thresholds.widthDelta}px, h±${thresholds.heightDelta}px).`
            });
        }
    }
    return findings;
}
//# sourceMappingURL=size.js.map