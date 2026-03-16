import { DesignNode } from '../figma/normalize';
import { RenderedNode } from '../render/types';
export interface ContainerMatch {
    designNode: DesignNode;
    renderedNode: RenderedNode | null;
    confidence: number;
}
export declare function matchContainers(designRoot: DesignNode, renderedNodes: RenderedNode[]): ContainerMatch[];
//# sourceMappingURL=match-containers.d.ts.map