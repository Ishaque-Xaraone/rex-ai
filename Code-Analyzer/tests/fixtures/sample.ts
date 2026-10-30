import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface UserConfig {
  apiKey: string;
  debugMode: boolean;
}

export class ConfigManager {
  private configPath: string;

  constructor(filePath: string) {
    this.configPath = filePath;
  }

  public async loadConfig(): Promise<string> {
    try {
      const data = await readFile(this.configPath, 'utf-8');
      return data;
    } catch {
      // Empty catch block
    }
    return '';
  }

  public dangerousEval(input: string): unknown {
    return eval(input);
  }
}

export function parseData(raw: string): unknown {
  return JSON.parse(raw);
}
