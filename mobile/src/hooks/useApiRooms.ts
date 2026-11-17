import { useEffect, useState } from 'react';
import { rooms as localRooms } from '@/data/catalog';
import { api } from '@/lib/api';
import type { Room } from '@/data/types';

export const useApiRooms = () => {
  const [rooms, setRooms] = useState<Room[]>(localRooms);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.getRooms();
        if (!cancelled && data.rooms.length > 0) {
          setRooms(data.rooms);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load rooms');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rooms, loading, error };
};
