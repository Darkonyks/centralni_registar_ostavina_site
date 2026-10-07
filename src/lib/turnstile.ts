/** Minimalan deo Cloudflare Turnstile API-ja koji sajt koristi (eksplicitno renderovanje). */
export interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'flexible' | 'compact';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  /** Vraća `true` kada je greška obrađena (Turnstile je tada ne prijavljuje dalje). */
  'error-callback'?: (errorCode: string) => boolean | void;
}

export interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileRenderOptions): string | undefined;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loading: Promise<TurnstileApi> | null = null;

/**
 * Učitava Turnstile skriptu samo jednom i tek kada je potrebna (forma blizu ekrana),
 * da ne usporava učitavanje stranice.
 */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('Turnstile nije dostupan posle učitavanja skripte.'));
    };
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('Turnstile skripta nije učitana.'));
    };
    document.head.appendChild(script);
  });

  return loading;
}
