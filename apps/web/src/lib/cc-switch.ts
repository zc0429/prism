// Claude Code configuration management utility
// Current implementation uses localStorage (browser) / memory (server)
// Future: replaced by Electron main process file system access

import { encryptClient, decryptClient } from './crypto-client'

export interface ClaudeConfig {
  apiKeys: Record<string, { key: string; baseUrl: string }>;
  defaultModel?: string;
  models: ModelConfig[];
}

export interface ModelConfig {
  provider: string;
  model: string;
  baseUrl: string;
  isActive: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  latency: number;
  error?: string;
}

// ── Storage keys ──────────────────────────────────────────────
function storageKey(): string {
  return 'prism-claude-config';
}

function backupKey(): string {
  return 'prism-claude-config-backup';
}

// ── Encryption helpers ────────────────────────────────────────
async function encryptConfigKeys(config: ClaudeConfig): Promise<ClaudeConfig> {
  if (typeof window === 'undefined') return config
  const cloned: ClaudeConfig = JSON.parse(JSON.stringify(config))
  for (const provider of Object.keys(cloned.apiKeys)) {
    const entry = cloned.apiKeys[provider]
    if (entry && entry.key && !entry.key.startsWith('enc:')) {
      entry.key = 'enc:' + (await encryptClient(entry.key))
    }
  }
  return cloned
}

async function decryptConfigKeys(config: ClaudeConfig): Promise<ClaudeConfig> {
  if (typeof window === 'undefined') return config
  const cloned: ClaudeConfig = JSON.parse(JSON.stringify(config))
  for (const provider of Object.keys(cloned.apiKeys)) {
    const entry = cloned.apiKeys[provider]
    if (entry && entry.key && entry.key.startsWith('enc:')) {
      entry.key = await decryptClient(entry.key.slice(4))
    }
  }
  return cloned
}

// ── Read / Write helpers ──────────────────────────────────────
export function getClaudeConfig(): ClaudeConfig {
  if (typeof window === 'undefined') {
    return { apiKeys: {}, models: [] };
  }
  try {
    const stored = localStorage.getItem(storageKey());
    return stored ? JSON.parse(stored) : { apiKeys: {}, models: [] };
  } catch {
    return { apiKeys: {}, models: [] };
  }
}

/** Async version that decrypts apiKeys for use */
export async function getClaudeConfigAsync(): Promise<ClaudeConfig> {
  const config = getClaudeConfig()
  return decryptConfigKeys(config)
}

function saveConfig(config: ClaudeConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(storageKey(), JSON.stringify(config));
  }
}

// ── Backup / Restore (atomic write guard) ────────────────────
export function backupConfig(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = localStorage.getItem(storageKey());
    if (current !== null) {
      localStorage.setItem(backupKey(), current);
    }
    return true;
  } catch {
    return false;
  }
}

export function restoreConfig(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const backup = localStorage.getItem(backupKey());
    if (backup !== null) {
      localStorage.setItem(storageKey(), backup);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function clearBackup(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(backupKey());
  }
}

/** Atomic write: backup → write → clear backup on success */
export async function writeConfigAtomic(mutator: (cfg: ClaudeConfig) => void): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  backupConfig();
  try {
    const cfg = getClaudeConfig();
    mutator(cfg);
    const encrypted = await encryptConfigKeys(cfg);
    saveConfig(encrypted);
    clearBackup();
    return true;
  } catch {
    return false;
  }
}

// ── High-level APIs ───────────────────────────────────────────
export async function writeApiKey(provider: string, apiKey: string, baseUrl: string): Promise<boolean> {
  return writeConfigAtomic((config) => {
    config.apiKeys[provider] = { key: apiKey, baseUrl };
  });
}

export async function writeModelConfig(modelConfig: ModelConfig): Promise<boolean> {
  return writeConfigAtomic((config) => {
    const idx = config.models.findIndex((m) => m.model === modelConfig.model);
    if (idx >= 0) {
      config.models[idx] = modelConfig;
    } else {
      config.models.push(modelConfig);
    }
    if (modelConfig.isActive) {
      config.models.forEach((m) => {
        if (m.model !== modelConfig.model) m.isActive = false;
      });
      config.defaultModel = modelConfig.model;
    }
  });
}

export async function testConnection(
  baseUrl: string,
  apiKey: string,
): Promise<ConnectionTestResult> {
  const start = Date.now();
  try {
    const res = await fetch('/api/config/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl, apiKey }),
    });
    const data = await res.json();
    return { ...data, latency: Date.now() - start };
  } catch {
    return { success: false, latency: Date.now() - start, error: 'Network error' };
  }
}

export async function listConfiguredModels(): Promise<ModelConfig[]> {
  const cfg = await getClaudeConfigAsync();
  return cfg.models;
}

export async function removeApiKey(provider: string): Promise<boolean> {
  return writeConfigAtomic((config) => {
    delete config.apiKeys[provider];
  });
}
