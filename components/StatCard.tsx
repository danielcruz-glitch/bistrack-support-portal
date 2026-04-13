export function StatCard({ label, value, help }: { label: string; value: string | number; help?: string }) {
  return (
    <div className="card">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {help && <p className="mt-2 text-xs text-slate-500">{help}</p>}
    </div>
  );
}
