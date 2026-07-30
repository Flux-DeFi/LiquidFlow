import React from 'react';

interface CardProps {
    /** Content rendered inside the card. */
    children: React.ReactNode;
    /** Additional CSS classes appended to the card's base styles. */
    className?: string;
    /** Adds the accent glow treatment when true. @default false */
    glow?: boolean;
    /** Enables the lift, border, and shadow hover treatment. @default true */
    hover?: boolean;
}

/**
 * Shared glass-panel container for grouping dashboard content.
 *
 * @example
 * ```tsx
 * <Card glow hover={false}>
 *   <p>Stream summary</p>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    glow = false,
    hover = true,
}) => {
    return (
        <div className={`
      glass-card rounded-2xl p-6 transition-all duration-300
      ${glow ? 'glow-card' : ''}
      ${hover ? 'hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5' : ''}
      ${className}
    `}>
            {children}
        </div>
    );
};
