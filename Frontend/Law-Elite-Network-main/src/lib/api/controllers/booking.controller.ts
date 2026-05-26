
import { BookingService } from '../services/booking.service';
import { ApiResponse, UserRole } from '../types';

export class BookingController {
  constructor(private bookingService: BookingService) {}

  async requestConsultation(req: { clientUid: string; role: UserRole; bookingData: any }): Promise<ApiResponse> {
    try {
      const data = await this.bookingService.requestConsultation(req.clientUid, req.role, req.bookingData);
      return { success: true, message: 'Consultation request broadcasted successfully.', data };
    } catch (error: any) {
      return { success: false, message: error.message || 'Request failed', error: error.message };
    }
  }

  async getMyBookings(uid: string, role: UserRole): Promise<ApiResponse> {
    try {
      let data;
      if (role === 'client') {
        data = await this.bookingService.getClientBookings(uid);
      } else if (role === 'lawyer') {
        data = await this.bookingService.getLawyerBookings(uid);
      }
      return { success: true, message: 'Consultation dossiers fetched', data };
    } catch (error: any) {
      return { success: false, message: 'Fetch failed', error: error.message };
    }
  }

  async updateStatus(req: { bookingId: string; uid: string; role: UserRole; status: string }): Promise<ApiResponse> {
    try {
      await this.bookingService.updateStatus(req.bookingId, req.uid, req.role, req.status);
      return { success: true, message: `Consultation status updated to: ${req.status}` };
    } catch (error: any) {
      return { success: false, message: 'Update failed', error: error.message };
    }
  }
}
