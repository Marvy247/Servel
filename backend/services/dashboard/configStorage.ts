import type { DashboardConfig } from '../../types/dashboard';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(__dirname, '../../../config/dashboard.json');

export async function readConfig(): Promise<Partial<DashboardConfig>> {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

export async function writeConfig(config: Partial<DashboardConfig>): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}
