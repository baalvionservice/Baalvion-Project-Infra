
import { apiClient } from '@/lib/api/client';

export interface BookingSearchParams {
  clientUid?: string;
  lawyerUid?: string;
  status?: string;
}

export class BookingRepository {
  constructor() {}

  async create(data: any) {
    try {
      const res = await apiClient.post('/bookings', data);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async getById(bookingId: string) {
    try {
      const res = await apiClient.get(`/bookings/${bookingId}`);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async update(bookingId: string, data: any) {
    try {
      await apiClient.patch(`/bookings/${bookingId}`, data);
    } catch {
      // no-op
    }
  }

  async findBookings(params: BookingSearchParams) {
    try {
      const queryParams: Record<string, any> = {};
      if (params.clientUid) queryParams.clientUid = params.clientUid;
      if (params.lawyerUid) queryParams.lawyerUid = params.lawyerUid;
      if (params.status) queryParams.status = params.status;

      const res = await apiClient.get('/bookings', { params: queryParams });
      return res.data?.data ?? [];
    } catch {
      return [];
    }
  }
}
