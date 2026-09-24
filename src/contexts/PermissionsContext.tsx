// src/contexts/PermissionsContext.tsx

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';
import { expandPermissions } from '@/constants/permissions';

type PermissionsValue = {
  permissions: string[];
  isOwner: boolean;
  /** True once suiteContext has actually loaded (not just defaults). */
  isReady: boolean;
  hasPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  hasAllPermissions: (keys: string[]) => boolean;
  can: (key: string) => boolean;
  canAny: (keys: string[]) => boolean;
  canAll: (keys: string[]) => boolean;
};

const PermissionsContext = createContext<PermissionsValue | null>(null);

export function PermissionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { suiteContext } = useAuth();

  // suiteContext is null until AuthContext finishes its me/dashboard fetch.
  const isReady = suiteContext !== null && suiteContext !== undefined;

  const raw = suiteContext?.permissions ?? [];

  const permissions = useMemo(() => expandPermissions(raw), [raw]);

  const isOwner = useMemo(() => permissions.includes('*'), [permissions]);

  const hasPermission = useCallback(
    (key: string) => matches(permissions, key),
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (keys: string[]) => keys.some((k) => matches(permissions, k)),
    [permissions],
  );

  const hasAllPermissions = useCallback(
    (keys: string[]) => keys.every((k) => matches(permissions, k)),
    [permissions],
  );

  const value = useMemo<PermissionsValue>(
    () => ({
      permissions,
      isOwner,
      isReady,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      can: hasPermission,
      canAny: hasAnyPermission,
      canAll: hasAllPermissions,
    }),
    [
      permissions,
      isOwner,
      isReady,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    ],
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------- helpers

function matches(permissions: string[], key: string): boolean {
  return permissions.some((p) => {
    if (p === '*') return true;
    if (p.endsWith('.*')) return key.startsWith(p.slice(0, -1));
    return p === key;
  });
}