type StatCardProps = {
  label: string;
  value: string | number;
  subtext?: string;
  tone?: "default" | "success" | "warning" | "danger";
};

const toneMap = {
  default: {
    dot: "bg-brand",
    ring: "ring-blue-100",
  },
  success: {
    dot: "bg-success",
    ring: "ring-green-100",
  },
  warning: {
    dot: "bg-warning",
    ring: "ring-amber-100",
  },
  danger: {
    dot: "bg-danger",
    ring: "ring-red-100",
  },
};

export default function StatCard({
  label,
  value,
  subtext,
  tone = "default",
}: StatCardProps) {
  const colors = toneMap[tone];

  return (
    <div className="panel-premium relative overflow-hidden p-5">
      <div className="absolute inset-0 nexus-grid-bg opacity-20" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nexus-500">
            {label}
          </p>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-nexus-900">
            {value}
          </div>
          {subtext ? <p className="mt-2 text-sm text-nexus-500">{subtext}</p> : null}
        </div>

        <div className={`mt-1 rounded-full p-2 ring-4 ${colors.ring}`}>
          <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
        </div>
      </div>
    </div>
  );
}