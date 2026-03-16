import { Finding } from '../shared/findings';
export interface AutoFixOptions {
    cssPaths: string[];
    findings: Finding[];
    figmaLink: string;
    url: string;
    verbose: boolean;
}
export declare function autoFix(opts: AutoFixOptions): Promise<void>;
//# sourceMappingURL=auto-fix.d.ts.map