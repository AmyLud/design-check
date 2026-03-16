"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkColor = checkColor;
const utils_1 = require("../../shared/utils");
function checkColor(matches, thresholds) {
    return matches.flatMap((match) => {
        if (!match.renderedNode || match.confidence === 0)
            return [];
        const { designNode, renderedNode } = match;
        if (!designNode.color || !renderedNode.color)
            return [];
        const designRgb = (0, utils_1.parseColor)(designNode.color);
        const renderedRgb = (0, utils_1.parseColor)(renderedNode.color);
        if (!designRgb || !renderedRgb)
            return [];
        const dist = (0, utils_1.colorDistance)(designRgb, renderedRgb);
        if (dist <= thresholds.colorDelta)
            return [];
        return [{
                id: (0, utils_1.generateId)(),
                severity: 'warning',
                category: 'color',
                targetName: designNode.name,
                expected: designNode.color,
                actual: renderedNode.color,
                confidence: match.confidence,
                selector: renderedNode.selector,
                message: `Color mismatch on "${designNode.name}": ` +
                    `expected ${designNode.color}, got ${renderedNode.color} ` +
                    `(max channel diff: ${dist}, threshold: ${thresholds.colorDelta}).`
            }];
    });
}
//# sourceMappingURL=color.js.map