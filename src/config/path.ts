import os from 'node:os';
import path from 'node:path';

export type Platform = NodeJS.Platform;

export interface ConfigPaths {
  appName: string;
  platform: Platform;
  configDir: string;
  configFile: string;
}

function getHomeDir(): string {
  const home = os.homedir();
  if (!home) {
    throw new Error('Unable to resolve home directory');
  }
  return home;
}

function getWindowsConfigBase(): string {
  return process.env.APPDATA || path.join(getHomeDir(), 'AppData', 'Roaming');
}

function getMacOSConfigBase(): string {
  return path.join(getHomeDir(), 'Library', 'Application Support');
}

function getLinuxConfigBase(): string {
  return process.env.XDG_CONFIG_HOME || path.join(getHomeDir(), '.config');
}

/**
 * 获取应用配置目录
 *
 * 约定：
 * - Windows: %APPDATA%\<appName>
 * - macOS: ~/Library/Application Support/<appName>
 * - Linux: $XDG_CONFIG_HOME/<appName> 或 ~/.config/<appName>
 */
export function getConfigDir(appName: string): string {
  if (!appName || !appName.trim()) {
    throw new Error('appName is required');
  }

  switch (process.platform) {
    case 'win32':
      return path.join(getWindowsConfigBase(), appName);

    case 'darwin':
      return path.join(getMacOSConfigBase(), appName);

    default:
      return path.join(getLinuxConfigBase(), appName);
  }
}

/**
 * 获取应用配置文件路径
 *
 * 默认文件名为 config.json
 */
export function getConfigFilePath(
  appName: string,
  fileName = 'config.json',
): string {
  if (!fileName || !fileName.trim()) {
    throw new Error('fileName is required');
  }

  return path.join(getConfigDir(appName), fileName);
}

/**
 * 获取完整配置路径信息
 */
export function getConfigPaths(
  appName: string,
  fileName = 'config.json',
): ConfigPaths {
  const configDir = getConfigDir(appName);
  const configFile = path.join(configDir, fileName);

  return {
    appName,
    platform: process.platform,
    configDir,
    configFile,
  };
}
