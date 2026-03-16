"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTextPresence = checkTextPresence;
const utils_1 = require("../../shared/utils");
function checkTextPresence(matches) {
    return matches
        .filter((match) => match.confidence === 0 || match.renderedNode === null)
        .map((match) => {
        const text = match.designNode.text ?? '';
        const truncated = text.length > 60 ? `${text.slice(0, 60)}…` : text;
        return {
            id: (0, utils_1.generateId)(),
            severity: 'error',
            category: 'missing-text',
            targetName: match.designNode.name,
            expected: truncated || '(empty)',
            actual: null,
            confidence: 0,
            message: `Text node "${match.designNode.name}" with content "${truncated}" was not found on the rendered page.`
        };
    });
}
//# sourceMappingURL=text-presence.js.map