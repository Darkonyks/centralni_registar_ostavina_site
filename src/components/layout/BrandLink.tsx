import { SITE } from '../../config/site';
import { LogoMark } from '../ui/LogoMark';

/** Znak i naziv sistema; vodi na vrh stranice. */
export function BrandLink() {
  return (
    <a href="#top" className="flex min-w-0 items-center gap-2.5 rounded-md">
      <LogoMark className="h-10" />
      <span className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
        {SITE.name}
      </span>
    </a>
  );
}
