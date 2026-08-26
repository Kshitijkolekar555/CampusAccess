import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  /** colorTheme is accepted for backward-compat but ignored visually */
  colorTheme?: 'indigo' | 'emerald' | 'amber' | 'cyan' | 'purple';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title, value, icon, trend, description,
}) => {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--line)',
        borderRadius: 4,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--mute)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
    >
      <div>
        {/* Title */}
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--mute)',
            margin: '0 0 8px 0',
          }}
        >
          {title}
        </p>

        {/* Value */}
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 32,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            margin: 0,
          }}
        >
          {value}
        </p>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 11,
                color: trend.isPositive ? '#047857' : '#be123c',
              }}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: 'var(--mute)',
              }}
            >
              vs yesterday
            </span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p
            className="mt-1.5"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              color: 'var(--mute)',
              margin: '6px 0 0 0',
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Icon — muted, no coloured box */}
      {icon && (
        <div style={{ color: 'var(--line)', flexShrink: 0, marginTop: 4 }}>
          {icon}
        </div>
      )}
    </div>
  );
};
