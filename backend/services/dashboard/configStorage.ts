import fs from 'fs/promises';
import path from 'path';
import type { DashboardConfig } from '../../types/dashboard';

const CONFIG_FILE = path.join(__dirname, 'config.json');

async function ensureConfigFile(): Promise<void> {
  try {
    await fs.access(CONFIG_FILE);
  } catch {
    await fs.writeFile(CONFIG_FILE, '{}');
  }
}

export async function readConfig(): Promise<Partial<DashboardConfig>> {
  await ensureConfigFile();
  const data = await fs.readFile(CONFIG_FILE, 'utf-8');
  return JSON.parse(data);
}

export async function writeConfig(config: DashboardConfig): Promise<void> {
  await ensureConfigFile();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}
