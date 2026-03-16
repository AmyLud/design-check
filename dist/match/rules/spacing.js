"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSpacing = checkSpacing;
const utils_1 = require("../../shared/utils");
const SIDES = ['top', 'right', 'bottom', 'left'];
function paddingFindings(match, delta) {
    if (!match.designNode.padding)
        return [];
    return SIDES.flatMap((side) => {
        const expected = match.designNode.padding[side];
        const actual = match.renderedNode.padding?.[side] ?? 0;
        const diff = Math.abs(expected - actual);
        if (diff <= delta)
            return [];
        return [{
                id: (0, utils_1.generateId)(),
                severity: 'warning',
                category: 'spacing',
                targetName: match.designNode.name,
                expected: `padding-${side}: ${expected}px`,
                actual: `padding-${side}: ${actual}px`,
                confidence: match.confidence,
                message: `Padding mismatch on "${match.designNode.name}": ` +
                    `padding-${side} expected ${expected}px, got ${actual}px ` +
                    `(diff: ${diff}px, threshold: ±${delta}px).`
            }];
    });
}
function marginFindings(match, delta) {
    if (!match.renderedNode.margin)
        return [];
    return SIDES.flatMap((side) => {
        const actual = match.renderedNode.margin[side];
        if (actual <= delta)
            return [];
        return [{
                id: (0, utils_1.generateId)(),
                severity: 'warning',
                category: 'spacing',
                targetName: match.designNode.name,
                expected: `margin-${side}: 0px`,
                actual: `margin-${side}: ${actual}px`,
                confidence: match.confidence,
                message: `Unexpected margin on "${match.designNode.name}": ` +
                    `margin-${side} is ${actual}px but the Figma design uses no margins ` +
                    `(threshold: ±${delta}px).`
            }];
    });
}
function checkSpacing(matches, thresholds) {
    return matches
        .filter((match) => match.renderedNode !== null)
        .flatMap((match) => [
        ...paddingFindings(match, thresholds.spacingDelta),
        ...marginFindings(match, thresholds.spacingDelta)
    ]);
}
//# sourceMappingURL=spacing.js.map