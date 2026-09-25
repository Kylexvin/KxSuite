// app/dashboard/members/constants/starterRoles.ts

/**
 * Starter roles offered when an organization has no custom roles yet.
 * Each role's `permissionKeys` are intersected with the org's available
 * permissions at submit time, so unused keys are silently dropped.
 *
 * These are frontend-defined — no backend seed data required.
 */

import { PLATFORM } from '@/constants/permissions';

export type StarterRoleKey = 'manager' | 'staff';

export type StarterRole = {
  key: StarterRoleKey;
  name: string;
  description: string;
  permissionKeys: string[];
};

export const STARTER_ROLES: readonly StarterRole[] = [
  {
    key: 'manager',
    name: 'Manager',
    description: 'Day-to-day operations across all branches',
    permissionKeys: [
      // Platform
      PLATFORM.MEMBERS.VIEW,
      PLATFORM.BRANCHES.VIEW,
      PLATFORM.CUSTOMERS.VIEW,
      PLATFORM.CUSTOMERS.CREATE,
      PLATFORM.CUSTOMERS.UPDATE,
      'settings.view',
      // Support — branch-scoped manager tier
      'support.tickets.view',
      'support.tickets.create',
      'support.tickets.manage',
      // KxTill — broad but not wildcard
      'kxtill.sales.view',
      'kxtill.sales.create',
      'kxtill.sales.refund',
      'kxtill.inventory.view',
      'kxtill.inventory.create',
      'kxtill.inventory.update',
      'kxtill.inventory.transfers.create',
      'kxtill.inventory.transfers.approve',
      'kxtill.reports.view',
      'kxtill.reports.export',
    ],
  },
  {
    key: 'staff',
    name: 'Staff',
    description: 'Point of sale access for daily work',
    permissionKeys: [
      PLATFORM.CUSTOMERS.VIEW,
      'support.tickets.view',
      'support.tickets.create',
      'kxtill.sales.view',
      'kxtill.sales.create',
      'kxtill.inventory.view',
    ],
  },
];

export const DEFAULT_STARTER_ROLE: StarterRoleKey = 'staff';