"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchContainers = matchContainers;
const normalize_1 = require("../figma/normalize");
const MIN_CONFIDENCE = 0.3;
function iouScore(design, rendered) {
    const interLeft = Math.max(design.x, rendered.x);
    const interTop = Math.max(design.y, rendered.y);
    const interRight = Math.min(design.x + design.width, rendered.x + rendered.width);
    const interBottom = Math.min(design.y + design.height, rendered.y + rendered.height);
    if (interRight <= interLeft || interBottom <= interTop)
        return 0;
    const interArea = (interRight - interLeft) * (interBottom - interTop);
    const unionArea = design.width * design.height + rendered.width * rendered.height - interArea;
    return unionArea > 0 ? interArea / unionArea : 0;
}
function matchContainers(designRoot, renderedNodes) {
    return (0, normalize_1.flattenNodes)(designRoot)
        .filter((n) => n.padding != null)
        .map((designNode) => {
        const best = renderedNodes.reduce((acc, rendered) => {
            const score = iouScore(designNode, rendered);
            return score > acc.score ? { node: rendered, score } : acc;
        }, { node: null, score: 0 });
        return {
            designNode,
            renderedNode: best.score >= MIN_CONFIDENCE ? best.node : null,
            confidence: best.score
        };
    });
}
//# sourceMappingURL=match-containers.js.map