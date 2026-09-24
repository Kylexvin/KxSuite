// src/lib/resolveSuiteLanding.ts

import { SUITE_CARDS, type SuiteCard } from '@/constants/suiteCards';
import { hasPlatformAccess } from '@/constants/permissions';

export type Product = {
  key: string;
  name: string;
  description: string;
  isActive: boolean;
  subscriptionStatus: string;
  subscriptionIsActive: boolean;
};

export type LandingContext =
  | { kind: 'owner'; cards: SuiteCard[]; products: Product[] }
  | { kind: 'platform-and-products'; cards: SuiteCard[]; products: Product[] }
  | { kind: 'platform-only'; cards: SuiteCard[] }
  | { kind: 'product-only'; products: Product[] };

export type ResolveInput = {
  permissions: string[];
  products: Product[];
};

export type ResolveOutput = {
  context: LandingContext;
  /**
   * When non-null, the caller must redirect instead of rendering the landing
   * page. Used for product-only users, who are SSOed out to the standalone
   * product app.
   */
  redirectTo: string | null;
};

/**
 * Decide which landing context applies and which cards render.
 *
 * Rules:
 *   owner                     → curated dashboard; sidebar has everything
 *   platform + products       → cards + product list + Open buttons
 *   platform only             → cards + "no product access" notice
 *   product only (1 product)  → SSO to that standalone product
 *   product only (2+ products)→ redirect to product picker
 *   no access                 → redirect to identity
 */
export function resolveSuiteLanding({
  permissions,
  products,
}: ResolveInput): ResolveOutput {
  const isOwner = permissions.includes('*');
  const platformAccess = isOwner || hasPlatformAccess(permissions);

  const accessibleProducts = products.filter(
    (p) => p.isActive && (isOwner || userHasProduct(permissions, p.key)),
  );

  // --- Context C: product-only (no platform access) --------------------
  if (!platformAccess) {
    if (accessibleProducts.length === 0) {
      return {
        context: { kind: 'product-only', products: [] },
        redirectTo: '/',
      };
    }
    if (accessibleProducts.length === 1) {
      return {
        context: { kind: 'product-only', products: accessibleProducts },
        redirectTo: productHome(accessibleProducts[0].key),
      };
    }
    return {
      context: { kind: 'product-only', products: accessibleProducts },
      redirectTo: '/select-product',
    };
  }

  // --- Platform access --------------------------------------------------
  const cards = filterCards(permissions);

  if (isOwner) {
    return {
      context: { kind: 'owner', cards, products: accessibleProducts },
      redirectTo: null,
    };
  }

  if (accessibleProducts.length > 0) {
    return {
      context: {
        kind: 'platform-and-products',
        cards,
        products: accessibleProducts,
      },
      redirectTo: null,
    };
  }

  return {
    context: { kind: 'platform-only', cards },
    redirectTo: null,
  };
}

// ---------------------------------------------------------------- helpers

function filterCards(permissions: string[]): SuiteCard[] {
  if (permissions.includes('*')) return SUITE_CARDS;
  return SUITE_CARDS.filter((card) =>
    card.permissions.some((p) => has(permissions, p)),
  );
}

function userHasProduct(permissions: string[], productKey: string): boolean {
  return permissions.some((p) => p.startsWith(`${productKey}.`));
}

function has(permissions: string[], key: string): boolean {
  return permissions.some((p) => {
    if (p === '*') return true;
    if (p.endsWith('.*')) return key.startsWith(p.slice(0, -1));
    return p === key;
  });
}

function productHome(productKey: string): string {
  return `https://${productKey}.kxbyte.co.ke`;
}