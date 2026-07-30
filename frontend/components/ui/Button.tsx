import React from 'react';

/**
 * Props for {@link Button}. All native button attributes, including
 * `children`, `disabled`, `onClick`, and `type`, are also supported.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual treatment applied to the button. @default 'primary' */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    /** Controls the button's padding and text size. @default 'md' */
    size?: 'sm' | 'md' | 'lg';
    /** Adds the accent glow treatment when true. @default false */
    glow?: boolean;
}

/**
 * Shared action button with LiquidFlow variants and sizes.
 *
 * @example
 * ```tsx
 * <Button variant="outline" size="sm" type="button">
 *   Review stream
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    glow = false,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-full font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        primary: 'bg-accent text-background hover:bg-accent-hover',
        secondary: 'bg-accent-secondary text-white hover:opacity-90',
        outline: 'border border-glass-border bg-glass hover:bg-white/5',
        ghost: 'text-slate-400 hover:text-accent transition-colors',
    };

    const sizes = {
        sm: 'px-4 py-1.5 text-xs',
        md: 'px-6 py-2.5 text-sm',
        lg: 'px-8 py-3.5 text-base',
    };

    const glowStyles = glow ? 'shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]' : '';

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${glowStyles} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
