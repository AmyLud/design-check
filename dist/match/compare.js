"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = compare;
const normalize_1 = require("../figma/normalize");
const match_text_1 = require("./match-text");
const match_containers_1 = require("./match-containers");
const text_presence_1 = require("./rules/text-presence");
const font_size_1 = require("./rules/font-size");
const font_weight_1 = require("./rules/font-weight");
const radius_1 = require("./rules/radius");
const spacing_1 = require("./rules/spacing");
const color_1 = require("./rules/color");
const contrast_1 = require("./rules/contrast");
const images_1 = require("./rules/images");
/**
 * Run all comparison rules between the Figma design and rendered page nodes.
 * Returns a combined array of findings, sorted by severity (errors first).
 */
async function compare(designRoot, renderedNodes, config) {
    const { thresholds } = config;
    // Get all text nodes from the design
    const textNodes = (0, normalize_1.getTextNodes)(designRoot);
    // Match design text nodes to rendered nodes
    const matches = (0, match_text_1.matchNodes)(textNodes, renderedNodes);
    // Match design container nodes (frames with padding/gap) to rendered nodes
    const containerMatches = (0, match_containers_1.matchContainers)(designRoot, renderedNodes);
    const presenceFindings = (0, text_presence_1.checkTextPresence)(matches);
    const fontSizeFindings = (0, font_size_1.checkFontSize)(matches, thresholds);
    const fontWeightFindings = (0, font_weight_1.checkFontWeight)(matches, thresholds);
    const radiusFindings = (0, radius_1.checkRadius)(matches, thresholds);
    const spacingFindings = (0, spacing_1.checkSpacing)(containerMatches, thresholds);
    const colorFindings = (0, color_1.checkColor)(matches, thresholds);
    const contrastFindings = (0, contrast_1.checkContrast)(matches);
    const imageFindings = (0, images_1.checkImages)(renderedNodes);
    const allFindings = [
        presenceFindings,
        fontSizeFindings,
        fontWeightFindings,
        radiusFindings,
        spacingFindings,
        colorFindings,
        contrastFindings,
        imageFindings
    ].flat();
    // Sort: errors first, then warnings, then info
    const severityOrder = {
        error: 0,
        warning: 1,
        info: 2
    };
    allFindings.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));
    return allFindings;
}
//# sourceMappingURL=compare.js.map