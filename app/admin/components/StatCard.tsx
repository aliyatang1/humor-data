export function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-100 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 dark:text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {subtitle && <p className="text-gray-500 dark:text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-gray-400 dark:text-slate-500">{icon}</div>}
      </div>
    </div>
  );
}
