/**
 * PageHeader — consistent title + subtitle + optional right-side actions.
 *
 * Replaces the duplicated flex header blocks that every page re-implements
 * from scratch with slightly different class names.
 *
 * Props:
 *   title    {string}    — main h1 heading
 *   subtitle {string}    — optional description line
 *   actions  {ReactNode} — optional right-side buttons/controls
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
