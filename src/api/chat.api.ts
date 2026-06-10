import { api } from '../lib/axios';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface SendMessageResponse {
  conversationId: string;
  message: ChatMessage;
}

export const chatApi = {
  sendMessage: async (message: string, conversationId?: string) => {
    const { data } = await api.post<SendMessageResponse>('/chat/message', {
      message,
      conversationId,
    });
    return data;
  },

  getHistory: async (conversationId: string) => {
    const { data } = await api.get<{ messages: ChatMessage[] }>(`/chat/${conversationId}/history`);
    return data.messages;
  },

  getConversations: async () => {
    const { data } = await api.get<{ conversations: any[] }>('/chat/conversations');
    return data.conversations;
  },

  deleteConversation: async (conversationId: string) => {
    const { data } = await api.delete(`/chat/${conversationId}`);
    return data;
  },
};
