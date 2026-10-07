import { describe, expect, it, vi } from 'vitest';

import { TURNSTILE_VERIFY_URL, verifyTurnstileToken } from './turnstile.ts';

function mockFetch(response: Response | Error) {
  return vi.fn(async (..._args: Parameters<typeof fetch>) => {
    if (response instanceof Error) throw response;
    return response;
  });
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('verifyTurnstileToken', () => {
  it('šalje secret, token i IP adresu Cloudflare siteverify endpoint-u', async () => {
    const fetchImpl = mockFetch(json({ success: true, action: 'contact', 'error-codes': [] }));

    const result = await verifyTurnstileToken({
      token: 'token-1',
      secret: 'tajni-kljuc',
      remoteIp: '203.0.113.7',
      fetchImpl,
    });

    expect(result).toEqual({ success: true, errorCodes: [] });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(TURNSTILE_VERIFY_URL);
    expect(init?.method).toBe('POST');
    const body = new URLSearchParams(init?.body as URLSearchParams);
    expect(body.get('secret')).toBe('tajni-kljuc');
    expect(body.get('response')).toBe('token-1');
    expect(body.get('remoteip')).toBe('203.0.113.7');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('neuspešna provera vraća Cloudflare kodove grešaka', async () => {
    const fetchImpl = mockFetch(
      json({ success: false, 'error-codes': ['invalid-input-response', 'timeout-or-duplicate'] }),
    );

    const result = await verifyTurnstileToken({ token: 't', secret: 's', fetchImpl });

    expect(result).toEqual({
      success: false,
      errorCodes: ['invalid-input-response', 'timeout-or-duplicate'],
    });
  });

  it('token izdat za drugu akciju nije prihvaćen', async () => {
    const fetchImpl = mockFetch(json({ success: true, action: 'login' }));
    const result = await verifyTurnstileToken({ token: 't', secret: 's', fetchImpl });
    expect(result).toEqual({ success: false, errorCodes: ['action-mismatch'] });
  });

  it('samo `success: true` znači uspeh (ne i truthy vrednosti)', async () => {
    const fetchImpl = mockFetch(json({ success: 'true' }));
    const result = await verifyTurnstileToken({ token: 't', secret: 's', fetchImpl });
    expect(result.success).toBe(false);
  });

  it('mrežna greška ili timeout se tretiraju kao neuspeh', async () => {
    const timeout = new DOMException('The operation was aborted due to timeout', 'TimeoutError');
    for (const failure of [new TypeError('fetch failed'), timeout]) {
      const result = await verifyTurnstileToken({
        token: 't',
        secret: 's',
        fetchImpl: mockFetch(failure),
      });
      expect(result).toEqual({ success: false, errorCodes: ['network-error'] });
    }
  });

  it('HTTP greška Cloudflare servisa se tretira kao neuspeh', async () => {
    const result = await verifyTurnstileToken({
      token: 't',
      secret: 's',
      fetchImpl: mockFetch(new Response('Bad gateway', { status: 502 })),
    });
    expect(result).toEqual({ success: false, errorCodes: ['http-502'] });
  });

  it('neispravan JSON odgovor se tretira kao neuspeh', async () => {
    const result = await verifyTurnstileToken({
      token: 't',
      secret: 's',
      fetchImpl: mockFetch(new Response('<html>', { status: 200 })),
    });
    expect(result).toEqual({ success: false, errorCodes: ['network-error'] });
  });
});
