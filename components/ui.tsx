import type { Task } from "@/types/electron";
import { daysUntil } from "@/lib/date";

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-card/90 p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-dashed border-line bg-paper/60 p-6 text-center text-ink/55">{children}</div>;
}

export function PriorityPill({ priority }: { priority: Task["priority"] }) {
  const label = { low: "منخفضة", medium: "متوسطة", high: "عالية" }[priority];
  const tone = {
    low: "bg-mint/10 text-mint",
    medium: "bg-saffron/15 text-[#9a6411]",
    high: "bg-berry/10 text-berry",
  }[priority];
  return <span className={`rounded px-2 py-1 text-xs font-medium ${tone}`}>{label}</span>;
}

export function DueLabel({ date }: { date: string | null }) {
  const days = daysUntil(date);
  if (days === null) return <span className="text-sm text-ink/45">بدون موعد</span>;
  if (days < 0) return <span className="text-sm font-medium text-berry">متأخرة {Math.abs(days)} يوم</span>;
  if (days === 0) return <span className="text-sm font-medium text-berry">اليوم</span>;
  return <span className="text-sm text-ink/60">بعد {days} يوم</span>;
}
