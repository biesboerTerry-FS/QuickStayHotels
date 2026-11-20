import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Page } from '@/components/Page';
import { DateField } from '@/components/DateField';
import { BodyText, Button, Card, Chip, EmptyState, Field, Heading } from '@/components/ui';
import { RoomGrid } from '@/components/RoomCard';
import { useAppStore } from '@/store/AppStore';
import { useApiRooms } from '@/hooks/useApiRooms';
import { filterRooms, type SortOption } from '@/lib/roomFilters';
import { isValidRange, nightsBetween } from '@/lib/bookings';
import { addDaysIso, formatDay } from '@/lib/format';
import { validateStay } from '@/lib/validation';

const roomTypes = ['Single Bed', 'Double Bed', 'Family Suite', 'Luxury Room'];
const priceRanges = [
  { label: '$0 – $500', value: '0-500' },
  { label: '$501 – $1,000', value: '501-1000' },
  { label: '$1,001 – $2,000', value: '1001-2000' },
  { label: '$2,001 – $3,000', value: '2001-3000' },
];
const sortOptions: { label: string; value: SortOption }[] = [
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Newest', value: 'newest' },
];

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';

export default function HotelsScreen() {
  const params = useLocalSearchParams<{ destination?: string; checkIn?: string; checkOut?: string; guests?: string }>();
  const { bookings } = useAppStore();
  const { rooms, loading, error: roomsError } = useApiRooms();

  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [prices, setPrices] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>('');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search results from the home screen arrive as route params.
  useEffect(() => {
    setDestination(first(params.destination));
    setCheckIn(first(params.checkIn));
    setCheckOut(first(params.checkOut));
    setGuests(first(params.guests));
  }, [params.destination, params.checkIn, params.checkOut, params.guests]);

  const toggle = (list: string[], value: string, set: (next: string[]) => void) =>
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  const dates = isValidRange(checkIn, checkOut) ? { checkIn, checkOut } : null;

  const results = useMemo(
    () =>
      filterRooms(rooms, {
        destination,
        types,
        prices,
        guests: Number(guests) || 0,
        dates,
        bookings,
        sort,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [destination, types, prices, guests, dates?.checkIn, dates?.checkOut, bookings, sort],
  );

  const clear = () => {
    setDestination('');
    setCheckIn('');
    setCheckOut('');
    setGuests('');
    setTypes([]);
    setPrices([]);
    setSort('');
    setError(null);
  };

  const applyDates = () => {
    const message = checkIn || checkOut
      ? validateStay({ checkIn, checkOut, guests }, { requireDates: true })
      : validateStay({ checkIn, checkOut, guests }, { requireDates: false });
    setError(message);
  };

  const activeCount = types.length + prices.length + (sort ? 1 : 0) + (guests ? 1 : 0) + (checkIn ? 1 : 0);

  return (
    <Page refreshKey={`${params.destination}-${params.checkIn}-${params.checkOut}-${params.guests}`}>
      <View style={{ gap: 4 }}>
        <Heading level={1}>Hotels</Heading>
        <BodyText muted>Compare rooms, filter by what matters, and book when you're ready.</BodyText>
      </View>

      <Card style={{ gap: 12 }}>
        <View style={styles.row}>
          <Button
            label={showFilters ? 'Hide filters' : `Show filters${activeCount ? ` (${activeCount})` : ''}`}
            variant="secondary"
            onPress={() => setShowFilters((value) => !value)}
            hint="Expands or collapses the filter options"
            style={{ flex: 1 }}
          />
          {activeCount > 0 ? <Button label="Clear" variant="ghost" onPress={clear} /> : null}
        </View>

        {showFilters ? (
          <View style={{ gap: 14 }}>
            <Field label="Destination" value={destination} onChangeText={setDestination} placeholder="Any city" />
            <View style={styles.row}>
              <View style={styles.flex}>
                <DateField label="Check in" value={checkIn} onChange={setCheckIn} />
              </View>
              <View style={styles.flex}>
                <DateField
                  label="Check out"
                  value={checkOut}
                  onChange={setCheckOut}
                  minDate={checkIn ? addDaysIso(checkIn, 1) : undefined}
                />
              </View>
            </View>
            <Field label="Guests" value={guests} onChangeText={setGuests} placeholder="Any" keyboardType="number-pad" maxLength={1} />
            <Button label="Apply dates and guests" variant="secondary" onPress={applyDates} />
            {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}

            <View style={{ gap: 8 }}>
              <Heading level={3}>Room type</Heading>
              <View style={styles.chips}>
                {roomTypes.map((type) => (
                  <Chip key={type} label={type} selected={types.includes(type)} onPress={() => toggle(types, type, setTypes)} />
                ))}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Heading level={3}>Price per night</Heading>
              <View style={styles.chips}>
                {priceRanges.map((range) => (
                  <Chip key={range.value} label={range.label} selected={prices.includes(range.value)} onPress={() => toggle(prices, range.value, setPrices)} />
                ))}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Heading level={3}>Sort by</Heading>
              <View style={styles.chips}>
                {sortOptions.map((option) => (
                  <Chip key={option.value} label={option.label} selected={sort === option.value} onPress={() => setSort(option.value)} />
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </Card>

      <View accessibilityLiveRegion="polite" style={{ gap: 2 }}>
        <BodyText>
          <Text style={{ fontWeight: '700' }}>{results.length}</Text> room{results.length === 1 ? '' : 's'} found
          {destination ? ` in ${destination}` : ''}
        </BodyText>
        {dates ? (
          <BodyText muted>
            {formatDay(dates.checkIn)} – {formatDay(dates.checkOut)} · {nightsBetween(dates.checkIn, dates.checkOut)} night
            {nightsBetween(dates.checkIn, dates.checkOut) === 1 ? '' : 's'}
          </BodyText>
        ) : null}
      </View>

      {roomsError ? (
        <BodyText style={{ color: '#b91c1c' }}>{roomsError}</BodyText>
      ) : loading ? (
        <BodyText muted>Loading rooms…</BodyText>
      ) : results.length === 0 ? (
        <EmptyState
          title="No rooms match"
          message="Try another destination or dates, or clear the filters."
          actionLabel="Clear filters"
          onAction={clear}
        />
      ) : (
        <RoomGrid rooms={results} />
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { color: '#b91c1c' },
});
