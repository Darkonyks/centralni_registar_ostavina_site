import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { APP_URLS } from '../../config/site';
import { NAV_LINKS } from '../../data/navigation';
import { useScrolled } from '../../hooks/useScrolled';
import { cx } from '../../lib/cx';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { BrandLink } from './BrandLink';

const MOBILE_MENU_ID = 'mobilni-meni';

export function Header() {
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Dok je meni otvoren: Escape i klik van header-a ga zatvaraju, kao i prelazak na desktop širinu.
  useEffect(() => {
    if (!menuOpen) return;

    const desktop = window.matchMedia('(min-width: 80rem)');
    const close = () => setMenuOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        toggleRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    desktop.addEventListener('change', close);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      desktop.removeEventListener('change', close);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      ref={headerRef}
      className={cx(
        'sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-[border-color,box-shadow] duration-200',
        scrolled || menuOpen
          ? 'border-slate-200 shadow-[0_1px_12px_rgb(15_23_42/0.06)]'
          : 'border-transparent',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <BrandLink />

        <nav aria-label="Glavna navigacija" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Button href={APP_URLS.demo} newWindow variant="secondary">
              Demo
            </Button>
            <Button href={APP_URLS.app} newWindow>
              Aplikacija
            </Button>
          </div>

          <button
            ref={toggleRef}
            type="button"
            className="-mr-2 grid size-10 place-items-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 xl:hidden"
            aria-expanded={menuOpen}
            aria-controls={MOBILE_MENU_ID}
            aria-label={menuOpen ? 'Zatvori meni' : 'Otvori meni'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </Container>

      <div
        id={MOBILE_MENU_ID}
        hidden={!menuOpen}
        className="animate-menu-in border-t border-slate-200 bg-white xl:hidden"
      >
        <Container className="pt-2 pb-5">
          <nav aria-label="Glavna navigacija">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={closeMenu}
                    className="-mx-3 block rounded-lg px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-50"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 sm:hidden">
            <Button href={APP_URLS.demo} newWindow variant="secondary" size="lg" className="px-4">
              Demo
            </Button>
            <Button href={APP_URLS.app} newWindow size="lg" className="px-4">
              Aplikacija
            </Button>
          </div>
        </Container>
      </div>
    </header>
  );
}
