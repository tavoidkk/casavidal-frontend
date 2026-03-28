import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../src/lib/axios';

describe('lib/axios interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom reports window.location navigation as not implemented.
    // We only assert side-effects in localStorage.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('request interceptor injects Authorization header when token exists', async () => {
    localStorage.setItem('token', 'abc123');
    const handler = (api.interceptors.request as any).handlers[0].fulfilled;

    const config = await handler({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer abc123');
  });

  it('request interceptor leaves headers untouched when token does not exist', async () => {
    const handler = (api.interceptors.request as any).handlers[0].fulfilled;
    const config = await handler({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('response interceptor clears auth on 401', async () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('user', '{"id":"u1"}');
    const rejected = (api.interceptors.response as any).handlers[0].rejected;

    await expect(rejected({ response: { status: 401 } })).rejects.toBeTruthy();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('response interceptor does not clear auth for non-401 errors', async () => {
    localStorage.setItem('token', 'abc');
    const rejected = (api.interceptors.response as any).handlers[0].rejected;

    await expect(rejected({ response: { status: 500 } })).rejects.toBeTruthy();
    expect(localStorage.getItem('token')).toBe('abc');
  });
});
