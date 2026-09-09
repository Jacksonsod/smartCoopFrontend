import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * StatCard — canonical shared metric card.
 * Replaces per-page PremiumStatCard / StatCard inline copies in:
 *   CoopAdminDashboard, MemberDashboard, FieldOfficerDashboard,
 *   AccountantDashboard, SuperAdminDashboard, QualityInspectorDashboard.
 *
 * Props:
 *   label     {string}            — uppercase label text
 *   value     {string|number}     — main metric value
 *   icon      {Component}         — lucide icon component
 *   subtext   {string}            — optional small line below value
 *   trend     {string}            — optional trend label e.g. "+12% from last month"
 *   trendDir  {'up'|'down'|'flat'}— controls trend icon + color (default 'up')
 *   color     {'emerald'|'blue'|'amber'|'purple'|'cherry'|'gold'} — accent palette
 *   loading   {boolean}           — shows skeleton shimmer when true
 */

const COLOR_MAP = {
  emerald: {
    accent: '#10b981',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/30',
  },
  blue: {
    accent: '#3b82f6',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-900/30',
  },
  amber: {
    accent: '#f59e0b',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-900/30',
  },
  purple: {
    accent: '#8b5cf6',
    bg: 'bg-purple-50/50 dark:bg-purple-950/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-900/30',
  },
  cherry: {
    accent: 'var(--color-cherry, #A8332B)',
    bg: 'bg-red-50/50 dark:bg-red-950/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-100 dark:border-red-900/30',
  },
  gold: {
    accent: 'var(--color-gold, #C89B3C)',
    bg: 'bg-yellow-50/50 dark:bg-yellow-950/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-100 dark:border-yellow-900/30',
  },
};

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus };
const TREND_COLOR = {
  up:   'text-emerald-600 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
  flat: 'text-[#7C8B85] dark:text-gray-400',
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  trendDir = 'up',
  color = 'emerald',
  loading = false,
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.emerald;
  const TrendIcon = TREND_ICON[trendDir] ?? TrendingUp;

  return (
    <Card className={`overflow-hidden border ${c.border} bg-white dark:bg-gray-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group`}>
      <CardContent className="p-6 relative">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 truncate">
                {label}
              </p>
              <p className="mt-3 text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                {value}
              </p>
              {subtext && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                  {subtext}
                </p>
              )}
              {trend && (
                <div className={`mt-2.5 flex items-center gap-1.5 text-xs font-semibold ${TREND_COLOR[trendDir]}`}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  {trend}
                </div>
              )}
            </div>
            {Icon && (
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.text} transition-all duration-300 group-hover:scale-110`}
              >
                <Icon className="h-6 w-6" />
              </div>
            )}
          </div>
        )}
        {/* Brand accent bar on right edge */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[3px]"
          style={{ backgroundColor: c.accent }}
        />
      </CardContent>
    </Card>
  );
}
