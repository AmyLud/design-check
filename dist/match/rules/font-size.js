"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFontSize = checkFontSize;
const utils_1 = require("../../shared/utils");
function checkFontSize(matches, thresholds) {
    return matches.flatMap((match) => {
        if (!match.renderedNode || match.confidence === 0)
            return [];
        const { designNode, renderedNode } = match;
        const { fontSize: designFontSize } = designNode;
        const { fontSize: renderedFontSize } = renderedNode;
        if (designFontSize == null || renderedFontSize == null)
            return [];
        const diff = Math.abs(designFontSize - renderedFontSize);
        if (diff <= thresholds.fontSizeDelta)
            return [];
        return [{
                id: (0, utils_1.generateId)(),
                severity: 'warning',
                category: 'font-size',
                targetName: designNode.name,
                expected: designFontSize,
                actual: renderedFontSize,
                confidence: match.confidence,
                message: `Font size mismatch on "${designNode.name}": ` +
                    `expected ${designFontSize}px, got ${renderedFontSize}px ` +
                    `(difference: ${diff.toFixed(1)}px, threshold: ${thresholds.fontSizeDelta}px).`
            }];
    });
}
//# sourceMappingURL=font-size.js.map