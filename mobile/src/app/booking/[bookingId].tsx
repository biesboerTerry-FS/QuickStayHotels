import React from 'react';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Page } from '@/components/Page';
import { BodyText, Button, Card, EmptyState, Heading, Row } from '@/components/ui';
import { findRoom as findLocalRoom } from '@/data/catalog';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/theme';
import { useApiRooms } from '@/hooks/useApiRooms';
import { bookingStatus, canCancel } from '@/lib/bookings';
import { formatCurrency, formatDay } from '@/lib/format';

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { colors } = useTheme();
  const { rooms } = useApiRooms();
  const { bookings, updateBooking } = useAppStore();
  const booking = bookings.find((item) => item._id === bookingId);

  if (!booking) {
    return (
      <Page>
        <EmptyState title="Booking not found" message="It may have been removed from this device." actionLabel="Go to my bookings" onAction={() => router.navigate('/bookings')} />
      </Page>
    );
  }

  const room = rooms.find((r) => r._id === booking.roomId) ?? findLocalRoom(booking.roomId);
  const status = bookingStatus(booking);
  const cancelled = booking.status === 'cancelled';

  return (
    <Page>
      <Card style={{ gap: 12, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' }}>
          <BodyText style={{ fontSize: 26, color: cancelled ? colors.muted : colors.success }}>{cancelled ? '✕' : '✓'}</BodyText>
        </View>
        <Heading level={1}>{cancelled ? 'Booking cancelled' : 'Booking confirmed'}</Heading>
        <BodyText muted selectable style={{ textAlign: 'center' }}>
          Reference {booking._id}
        </BodyText>
      </Card>

      <Card style={{ gap: 10 }}>
        <Heading level={2}>{room?.hotel.name ?? 'QuickStay hotel'}</Heading>
        <BodyText muted>
          {room ? `${room.roomType} · ${room.hotel.address}` : 'Room details unavailable'}
        </BodyText>
        <Row label="Check-in" value={formatDay(booking.checkInDate)} />
        <Row label="Check-out" value={formatDay(booking.checkOutDate)} />
        <Row label="Guests" value={String(booking.guests)} />
        <Row label="Total" value={formatCurrency(booking.totalPrice)} />
        <Row label="Payment" value={`${status} · ${booking.paymentMethod}`} />
      </Card>

      {!cancelled && !booking.isPaid ? (
        <Button label="Pay now" onPress={() => router.push(`/pay/${booking._id}`)} />
      ) : null}
      {room ? (
        <Button
          label="Open hotel in maps"
          variant="secondary"
          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${room.hotel.lat},${room.hotel.lng}`)}
        />
      ) : null}
      {canCancel(booking) ? (
        <Button
          label="Cancel booking"
          variant="danger"
          onPress={() => {
            updateBooking(booking._id, { status: 'cancelled' });
          }}
        />
      ) : null}
      <Button label="Back to my bookings" variant="ghost" onPress={() => router.navigate('/bookings')} />
    </Page>
  );
}
