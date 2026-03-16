"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRadius = checkRadius;
const utils_1 = require("../../shared/utils");
function parseBorderRadius(value) {
    if (!value || value === 'none' || value === '')
        return null;
    const num = parseFloat(value.trim().split(/\s+/)[0]);
    return isNaN(num) ? null : num;
}
function checkRadius(matches, thresholds) {
    return matches.flatMap((match) => {
        if (!match.renderedNode || match.confidence === 0)
            return [];
        const { designNode, renderedNode } = match;
        const { borderRadius: designRadius } = designNode;
        if (designRadius == null)
            return [];
        const renderedRadius = parseBorderRadius(renderedNode.borderRadius);
        if (renderedRadius === null) {
            if (designRadius <= thresholds.borderRadiusDelta)
                return [];
            return [{
                    id: (0, utils_1.generateId)(),
                    severity: 'info',
                    category: 'radius',
                    targetName: designNode.name,
                    expected: designRadius,
                    actual: 0,
                    confidence: match.confidence,
                    selector: renderedNode.selector,
                    message: `Border radius mismatch on "${designNode.name}": ` +
                        `expected ${designRadius}px, got 0px (no border-radius detected).`
                }];
        }
        const diff = Math.abs(designRadius - renderedRadius);
        if (diff <= thresholds.borderRadiusDelta)
            return [];
        return [{
                id: (0, utils_1.generateId)(),
                severity: 'info',
                category: 'radius',
                targetName: designNode.name,
                expected: designRadius,
                actual: renderedRadius,
                confidence: match.confidence,
                selector: renderedNode.selector,
                message: `Border radius mismatch on "${designNode.name}": ` +
                    `expected ${designRadius}px, got ${renderedRadius}px ` +
                    `(difference: ${diff.toFixed(1)}px, threshold: ${thresholds.borderRadiusDelta}px).`
            }];
    });
}
//# sourceMappingURL=radius.js.map