// ============================================================
// BUSINESS BHARAT — Card / Panel Component
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';

type Elevation = 'base' | 'panel' | 'elevated' | 'modal';

interface CardProps {
  children: React.ReactNode;
  elevation?: Elevation;
  className?: string;
  padding?: boolean;
  animate?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const elevationClasses: Record<Elevation, string> = {
  base:     'bg-bg-secondary border-border-subtle',
  panel:    'bg-bg-panel border-border-subtle shadow-panel',
  elevated: 'bg-bg-elevated border-border-subtle shadow-panel',
  modal:    'bg-bg-elevated border-border-subtle shadow-panel',
};

export function Card({
  children,
  elevation = 'panel',
  className = '',
  padding = true,
  animate = false,
  header,
  footer,
}: CardProps) {
   const inner = (
    <div
      className={[
        'rounded-xl border',
        elevationClasses[elevation],
        className,
      ].join(' ')}
    >
      {header && (
        <div className="px-4 py-3 border-b border-border-subtle text-sm font-semibold text-text-secondary tracking-wide">
          {header}
        </div>
      )}
      <div className={padding ? 'p-4' : ''}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-border-subtle">
          {footer}
        </div>
      )}
    </div>
  );

  if (!animate) return inner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={[
        'rounded-xl border',
        elevationClasses[elevation],
        className,
      ].join(' ')}
    >
      {header && (
        <div className="px-4 py-3 border-b border-border-subtle text-sm font-semibold text-text-secondary tracking-wide uppercase">
          {header}
        </div>
      )}
      <div className={padding ? 'p-4' : ''}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-border-subtle">
          {footer}
        </div>
      )}
    </motion.div>
  );
}
