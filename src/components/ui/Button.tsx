// ============================================================
// BUSINESS BHARAT — Button Component
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'success';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  disabled?: boolean;
  comingSoon?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-brand hover:bg-brand-bright text-white border border-brand/50 shadow-glow-brand',
  secondary: 'bg-bg-elevated hover:bg-bg-panel text-text-primary border border-border-subtle',
  ghost:     'bg-transparent hover:bg-bg-elevated text-text-secondary hover:text-text-primary border border-transparent hover:border-border-subtle',
  danger:    'bg-danger/20 hover:bg-danger/30 text-danger border border-danger/40',
  gold:      'bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 shadow-glow-gold',
  success:   'bg-success/20 hover:bg-success/30 text-success border border-success/40',
};

const sizeClasses: Record<Size, string> = {
  xs:  'px-2 py-1 text-[10px] gap-1',
  sm:  'px-3 py-1.5 text-xs gap-1.5',
  md:  'px-4 py-2 text-sm gap-2',
  lg:  'px-6 py-3 text-base gap-2',
  xl:  'px-8 py-4 text-lg gap-3',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  disabled = false,
  comingSoon = false,
  fullWidth = false,
  type = 'button',
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || comingSoon;

  return (
    <motion.button
      type={type}
      onClick={!isDisabled ? onClick : undefined}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-colors duration-150 select-none outline-none',
        'focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {Icon && <Icon size={size === 'xl' ? 20 : size === 'lg' ? 18 : size === 'md' ? 16 : size === 'sm' ? 14 : 12} />}
      <span>{children}</span>
      {comingSoon && <span className="badge-soon">Soon</span>}
      {IconRight && <IconRight size={size === 'xl' ? 20 : size === 'lg' ? 18 : size === 'md' ? 16 : size === 'sm' ? 14 : 12} />}
    </motion.button>
  );
}
