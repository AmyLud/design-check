"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkContrast = checkContrast;
const utils_1 = require("../../shared/utils");
// WCAG AA thresholds
const NORMAL_TEXT_RATIO = 4.5;
const LARGE_TEXT_RATIO = 3.0;
// Large text: >= 18px, or >= 14px bold
function isLargeText(fontSize, fontWeight) {
    if (!fontSize)
        return false;
    if (fontSize >= 18)
        return true;
    if (fontSize >= 14 && fontWeight && parseInt(fontWeight, 10) >= 700)
        return true;
    return false;
}
function checkContrast(matches) {
    return matches.flatMap((match) => {
        if (!match.renderedNode || match.confidence === 0)
            return [];
        const { designNode, renderedNode } = match;
        const { color, effectiveBackgroundColor, fontSize, fontWeight } = renderedNode;
        if (!color || !effectiveBackgroundColor)
            return [];
        const fg = (0, utils_1.parseColor)(color);
        const bg = (0, utils_1.parseColor)(effectiveBackgroundColor);
        if (!fg || !bg)
            return [];
        const ratio = (0, utils_1.contrastRatio)(fg, bg);
        const large = isLargeText(fontSize, fontWeight);
        const required = large ? LARGE_TEXT_RATIO : NORMAL_TEXT_RATIO;
        if (ratio >= required)
            return [];
        return [{
                id: (0, utils_1.generateId)(),
                severity: 'error',
                category: 'contrast',
                targetName: designNode.name,
                expected: `≥ ${required}:1 (WCAG AA${large ? ' large text' : ''})`,
                actual: `${ratio.toFixed(2)}:1`,
                confidence: match.confidence,
                selector: renderedNode.selector,
                message: `Contrast failure on "${designNode.name}": ` +
                    `ratio ${ratio.toFixed(2)}:1 is below WCAG AA minimum of ${required}:1 ` +
                    `(${color} on ${effectiveBackgroundColor}).`
            }];
    });
}
//# sourceMappingURL=contrast.js.map