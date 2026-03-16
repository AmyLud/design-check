export interface ThresholdConfig {
    fontSizeDelta: number;
    fontWeightTolerance: number;
    borderRadiusDelta: number;
    spacingDelta: number;
    colorDelta: number;
}
export interface DesignCheckConfig {
    viewport: {
        width: number;
        height: number;
    };
    thresholds: ThresholdConfig;
}
export declare const DEFAULT_CONFIG: DesignCheckConfig;
export declare function loadConfig(configPath?: string): Promise<DesignCheckConfig>;
//# sourceMappingURL=config.d.ts.map