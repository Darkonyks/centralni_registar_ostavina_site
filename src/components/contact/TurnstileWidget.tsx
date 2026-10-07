import { useEffect, useEffectEvent, useImperativeHandle, useRef, type Ref } from 'react';

import { TURNSTILE_ACTION } from '../../../shared/contact';
import { loadTurnstile } from '../../lib/turnstile';

export interface TurnstileHandle {
  /** Traži novi token; prethodni je posle provere na serveru potrošen. */
  reset(): void;
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  onError: () => void;
  ref?: Ref<TurnstileHandle>;
}

/** „Flexible“ widget traži bar 300 px; na užem prostoru koristi se kompaktna varijanta. */
const MIN_FLEXIBLE_WIDTH = 300;

/**
 * Cloudflare Turnstile. Skripta se učitava tek kada je forma blizu ekrana.
 * Token iz widget-a se samo prosleđuje serveru; odluku donosi serverska provera.
 */
export function TurnstileWidget({ siteKey, onToken, onError, ref }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const handleToken = useEffectEvent(onToken);
  const handleError = useEffectEvent(onError);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
      },
    }),
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    const render = () => {
      loadTurnstile()
        .then((api) => {
          if (cancelled || widgetIdRef.current) return;
          widgetIdRef.current =
            api.render(container, {
              sitekey: siteKey,
              action: TURNSTILE_ACTION,
              theme: 'light',
              size: container.clientWidth < MIN_FLEXIBLE_WIDTH ? 'compact' : 'flexible',
              callback: (token) => handleToken(token),
              'expired-callback': () => handleToken(null),
              'timeout-callback': () => handleToken(null),
              'error-callback': () => {
                handleToken(null);
                handleError();
                return true;
              },
            }) ?? null;
        })
        .catch(() => {
          if (!cancelled) handleError();
        });
    };

    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            render();
          }
        },
        { rootMargin: '600px 0px' },
      );
      observer.observe(container);
    } else {
      render();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return <div ref={containerRef} className="min-h-[65px]" />;
}
