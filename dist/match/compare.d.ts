import { DesignNode } from '../figma/normalize';
import { RenderedNode } from '../render/types';
import { DesignCheckConfig } from '../shared/config';
import { Finding } from '../shared/findings';
/**
 * Run all comparison rules between the Figma design and rendered page nodes.
 * Returns a combined array of findings, sorted by severity (errors first).
 */
export declare function compare(designRoot: DesignNode, renderedNodes: RenderedNode[], config: DesignCheckConfig): Promise<Finding[]>;
//# sourceMappingURL=compare.d.ts.map