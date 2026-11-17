import React, { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Page } from '@/components/Page';
import { BodyText, Button, Card, Chip, Field, Heading, useColumns } from '@/components/ui';
import { RoomGrid } from '@/components/RoomCard';
import { cities } from '@/data/catalog';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/theme';
import { useApiRooms } from '@/hooks/useApiRooms';
import { validateStay } from '@/lib/validation';
import heroImage from '../../../assets/images/heroImage.png';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { columns } = useColumns();
  const { searches, addSearch } = useAppStore();
  const { rooms, loading, error: roomsError } = useApiRooms();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [error, setError] = useState<string | null>(null);

  const search = (values: { destination: string; checkIn: string; checkOut: string; guests: string }) => {
    const params = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
    addSearch({ ...values, savedAt: new Date().toISOString() });
    router.push({ pathname: '/hotels', params });
  };

  const submit = () => {
    if (!destination.trim()) {
      setError('Choose a destination.');
      return;
    }
    const dateProvided = Boolean(checkIn || checkOut);
    const message = validateStay({ checkIn, checkOut, guests }, { requireDates: false });
    if (message) {
      setError(message);
      return;
    }
    if (dateProvided && (!checkIn || !checkOut)) {
      setError('Enter both check-in and check-out, or leave both empty.');
      return;
    }
    setError(null);
    search({ destination: destination.trim(), checkIn, checkOut, guests });
  };

  const featured = rooms.slice(0, columns === 1 ? 2 : 4);

  return (
    <Page>
      <ImageBackground source={heroImage} style={styles.hero} imageStyle={styles.heroImage} accessibilityIgnoresInvertColors>
        <View style={styles.heroOverlay}>
          <Text style={styles.pill}>The Ultimate Hotel Experience</Text>
          <Text accessibilityRole="header" style={styles.heroTitle}>
            Discover Your Perfect Getaway Destination
          </Text>
          <Text style={styles.heroText}>
            Unparalleled luxury and comfort await at the world's most exclusive hotels and resorts.
          </Text>
        </View>
      </ImageBackground>

      <Card style={{ gap: 4 }}>
        <Heading level={2}>Find a stay</Heading>
        <Field
          label="Destination"
          placeholder="City, e.g. London"
          value={destination}
          onChangeText={setDestination}
          autoCapitalize="words"
          returnKeyType="next"
          accessibilityHint="Type a city or pick one below"
        />
        <View style={styles.chipRow}>
          {cities.map((city) => (
            <Chip key={city} label={city} selected={destination === city} onPress={() => setDestination(city)} />
          ))}
        </View>
        <View style={[styles.dateRow, columns > 1 && styles.dateRowWide]}>
          <View style={styles.flex}>
            <Field
              label="Check in"
              placeholder="YYYY-MM-DD"
              value={checkIn}
              onChangeText={setCheckIn}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>
          <View style={styles.flex}>
            <Field
              label="Check out"
              placeholder="YYYY-MM-DD"
              value={checkOut}
              onChangeText={setCheckOut}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>
          <View style={styles.guestField}>
            <Field
              label="Guests"
              placeholder="2"
              value={guests}
              onChangeText={setGuests}
              keyboardType="number-pad"
              maxLength={1}
            />
          </View>
        </View>
        {error || roomsError ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.danger }}>
            {error || roomsError}
          </Text>
        ) : null}
        <Button label="Search hotels" onPress={submit} />
      </Card>

      {searches.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Heading level={3}>Recent searches</Heading>
          <View style={styles.chipRow}>
            {searches.map((item) => (
              <Pressable
                key={`${item.destination}-${item.checkIn}-${item.checkOut}-${item.savedAt}`}
                accessibilityRole="button"
                accessibilityLabel={`Search again: ${item.destination}${item.checkIn ? `, ${item.checkIn} to ${item.checkOut}` : ''}`}
                onPress={() => search(item)}
                style={[styles.recent, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <Text style={{ color: colors.text, fontWeight: '500' }}>
                  {item.destination}
                  {item.checkIn ? ` · ${item.checkIn}` : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: 6 }}>
        <Heading level={2}>Featured destinations</Heading>
        <BodyText muted>Hand-picked stays across our partner cities.</BodyText>
      </View>
      {loading ? (
        <BodyText muted>Loading featured rooms…</BodyText>
      ) : (
        <>
          <RoomGrid rooms={featured} />
          <Button label="View all hotels" variant="secondary" onPress={() => router.push('/hotels')} />
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, overflow: 'hidden', minHeight: 300 },
  heroImage: { borderRadius: 20 },
  heroOverlay: { flex: 1, padding: 24, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.6)', gap: 10 },
  pill: {
    alignSelf: 'flex-start',
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 13,
  },
  heroTitle: { color: '#ffffff', fontSize: 30, fontWeight: '800', lineHeight: 36 },
  heroText: { color: '#e2e8f0', fontSize: 15, lineHeight: 22 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateRow: { gap: 0 },
  dateRowWide: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  guestField: { width: 110 },
  recent: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, minHeight: 44, justifyContent: 'center' },
});
