import React from 'react';
import { Page } from '@/components/Page';
import { Button, EmptyState, Heading, BodyText } from '@/components/ui';
import { RoomGrid } from '@/components/RoomCard';
import { findRoom as findLocalRoom } from '@/data/catalog';
import { useAppStore } from '@/store/AppStore';
import { useApiRooms } from '@/hooks/useApiRooms';
import { router } from 'expo-router';

export default function SavedScreen() {
  const { saved } = useAppStore();
  const { rooms: apiRooms } = useApiRooms();
  const rooms = saved
    .map((id) => apiRooms.find((r) => r._id === id) ?? findLocalRoom(id))
    .filter((room): room is NonNullable<typeof room> => room !== undefined);

  return (
    <Page>
      <Heading level={1}>Saved rooms</Heading>
      <BodyText muted>Rooms you've hearted are kept here so you can compare them later.</BodyText>
      {rooms.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          message="Tap the heart on any room to save it."
          actionLabel="Browse hotels"
          onAction={() => router.push('/hotels')}
        />
      ) : (
        <>
          <RoomGrid rooms={rooms} />
          <Button label="Browse more hotels" variant="secondary" onPress={() => router.push('/hotels')} />
        </>
      )}
    </Page>
  );
}
