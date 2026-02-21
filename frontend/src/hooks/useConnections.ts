import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { migrateConnection } from '@/utils/migrateData';
import type { Connection } from '@/utils/sampleData';
import { useUser } from '@/contexts/UserContext';

export function useConnections(): [Connection[], (value: Connection[] | ((prev: Connection[]) => Connection[])) => void] {
  const { currentUser } = useUser();
  const [connections, setConnectionsState] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!currentUser) {
      setConnectionsState([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.connections.getAll(currentUser.id);
      const migrated = data.map((c: Connection) => migrateConnection(c));
      setConnectionsState(migrated);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
      setConnectionsState([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const setConnections = useCallback(
    async (value: Connection[] | ((prev: Connection[]) => Connection[])) => {
      if (!currentUser) return;
      const prev = connections;
      const newConnections = typeof value === 'function' ? value(prev) : value;

      const prevIds = new Set(prev.map((c) => c.id));
      const newIds = new Set(newConnections.map((c) => c.id));
      const added = newConnections.filter((c) => !prevIds.has(c.id));
      const removed = prev.filter((c) => !newIds.has(c.id));
      const updated = newConnections.filter((c) => prevIds.has(c.id) && JSON.stringify(prev.find((x) => x.id === c.id)) !== JSON.stringify(c));

      setConnectionsState(newConnections);

      try {
        for (const c of added) await api.connections.create(currentUser.id, c);
        for (const c of removed) await api.connections.delete(currentUser.id, c.id);
        for (const c of updated) await api.connections.update(currentUser.id, c.id, c);
        if (added.length || removed.length || updated.length) fetchConnections();
      } catch (err) {
        console.error('Failed to sync connections:', err);
        fetchConnections();
      }
    },
    [connections, fetchConnections, currentUser?.id]
  );

  return [loading ? [] : connections, setConnections];
}
