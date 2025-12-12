import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export interface FunPayLot {
  id: number;
  externalId: string;
  server: string;
  rank: string;
  agentsCount: number;
  skinsCount: number;
  titleRu: string;
  priceRub: number;
  url: string;
  isActive: boolean;
  lastSeenAt: string;
  firstSeenAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ParseResult {
  success: boolean;
  parsed: number;
  new: number;
  updated: number;
  deactivated: number;
}

export interface Stats {
  totalLots: number;
  activeLots: number;
  lastUpdate: string | null;
}

export const funpayApi = {
  getLots: (page = 1, limit = 20, isActive?: boolean) =>
    api.get<PaginatedResponse<FunPayLot>>('/funpay/lots', {
      params: { page, limit, isActive },
    }),

  getLot: (id: number) =>
    api.get<FunPayLot>(`/funpay/lots/${id}`),

  parse: () =>
    api.post<ParseResult>('/funpay/parse'),

  getStats: () =>
    api.get<Stats>('/funpay/stats'),
};
