import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { sampleConnections } from '@/utils/sampleData';
import { migrateConnection } from '@/utils/migrateData';
import type { Connection } from '@/utils/sampleData';

export function useConnections(): [Connection[], (value: Connection[] | ((prev: Connection[]) => Connection[])) => void] {
  const [connections, setConnections] = useLocalStorage<Connection[]>('connections', sampleConnections);
  const migratedRef = useRef(false);

  useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    const needsMigration = connections.some(c => c.gender == null || c.relationship == null || typeof c.liked !== 'boolean');
    if (needsMigration) {
      setConnections(prev => prev.map(migrateConnection));
    }
  }, [connections, setConnections]);

  return [connections, setConnections];
}
