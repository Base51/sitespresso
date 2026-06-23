'use client';

interface QuotaDisplayProps {
  remaining: number;
  total: number;
  label?: string;
}

export default function QuotaDisplay({
  remaining,
  total,
  label = 'Remaining generations this month',
}: QuotaDisplayProps): JSX.Element {
  const percentage = Math.round((remaining / total) * 100);
  const isLow = percentage < 20;
  const isCritical = percentage < 5;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-brand-muted-strong">{label}</p>
        <p className={`text-sm font-semibold ${isCritical ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
          {remaining} / {total}
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full transition-all ${
            isCritical ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
