"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDomScript = extractDomScript;
/**
 * Returns a string of JavaScript to be evaluated in the browser via Playwright's page.evaluate().
 * The script walks the DOM and extracts relevant nodes with their computed styles.
 */
function extractDomScript() {
    return `
(function extractDesignNodes() {
  function parsePx(value) {
    if (!value || value === '' || value === 'none' || value === 'normal') return undefined;
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }

  function getSelector(el) {
    let selector = el.tagName.toLowerCase();
    if (el.id) {
      selector += '#' + el.id;
    } else if (el.className && typeof el.className === 'string' && el.className.trim()) {
      const firstClass = el.className.trim().split(/\\s+/)[0];
      if (firstClass) selector += '.' + firstClass;
    }
    return selector;
  }

  function getDirectText(el) {
    let text = '';
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) text += node.textContent || '';
    }
    text = text.trim();
    return text.length > 0 ? text : undefined;
  }

  function getAllText(el) {
    const text = (el.textContent || '').trim();
    return text.length > 0 ? text : undefined;
  }

  function isVisible(el, style, rect) {
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) === 0) return false;
    // Allow zero-size for images (may be broken but still relevant)
    if (el.tagName.toLowerCase() !== 'img' && rect.width === 0 && rect.height === 0) return false;
    return true;
  }

  function isInteresting(el, tag, style) {
    const interactiveTags = ['a', 'button', 'input', 'select', 'textarea', 'label'];
    if (interactiveTags.includes(tag)) return true;

    if (tag === 'img') return true;

    const semanticTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'td', 'th', 'caption', 'figcaption', 'blockquote', 'cite', 'abbr', 'time', 'mark', 'strong', 'em', 'span'];
    if (semanticTags.includes(tag)) return true;

    const structuralTags = ['header', 'main', 'section', 'article', 'nav', 'aside', 'form', 'footer', 'div', 'ul', 'ol'];
    if (structuralTags.includes(tag)) return true;

    if (el.hasAttribute('role')) return true;

    const directText = getDirectText(el);
    if (directText && directText.length > 0) return true;

    if ((tag === 'div' || tag === 'span') && el.children.length === 0) {
      const text = getAllText(el);
      if (text && text.length > 0) return true;
    }

    return false;
  }

  /**
   * Walk up the DOM to find the first ancestor with a non-transparent background.
   * Falls back to white if none is found.
   */
  function getEffectiveBg(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const bg = window.getComputedStyle(node).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      node = node.parentElement;
    }
    return 'rgb(255, 255, 255)';
  }

  const results = [];
  const seen = new WeakSet();

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);

  let el = walker.currentNode;
  while (el) {
    const element = el;

    if (seen.has(element) || !(element instanceof HTMLElement)) {
      el = walker.nextNode();
      continue;
    }
    seen.add(element);

    const tag = element.tagName.toLowerCase();
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    if (!isVisible(element, style, rect)) {
      el = walker.nextNode();
      continue;
    }

    if (!isInteresting(element, tag, style)) {
      el = walker.nextNode();
      continue;
    }

    let text;
    if (element.children.length === 0) {
      text = getAllText(element);
    } else {
      text = getDirectText(element);
    }

    const fontSize = parsePx(style.fontSize);

    const paddingTop    = parsePx(style.paddingTop)    || 0;
    const paddingRight  = parsePx(style.paddingRight)  || 0;
    const paddingBottom = parsePx(style.paddingBottom) || 0;
    const paddingLeft   = parsePx(style.paddingLeft)   || 0;

    const marginTop    = parsePx(style.marginTop)    || 0;
    const marginRight  = parsePx(style.marginRight)  || 0;
    const marginBottom = parsePx(style.marginBottom) || 0;
    const marginLeft   = parsePx(style.marginLeft)   || 0;

    const node = {
      selector: getSelector(element),
      tag,
      text,
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      fontSize,
      fontWeight: style.fontWeight || undefined,
      color: style.color || undefined,
      backgroundColor: style.backgroundColor || undefined,
      effectiveBackgroundColor: getEffectiveBg(element),
      borderRadius: style.borderRadius || undefined,
      padding:  { top: paddingTop,  right: paddingRight,  bottom: paddingBottom,  left: paddingLeft  },
      margin:   { top: marginTop,   right: marginRight,   bottom: marginBottom,   left: marginLeft   },
      imageSrc:    tag === 'img' ? (element.src || undefined) : undefined,
      imageBroken: tag === 'img' ? (element.complete && element.naturalWidth === 0) : undefined,
      role: element.getAttribute('role') || undefined
    };

    results.push(node);
    el = walker.nextNode();
  }

  return results;
})();
  `.trim();
}
//# sourceMappingURL=extract-dom.js.map