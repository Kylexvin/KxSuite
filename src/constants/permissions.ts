// src/constants/permissions.ts

export const PLATFORM = {
  BRANCHES: {
    VIEW: 'branches.view',
    MANAGE: 'branches.manage',
  },
  MEMBERS: {
    VIEW: 'members.view',
    MANAGE: 'members.manage',
  },
  CUSTOMERS: {
    VIEW: 'customers.view',
    CREATE: 'customers.create',
    UPDATE: 'customers.update',
    DELETE: 'customers.delete',
  },
  AUDIT: {
    LOGS_VIEW: 'audit.logs.view',
    LOGS_EXPORT: 'audit.logs.export',
  },
  SUBSCRIPTIONS: {
    VIEW: 'subscriptions.view',
    MANAGE: 'subscriptions.manage',
  },
  SUPPORT: {
    TICKETS_VIEW: 'support.tickets.view',
    TICKETS_CREATE: 'support.tickets.create',
  },
} as const;

export const PRODUCT_PREFIXES = ['kxtill'] as const;
export type ProductPrefix = (typeof PRODUCT_PREFIXES)[number];

export const PLATFORM_SET: ReadonlySet<string> = new Set(
  Object.values(PLATFORM).flatMap((group) => Object.values(group)),
);

export function isProductPermission(key: string): boolean {
  return PRODUCT_PREFIXES.some((prefix) => key.startsWith(`${prefix}.`));
}

export function isPlatformPermission(key: string): boolean {
  return PLATFORM_SET.has(key);
}

export function productOf(key: string): ProductPrefix | null {
  for (const prefix of PRODUCT_PREFIXES) {
    if (key.startsWith(`${prefix}.`)) return prefix;
  }
  return null;
}

export function hasPlatformAccess(permissions: string[]): boolean {
  if (permissions.includes('*')) return true;
  return permissions.some(isPlatformPermission);
}

// ---------------------------------------------------------------- expansion

const KXTILL_KEYS: readonly string[] = [
  'kxtill.sales.create',
  'kxtill.sales.view',
  'kxtill.sales.refund',
  'kxtill.inventory.create',
  'kxtill.inventory.view',
  'kxtill.inventory.update',
  'kxtill.inventory.delete',
  'kxtill.inventory.global.view',
  'kxtill.inventory.transfers.create',
  'kxtill.inventory.transfers.approve',
  'kxtill.inventory.transfers.complete',
  'kxtill.reports.view',
  'kxtill.reports.export',
  'kxtill.settings.view',
  'kxtill.settings.update',
];

export function expandPermissions(raw: string[]): string[] {
  if (!Array.isArray(raw)) return [];
  if (raw.includes('*')) return ['*'];

  const expanded = new Set<string>();

  for (const entry of raw) {
    if (!entry) continue;

    if (entry.endsWith('.*')) {
      const prefix = entry.slice(0, -1); // keep trailing dot
      for (const key of PLATFORM_SET) {
        if (key.startsWith(prefix)) expanded.add(key);
      }
      if (prefix.startsWith('kxtill.')) {
        for (const key of KXTILL_KEYS) {
          if (key.startsWith(prefix)) expanded.add(key);
        }
      }
      continue;
    }

    expanded.add(entry);
  }

  return Array.from(expanded);
}