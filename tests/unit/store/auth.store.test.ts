import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../../../src/store/auth.store';

describe('store/auth.store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('setAuth stores user and token in state/localStorage', () => {
    const user = {
      id: 'u1',
      email: 'test@cv.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN' as const,
    };

    useAuthStore.getState().setAuth(user, 'token-123');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.token).toBe('token-123');
    expect(localStorage.getItem('token')).toBe('token-123');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(user));
  });

  it('logout clears state and localStorage', () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('user', JSON.stringify({ id: 'x' }));
    useAuthStore.setState({ user: { id: 'x' } as any, token: 'abc', isAuthenticated: true });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state).toMatchObject({ user: null, token: null, isAuthenticated: false });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('initAuth hydrates state when localStorage has credentials', () => {
    const user = {
      id: 'u2',
      email: 'u2@cv.com',
      firstName: 'A',
      lastName: 'B',
      role: 'VENDEDOR' as const,
    };
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'tk');

    useAuthStore.getState().initAuth();

    expect(useAuthStore.getState()).toMatchObject({
      user,
      token: 'tk',
      isAuthenticated: true,
    });
  });

  it('initAuth keeps default state when localStorage is empty', () => {
    useAuthStore.getState().initAuth();
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });
});
