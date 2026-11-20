import React, { useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Page } from '@/components/Page';
import { averageRating, SaveButton } from '@/components/RoomCard';
import { DateField } from '@/components/DateField';
import { BodyText, Button, Card, Chip, EmptyState, Field, Heading, Row, StarRating } from '@/components/ui';
import { findRoom as findLocalRoom, seedReviewsFor } from '@/data/catalog';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/theme';
import { useApiRooms } from '@/hooks/useApiRooms';
import { isRoomFree, nightsBetween } from '@/lib/bookings';
import { addDaysIso, formatCurrency, formatDay, todayIso } from '@/lib/format';
import { validateStay } from '@/lib/validation';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, loading } = useApiRooms();
  const room = rooms.find((r) => r._id === id) ?? findLocalRoom(id);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { bookings, reviews, addReview, guest } = useAppStore();

  const [page, setPage] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [stayError, setStayError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

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
        <EmptyState title="Room not found" message="This room may have been removed." actionLabel="Browse hotels" onAction={() => router.push('/hotels')} />
      </Page>
    );
  }

  const roomReviews = [...seedReviewsFor(room._id), ...reviews.filter((review) => review.roomId === room._id)];
  const { average, count } = averageRating(room._id, reviews);
  const imageWidth = Math.min(width, 1100) - 40;
  const nights = checkIn && checkOut && nightsBetween(checkIn, checkOut) > 0 ? nightsBetween(checkIn, checkOut) : 0;

  const checkAvailability = () => {
    const message = validateStay({ checkIn, checkOut, guests }, { requireDates: true, maxGuests: room.maxGuests });
    if (message) {
      setStayError(message);
      return;
    }
    if (!isRoomFree(room._id, checkIn, checkOut, bookings)) {
      setStayError('This room is already booked for those dates. Try different dates.');
      return;
    }
    setStayError(null);
    router.push({ pathname: '/book/[id]', params: { id: room._id, checkIn, checkOut, guests } });
  };

  const submitReview = () => {
    if (!guest) {
      router.push('/profile');
      return;
    }
    if (comment.trim().length < 10) {
      setReviewError('Please write at least 10 characters.');
      return;
    }
    setReviewError(null);
    addReview({
      id: `review-${Date.now()}`,
      roomId: room._id,
      name: guest.name,
      rating,
      comment: comment.trim(),
      date: todayIso(),
    });
    setComment('');
    setRating(5);
  };

  const openMap = () =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${room.hotel.lat},${room.hotel.lng}`);

  return (
    <Page refreshKey={room._id}>
      <View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / imageWidth))}
          style={{ borderRadius: 16 }}
          accessibilityLabel={`Room photos, ${room.images.length} in total`}
        >
          {room.images.map((image, index) => (
            <Image
              key={index}
              source={image}
              accessibilityLabel={`${room.hotel.name} ${room.roomType} photo ${index + 1} of ${room.images.length}`}
              style={{ width: imageWidth, height: 240, borderRadius: 16 }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        <Text style={[styles.counter, { backgroundColor: colors.overlay }]} accessibilityElementsHidden>
          {page + 1} / {room.images.length}
        </Text>
      </View>

      <View style={styles.headerRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <Heading level={1}>{room.hotel.name}</Heading>
          <BodyText muted>
            {room.roomType} · {room.hotel.city}
          </BodyText>
          <View style={styles.ratingRow}>
            <StarRating rating={average} />
            <Text style={{ color: colors.muted }}>
              {average.toFixed(1)} · {count} reviews
            </Text>
          </View>
        </View>
        <SaveButton roomId={room._id} />
      </View>

      <BodyText muted>{room.hotel.address}</BodyText>
      <Button label="Open in maps" variant="secondary" onPress={openMap} hint="Opens the hotel location in your map app" />

      <Card style={{ gap: 10 }}>
        <Heading level={2}>Amenities</Heading>
        <View style={styles.chips}>
          {room.amenities.map((item) => (
            <View key={item} style={[styles.tag, { backgroundColor: colors.chip }]}>
              <Text style={{ color: colors.text, fontSize: 14 }}>{item}</Text>
            </View>
          ))}
        </View>
        <BodyText muted>Sleeps up to {room.maxGuests} guest{room.maxGuests === 1 ? '' : 's'}.</BodyText>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>
          {formatCurrency(room.pricePerNight)}
          <Text style={{ color: colors.muted, fontSize: 15, fontWeight: '400' }}> / night</Text>
        </Text>
      </Card>

      <Card style={{ gap: 4 }}>
        <Heading level={2}>Check availability</Heading>
        <DateField label="Check in" value={checkIn} onChange={setCheckIn} />
        <DateField
          label="Check out"
          value={checkOut}
          onChange={setCheckOut}
          minDate={checkIn ? addDaysIso(checkIn, 1) : undefined}
        />
        <Field
          label="Guests"
          value={guests}
          onChangeText={setGuests}
          keyboardType="number-pad"
          maxLength={1}
          hint={`Up to ${room.maxGuests}`}
        />
        {nights > 0 ? (
          <Row
            label={`${nights} night${nights === 1 ? '' : 's'} × ${formatCurrency(room.pricePerNight)}`}
            value={formatCurrency(nights * room.pricePerNight)}
          />
        ) : null}
        {stayError ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.danger, marginBottom: 8 }}>
            {stayError}
          </Text>
        ) : null}
        <Button label="Check availability" onPress={checkAvailability} />
        {checkIn ? <BodyText muted style={{ fontSize: 13 }}>Starts {formatDay(checkIn)}</BodyText> : null}
      </Card>

      <Card style={{ gap: 12 }}>
        <Heading level={2}>Guest reviews</Heading>
        {roomReviews.map((review) => (
          <View key={review.id} style={[styles.review, { borderColor: colors.border }]}>
            <View style={styles.headerRow}>
              <Text style={{ color: colors.text, fontWeight: '600', flex: 1 }}>{review.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>{formatDay(review.date)}</Text>
            </View>
            <StarRating rating={review.rating} />
            <BodyText>{review.comment}</BodyText>
          </View>
        ))}

        <View style={{ gap: 10, borderTopWidth: 1, borderColor: colors.border, paddingTop: 12 }}>
          <Heading level={3}>Share your stay</Heading>
          {guest ? (
            <>
              <View style={styles.chips} accessibilityRole="radiogroup">
                {[5, 4, 3, 2, 1].map((value) => (
                  <Chip key={value} label={`${value} star${value === 1 ? '' : 's'}`} selected={rating === value} onPress={() => setRating(value)} />
                ))}
              </View>
              <Field
                label="Your review"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                placeholder="What did you enjoy most?"
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
              {reviewError ? <Text style={{ color: colors.danger }}>{reviewError}</Text> : null}
              <Button label="Post review" onPress={submitReview} />
            </>
          ) : (
            <Button label="Sign in to write a review" variant="secondary" onPress={submitReview} />
          )}
        </View>
      </Card>
    </Page>
  );
}

const styles = StyleSheet.create({
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 13,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  review: { borderTopWidth: 1, paddingTop: 12, gap: 6 },
});
