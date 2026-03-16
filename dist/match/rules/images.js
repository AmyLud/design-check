"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkImages = checkImages;
const utils_1 = require("../../shared/utils");
function checkImages(renderedNodes) {
    return renderedNodes
        .filter((node) => node.tag === 'img' && node.imageBroken === true)
        .map((node) => ({
        id: (0, utils_1.generateId)(),
        severity: 'error',
        category: 'broken-image',
        targetName: node.selector,
        expected: 'image loaded',
        actual: node.imageSrc ?? '(no src)',
        confidence: 1,
        selector: node.selector,
        message: `Broken image: <${node.selector}> failed to load${node.imageSrc ? ` (src: ${node.imageSrc})` : ''}.`
    }));
}
//# sourceMappingURL=images.js.map