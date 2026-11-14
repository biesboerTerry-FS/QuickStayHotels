import type { Booking, Review, Room } from '@/data/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const api = {
  getRooms: (): Promise<{ rooms: Room[] }> => request('/api/rooms'),
  getRoom: (id: string): Promise<{ room: Room }> => request(`/api/rooms/${id}`),
  getBookings: (userId?: string): Promise<{ bookings: Booking[] }> =>
    request(`/api/bookings${userId ? `?userId=${userId}` : ''}`),
  createBooking: (booking: Omit<Booking, '_id'>): Promise<{ booking: Booking }> =>
    request('/api/bookings', { method: 'POST', body: JSON.stringify(booking) }),
  updateBooking: (id: string, patch: Partial<Booking>): Promise<{ booking: Booking }> =>
    request(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  getReviews: (roomId: string): Promise<{ reviews: Review[] }> =>
    request(`/api/reviews?roomId=${roomId}`),
  createReview: (review: Omit<Review, 'id'>): Promise<{ review: Review }> =>
    request('/api/reviews', { method: 'POST', body: JSON.stringify(review) }),
};
