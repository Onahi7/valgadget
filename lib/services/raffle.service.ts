import { api } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RaffleStatus = 'upcoming' | 'active' | 'drawing' | 'completed' | 'cancelled'

export interface Raffle {
  id: string
  title: string
  description: string
  image: string
  prize: string
  prizeValue: number
  ticketPrice: number
  maxTickets: number
  soldTickets: number
  status: RaffleStatus
  drawDate: string
  winner?: {
    userId: string
    name: string
    ticketNumber: number
  }
  isEntered?: boolean          // populated for auth'd users
  myTicketCount?: number
  createdAt: string
  updatedAt: string
}

export interface RaffleEntry {
  id: string
  raffleId: string
  raffle?: Pick<Raffle, 'id' | 'title' | 'image' | 'status' | 'drawDate'>
  userId: string
  ticketCount: number
  ticketNumbers: number[]
  totalPaid: number
  createdAt: string
}

export interface RafflesResponse {
  data: Raffle[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateRafflePayload {
  title: string
  description: string
  image?: string
  prize: string
  prizeValue: number
  ticketPrice: number
  maxTickets: number
  drawDate: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const raffleService = {
  // ── Public / Customer ─────────────────────────────────────────────────────

  /** Paginated raffle list with optional status filter */
  getAll: (params?: { status?: RaffleStatus; page?: number; limit?: number }) =>
    api.get<RafflesResponse>('/raffles', params),

  /** Single raffle by ID */
  getById: (id: string) =>
    api.get<Raffle>(`/raffles/${id}`),

  /** Purchase tickets for a raffle */
  enter: (id: string, ticketCount: number) =>
    api.post<RaffleEntry>(`/raffles/${id}/enter`, { ticketCount }),

  /** Current user's raffle entries */
  getMyEntries: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: RaffleEntry[]; total: number; page: number; totalPages: number }>(
      '/raffles/my-entries',
      params
    ),

  /** Leaderboard / ticket holders for a raffle */
  getEntries: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<{ data: RaffleEntry[]; total: number }>(`/raffles/${id}/entries`, params),

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** [Admin] Create a raffle */
  create: (payload: CreateRafflePayload) =>
    api.post<Raffle>('/admin/raffles', payload),

  /** [Admin] Update raffle details */
  update: (id: string, payload: Partial<CreateRafflePayload>) =>
    api.put<Raffle>(`/admin/raffles/${id}`, payload),

  /** [Admin] Trigger the draw and pick a winner */
  draw: (id: string) =>
    api.post<{ winner: { userId: string; name: string; ticketNumber: number } }>(
      `/admin/raffles/${id}/draw`
    ),

  /** [Admin] Cancel a raffle */
  cancel: (id: string, reason?: string) =>
    api.patch<Raffle>(`/admin/raffles/${id}/cancel`, { reason }),

  /** [Admin] Stats overview */
  getStats: () =>
    api.get<{
      totalRaffles: number
      activeRaffles: number
      totalRevenue: number
      totalEntries: number
    }>('/admin/raffles/stats'),
}
