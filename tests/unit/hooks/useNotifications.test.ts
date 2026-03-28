import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const notificationsApiMock = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  deleteAllRead: vi.fn(),
}));

vi.mock('../../../src/api/notifications.api', () => ({
  notificationsApi: notificationsApiMock,
}));

import { useNotifications } from '../../../src/hooks/useNotifications';

describe('hooks/useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads notifications and unread count on mount', async () => {
    notificationsApiMock.getNotifications.mockResolvedValue([
      { id: 'n1', isRead: false, title: 'A' },
      { id: 'n2', isRead: true, title: 'B' },
    ]);
    notificationsApiMock.getUnreadCount.mockResolvedValue(1);

    const { result } = renderHook(() => useNotifications(0));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('sets error when initial load fails', async () => {
    notificationsApiMock.getNotifications.mockRejectedValue(new Error('boom'));
    notificationsApiMock.getUnreadCount.mockResolvedValue(0);

    const { result } = renderHook(() => useNotifications(0));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Error al cargar notificaciones');
  });

  it('markAsRead updates item and unread count', async () => {
    notificationsApiMock.getNotifications.mockResolvedValue([
      { id: 'n1', isRead: false, title: 'A' },
      { id: 'n2', isRead: false, title: 'B' },
    ]);
    notificationsApiMock.getUnreadCount.mockResolvedValue(2);
    notificationsApiMock.markAsRead.mockResolvedValue({});

    const { result } = renderHook(() => useNotifications(0));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(result.current.notifications.find((n) => n.id === 'n1')?.isRead).toBe(true);
    expect(result.current.unreadCount).toBe(1);
  });

  it('markAllAsRead and deleteNotification update state', async () => {
    notificationsApiMock.getNotifications.mockResolvedValue([
      { id: 'n1', isRead: false, title: 'A' },
      { id: 'n2', isRead: true, title: 'B' },
    ]);
    notificationsApiMock.getUnreadCount
      .mockResolvedValueOnce(1) // initial load
      .mockResolvedValueOnce(0); // after delete reload
    notificationsApiMock.markAllAsRead.mockResolvedValue({});
    notificationsApiMock.deleteNotification.mockResolvedValue({});

    const { result } = renderHook(() => useNotifications(0));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markAllAsRead();
    });
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.isRead)).toBe(true);

    await act(async () => {
      await result.current.deleteNotification('n1');
    });
    expect(result.current.notifications.map((n) => n.id)).toEqual(['n2']);
  });
});
