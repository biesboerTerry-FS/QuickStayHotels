import React from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { Page } from '@/components/Page';
import { BodyText, Button, Card, EmptyState, Heading, Row, useColumns } from '@/components/ui';
import { findRoom as findLocalRoom } from '@/data/catalog';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/theme';
import { useApiRooms } from '@/hooks/useApiRooms';
import { bookingStatus, canCancel } from '@/lib/bookings';
import { formatCurrency, formatDay } from '@/lib/format';

export default function BookingsScreen() {
  const { colors } = useTheme();
  const { columns } = useColumns();
  const { rooms } = useApiRooms();
  const { guest, bookings, updateBooking, signIn } = useAppStore();

  if (!guest) {
    return (
      <Page>
        <Heading level={1}>My bookings</Heading>
        <EmptyState
          title="Sign in to see your bookings"
          message="Your reservations and payments are linked to your account."
          actionLabel="Sign in as demo guest"
          onAction={signIn}
        />
      </Page>
    );
  }

  const mine = bookings.filter((booking) => booking.userId === guest.id);

  const confirmCancel = (id: string) =>
    Alert.alert('Cancel this booking?', "You can't undo this.", [
      { text: 'Keep booking', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => updateBooking(id, { status: 'cancelled' }) },
    ]);

  return (
    <Page>
      <Heading level={1}>My bookings</Heading>
      <BodyText muted>Pay, review or cancel your upcoming stays.</BodyText>

      {mine.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          message="When you book a stay it will appear here."
          actionLabel="Browse hotels"
          onAction={() => router.push('/hotels')}
        />
      ) : null}

      {mine.map((booking) => {
        const room = rooms.find((r) => r._id === booking.roomId) ?? findLocalRoom(booking.roomId);
        const status = bookingStatus(booking);
        const statusColor = status === 'Paid' ? colors.success : status === 'Cancelled' ? colors.muted : colors.warning;
        return (
          <Card key={booking._id} style={{ gap: 10 }}>
            <View style={{ gap: 2 }}>
              <Heading level={2}>{room?.hotel.name ?? 'QuickStay hotel'}</Heading>
              <BodyText muted>{room?.roomType ?? 'Room'}</BodyText>
            </View>
            <Row label="Check-in" value={formatDay(booking.checkInDate)} />
            <Row label="Check-out" value={formatDay(booking.checkOutDate)} />
            <Row label="Guests" value={String(booking.guests)} />
            <Row label="Total" value={formatCurrency(booking.totalPrice)} />
            <Row label="Status" value={`${status} · ${booking.paymentMethod}`} />
            <BodyText style={{ color: statusColor, fontWeight: '600' }} selectable={false}>
              {status === 'Cancelled' ? 'This booking was cancelled.' : status === 'Paid' ? 'Payment received.' : 'Payment is still due.'}
            </BodyText>
            <View style={{ flexDirection: columns > 1 ? 'row' : 'column', gap: 10, flexWrap: 'wrap' }}>
              {booking.status !== 'cancelled' && !booking.isPaid ? (
                <Button label="Pay now" onPress={() => router.push(`/pay/${booking._id}`)} />
              ) : null}
              <Button label="View details" variant="secondary" onPress={() => router.push(`/booking/${booking._id}`)} />
              {canCancel(booking) ? (
                <Button label="Cancel booking" variant="danger" onPress={() => confirmCancel(booking._id)} />
              ) : null}
            </View>
          </Card>
        );
      })}
    </Page>
  );
}
