import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Page } from '@/components/Page';
import { BodyText, Button, Card, EmptyState, Heading, Row } from '@/components/ui';
import { findRoom as findLocalRoom } from '@/data/catalog';
import type { StoredBooking } from '@/data/types';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/theme';
import { createBooking, isRoomFree, nightsBetween } from '@/lib/bookings';
import { formatCurrency, formatDay } from '@/lib/format';
import { validateStay } from '@/lib/validation';
import { useApiRooms } from '@/hooks/useApiRooms';

const paymentOptions: { value: StoredBooking['paymentMethod']; label: string; note: string }[] = [
  { value: 'Pay At Hotel', label: 'Pay at the hotel', note: 'No payment now. Pay when you check in.' },
  { value: 'Card', label: 'Pay now by card', note: 'Test mode: you enter card details on the next step. No real charge.' },
];

export default function BookRoomScreen() {
  const params = useLocalSearchParams<{ id: string; checkIn: string; checkOut: string; guests: string }>();
  const { rooms, loading } = useApiRooms();
  const room = rooms.find((r) => r._id === params.id) ?? findLocalRoom(params.id);
  const { colors } = useTheme();
  const { guest, bookings, addBooking, signIn } = useAppStore();
  const [payment, setPayment] = useState<StoredBooking['paymentMethod']>('Pay At Hotel');
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <Page>
        <BodyText muted>Loading room…</BodyText>
      </Page>
    );
  }

  if (!room) {
    return (
      <Page>
        <EmptyState title="Room not found" message="We couldn't find that room." actionLabel="Browse hotels" onAction={() => router.push('/hotels')} />
      </Page>
    );
  }

  const checkIn = params.checkIn ?? '';
  const checkOut = params.checkOut ?? '';
  const guests = params.guests ?? '1';
  const stayError = validateStay({ checkIn, checkOut, guests }, { requireDates: true, maxGuests: room.maxGuests });

  if (stayError) {
    return (
      <Page>
        <EmptyState title="Check your dates" message={stayError} actionLabel="Choose dates again" onAction={() => router.back()} />
      </Page>
    );
  }

  if (!guest) {
    return (
      <Page>
        <EmptyState
          title="Sign in to book"
          message="We'll keep your selected dates while you sign in."
          actionLabel="Sign in as demo guest"
          onAction={signIn}
        />
      </Page>
    );
  }

  const nights = nightsBetween(checkIn, checkOut);
  const total = nights * room.pricePerNight;

  const confirm = () => {
    if (!isRoomFree(room._id, checkIn, checkOut, bookings)) {
      setError('Sorry, this room was just booked for those dates. Please choose other dates.');
      return;
    }
    const booking = createBooking({
      room,
      checkIn,
      checkOut,
      guests: Number(guests),
      paymentMethod: payment,
      guest,
    });
    addBooking(booking);
    router.replace(payment === 'Card' ? `/pay/${booking._id}` : `/booking/${booking._id}`);
  };

  return (
    <Page>
      <Heading level={1}>Confirm your stay</Heading>
      <Card style={{ gap: 10 }}>
        <Heading level={2}>{room.hotel.name}</Heading>
        <BodyText muted>
          {room.roomType} · {room.hotel.address}
        </BodyText>
        <Row label="Check-in" value={formatDay(checkIn)} />
        <Row label="Check-out" value={formatDay(checkOut)} />
        <Row label="Guests" value={guests} />
        <Row label={`${formatCurrency(room.pricePerNight)} × ${nights} night${nights === 1 ? '' : 's'}`} value={formatCurrency(total)} />
        <View style={{ borderTopWidth: 1, borderColor: colors.border, paddingTop: 10 }}>
          <Row label="Total" value={formatCurrency(total)} />
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Heading level={2}>Payment</Heading>
        <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
          {paymentOptions.map((option) => {
            const selected = payment === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityLabel={`${option.label}. ${option.note}`}
                accessibilityState={{ checked: selected }}
                onPress={() => setPayment(option.value)}
                style={{
                  minHeight: 44,
                  borderWidth: 2,
                  borderRadius: 12,
                  padding: 14,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.chip : colors.surface,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>{option.label}</Text>
                <BodyText muted style={{ fontSize: 13 }}>
                  {option.note}
                </BodyText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {error ? <Text accessibilityLiveRegion="polite" style={{ color: colors.danger }}>{error}</Text> : null}
      <Button label={`Confirm booking · ${formatCurrency(total)}`} onPress={confirm} />
    </Page>
  );
}
