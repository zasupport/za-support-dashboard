/**
 * ZA Support — Edge Config utility
 * Reads from Vercel Edge Config (globally distributed KV store)
 * Used for: feature flags, system status, maintenance mode
 * Store: ecfg_9ghsdgt2ugav5jyigeg6ne4jrv1q
 */
import { createClient } from '@vercel/edge-config';

// Use the built-in EDGE_CONFIG env var set by Vercel
export const edgeConfig = process.env.EDGE_CONFIG
  ? createClient(process.env.EDGE_CONFIG)
  : null;

export interface FeatureFlags {
  cybershield_enabled: boolean;
  workshop_enabled: boolean;
  forensics_enabled: boolean;
  guides_enabled: boolean;
  breach_scanner_enabled: boolean;
  vault_enabled: boolean;
}

export interface SystemStatus {
  api: string;
  database: string;
  scout: string;
  last_checked: string;
}

export interface ZASupportConfig {
  version: string;
  region: string;
  max_devices_per_client: number;
  report_retention_days: number;
}

/**
 * Get feature flags from Edge Config with fallback to all-enabled defaults.
 * Falls back gracefully if Edge Config is unavailable (local dev without EDGE_CONFIG set).
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  const defaults: FeatureFlags = {
    cybershield_enabled: true,
    workshop_enabled: true,
    forensics_enabled: true,
    guides_enabled: true,
    breach_scanner_enabled: true,
    vault_enabled: true,
  };
  try {
    if (!edgeConfig) return defaults;
    const flags = await edgeConfig.get<FeatureFlags>('feature_flags');
    return flags ?? defaults;
  } catch {
    return defaults;
  }
}

/**
 * Get system status from Edge Config.
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  const defaults: SystemStatus = {
    api: 'operational',
    database: 'operational',
    scout: 'operational',
    last_checked: new Date().toISOString().split('T')[0],
  };
  try {
    if (!edgeConfig) return defaults;
    const status = await edgeConfig.get<SystemStatus>('system_status');
    return status ?? defaults;
  } catch {
    return defaults;
  }
}

/**
 * Check maintenance mode flag.
 */
export async function isMaintenanceMode(): Promise<boolean> {
  try {
    if (!edgeConfig) return false;
    const mode = await edgeConfig.get<boolean>('maintenance_mode');
    return mode ?? false;
  } catch {
    return false;
  }
}

/**
 * Get ZA Support backend config from Edge Config.
 */
export async function getZASupportConfig(): Promise<ZASupportConfig> {
  const defaults: ZASupportConfig = {
    version: '11.3.0',
    region: 'Frankfurt',
    max_devices_per_client: 10,
    report_retention_days: 365,
  };
  try {
    if (!edgeConfig) return defaults;
    const config = await edgeConfig.get<ZASupportConfig>('za_support_config');
    return config ?? defaults;
  } catch {
    return defaults;
  }
}
