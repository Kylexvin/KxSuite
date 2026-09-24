// src/constants/suiteCards.ts
import {
  Users,
  Building2,
  FileText,
  CreditCard,
  LifeBuoy,
  Contact,
  type LucideIcon,
} from 'lucide-react';
import { PLATFORM } from './permissions';

export type SuiteCard = {
  id: string;
  /** Any-of. If the user holds ≥1, the card renders. */
  permissions: string[];
  title: string;
  description: string;
  href: string;
  /** Stronger permission upgrades the CTA. First match wins. */
  cta: { label: string; when: string[] }[];
  icon: LucideIcon;
};

export const SUITE_CARDS: SuiteCard[] = [
  {
    id: 'members',
    permissions: [PLATFORM.MEMBERS.VIEW, PLATFORM.MEMBERS.MANAGE],
    title: 'Team Members',
    description: 'View and manage organization members',
    href: '/dashboard/members',
    cta: [
      { label: 'Manage Members', when: [PLATFORM.MEMBERS.MANAGE] },
      { label: 'View Members', when: [PLATFORM.MEMBERS.VIEW] },
    ],
    icon: Users,
  },

  {
    id: 'customers',
    permissions: [
      PLATFORM.CUSTOMERS.VIEW,
      PLATFORM.CUSTOMERS.CREATE,
      PLATFORM.CUSTOMERS.UPDATE,
      PLATFORM.CUSTOMERS.DELETE,
    ],
    title: 'Customers',
    description: 'View and manage organization customers',
    href: '/dashboard/customers',
    cta: [
      {
        label: 'Manage Customers',
        when: [
          PLATFORM.CUSTOMERS.CREATE,
          PLATFORM.CUSTOMERS.UPDATE,
          PLATFORM.CUSTOMERS.DELETE,
        ],
      },
      { label: 'View Customers', when: [PLATFORM.CUSTOMERS.VIEW] },
    ],
    icon: Contact,
  },

  {
    id: 'branches',
    permissions: [PLATFORM.BRANCHES.VIEW, PLATFORM.BRANCHES.MANAGE],
    title: 'Branches',
    description: 'View and manage organization branches',
    href: '/dashboard/branches',
    cta: [
      { label: 'Manage Branches', when: [PLATFORM.BRANCHES.MANAGE] },
      { label: 'View Branches', when: [PLATFORM.BRANCHES.VIEW] },
    ],
    icon: Building2,
  },

  {
    id: 'audit',
    permissions: [PLATFORM.AUDIT.LOGS_VIEW, PLATFORM.AUDIT.LOGS_EXPORT],
    title: 'Audit Logs',
    description: 'Review organization activity and audit history',
    href: '/dashboard/audit',
    cta: [
      { label: 'View Audit Logs', when: [PLATFORM.AUDIT.LOGS_EXPORT] },
      { label: 'View Audit Logs', when: [PLATFORM.AUDIT.LOGS_VIEW] },
    ],
    icon: FileText,
  },

  {
    id: 'billing',
    permissions: [PLATFORM.SUBSCRIPTIONS.VIEW, PLATFORM.SUBSCRIPTIONS.MANAGE],
    title: 'Billing & Subscriptions',
    description: 'Manage products, subscriptions and billing',
    href: '/dashboard/billing',
    cta: [
      { label: 'Manage Billing', when: [PLATFORM.SUBSCRIPTIONS.MANAGE] },
      { label: 'View Billing', when: [PLATFORM.SUBSCRIPTIONS.VIEW] },
    ],
    icon: CreditCard,
  },

  {
    id: 'support',
    permissions: [
      PLATFORM.SUPPORT.TICKETS_VIEW,
      PLATFORM.SUPPORT.TICKETS_CREATE,
    ],
    title: 'Support',
    description: 'View and manage organization support tickets',
    href: '/dashboard/support',
    cta: [
      { label: 'Open Support', when: [PLATFORM.SUPPORT.TICKETS_CREATE] },
      { label: 'Open Support', when: [PLATFORM.SUPPORT.TICKETS_VIEW] },
    ],
    icon: LifeBuoy,
  },
];