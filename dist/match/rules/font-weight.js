"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFontWeight = checkFontWeight;
const utils_1 = require("../../shared/utils");
function checkFontWeight(matches, thresholds) {
    return matches.flatMap((match) => {
        if (!match.renderedNode || match.confidence === 0)
            return [];
        const { designNode, renderedNode } = match;
        const { fontWeight: designFontWeight } = designNode;
        if (designFontWeight == null)
            return [];
        const renderedFontWeight = parseInt(renderedNode.fontWeight ?? '', 10);
        if (isNaN(renderedFontWeight))
            return [];
        const diff = Math.abs(designFontWeight - renderedFontWeight);
        if (diff <= thresholds.fontWeightTolerance)
            return [];
        return [{
                id: (0, utils_1.generateId)(),
                severity: 'warning',
                category: 'font-weight',
                targetName: designNode.name,
                expected: designFontWeight,
                actual: renderedFontWeight,
                confidence: match.confidence,
                selector: renderedNode.selector,
                message: `Font weight mismatch on "${designNode.name}": ` +
                    `expected ${designFontWeight}, got ${renderedFontWeight} ` +
                    `(difference: ${diff}, threshold: ${thresholds.fontWeightTolerance}).`
            }];
    });
}
//# sourceMappingURL=font-weight.js.map