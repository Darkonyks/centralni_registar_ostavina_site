import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition duration-200 hover:border-slate-300 hover:shadow-[0_12px_32px_-12px_rgb(15_34_54/0.18)] motion-safe:hover:-translate-y-0.5">
      <span
        aria-hidden="true"
        className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset"
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{description}</p>
    </article>
  );
}
