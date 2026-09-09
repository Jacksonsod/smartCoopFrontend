import { Inbox } from 'lucide-react';

/**
 * EmptyState — consistent "no data yet" placeholder.
 *
 * Replaces one-off empty messages like MemberDashboard's
 * "No activities assigned to you yet." text node.
 *
 * Props:
 *   icon     {Component} — optional lucide icon (defaults to Inbox)
 *   title    {string}    — main message (default 'No data yet')
 *   subtitle {string}    — optional secondary description line
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data yet',
  subtitle,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-14 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <Icon className="h-7 w-7 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-xs">{subtitle}</p>
      )}
    </div>
  );
}
