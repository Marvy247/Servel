import type { DashboardConfig } from '../../types/dashboard';

export declare function readConfig(): Promise<Partial<DashboardConfig>>;
export declare function writeConfig(config: DashboardConfig): Promise<void>;
