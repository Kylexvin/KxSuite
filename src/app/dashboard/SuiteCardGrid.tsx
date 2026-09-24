'use client';

import { useRouter } from 'next/navigation';
import { usePermissions } from '@/contexts/PermissionsContext';
import type { SuiteCard } from '@/constants/suiteCards';
import styles from './SuiteCardGrid.module.css';

type Props = {
  cards: SuiteCard[];
  variant: 'owner' | 'member';
};

export function SuiteCardGrid({ cards, variant }: Props) {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  if (cards.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Quick Actions</h2>
      <div
        className={`${styles.grid} ${
          variant === 'owner' ? styles.gridOwner : styles.gridMember
        }`}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          const cta =
            card.cta.find((c) => hasPermission(c.when[0]))?.label ??
            card.cta[card.cta.length - 1]?.label ??
            'Open';

          return (
            <button
              key={card.id}
              type="button"
              className={styles.card}
              onClick={() => router.push(card.href)}
            >
              <span className={styles.iconWrap}>
                <Icon size={18} className={styles.icon} />
              </span>
              <span className={styles.body}>
                <span className={styles.title}>{card.title}</span>
                <span className={styles.description}>{card.description}</span>
              </span>
              <span className={styles.cta}>{cta} →</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}