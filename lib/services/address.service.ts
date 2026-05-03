import { api } from '@/lib/api-client'

export interface UserAddress {
  id: string
  userId: string
  label: string
  fullName: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode?: string
  country: string
  phone: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAddressPayload {
  label: string
  fullName: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode?: string
  country?: string
  phone: string
  isDefault?: boolean
}

export interface UpdateAddressPayload extends Partial<CreateAddressPayload> {}

export const addressService = {
  /** Get all user addresses */
  getAll: () =>
    api.get<{ data: UserAddress[] }>('/addresses'),

  /** Get single address */
  getById: (id: string) =>
    api.get<UserAddress>(`/addresses/${id}`),

  /** Create new address */
  create: (payload: CreateAddressPayload) =>
    api.post<UserAddress>('/addresses', payload),

  /** Update address */
  update: (id: string, payload: UpdateAddressPayload) =>
    api.patch<UserAddress>(`/addresses/${id}`, payload),

  /** Delete address */
  delete: (id: string) =>
    api.delete<{ message: string }>(`/addresses/${id}`),

  /** Set address as default */
  setDefault: (id: string) =>
    api.patch<UserAddress>(`/addresses/${id}`, { isDefault: true }),
}
