"use client";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

export function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  const trendColor =
    trend === "up"
      ? "text-primary"
      : trend === "down"
        ? "text-danger"
        : "text-foreground";

  return (
    <div className="bg-card border border-card-border rounded-xl p-6">
      <p className="text-sm font-medium text-text-muted">{title}</p>
      <p className={`mt-2 text-3xl font-semibold ${trendColor}`}>{value}</p>
      {subtitle && (
        <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
      )}
    </div>
  );
}
