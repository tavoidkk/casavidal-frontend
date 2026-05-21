import { api } from '../lib/axios';
import type { ApiResponse, Suggestion, Activity } from '../types';

export const suggestionsApi = {
  getSuggestions: async () => {
    const { data } = await api.get<ApiResponse<Suggestion[]>>('/activities/suggestions');
    return data.data;
  },

  getSuggestionCount: async () => {
    const { data } = await api.get<ApiResponse<{ count: number }>>('/activities/suggestions/count');
    return data.data.count;
  },

  applySuggestion: async (id: string) => {
    const { data } = await api.post<ApiResponse<Activity>>(`/activities/suggestions/${id}/apply`);
    return data.data;
  },

  dismissSuggestion: async (id: string) => {
    const { data } = await api.post<ApiResponse<null>>(`/activities/suggestions/${id}/dismiss`);
    return data.data;
  },
};
