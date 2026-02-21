import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { migrateGoal } from '@/utils/migrateData';
import type { Goal } from '@/utils/sampleData';
import { useUser } from '@/contexts/UserContext';

export function useGoals(): [Goal[], (value: Goal[] | ((prev: Goal[]) => Goal[])) => void] {
  const { currentUser } = useUser();
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!currentUser) {
      setGoalsState([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.goals.getAll(currentUser.id);
      const migrated = data.map((g: Goal) => migrateGoal(g));
      setGoalsState(migrated);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
      setGoalsState([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const setGoals = useCallback(
    async (value: Goal[] | ((prev: Goal[]) => Goal[])) => {
      if (!currentUser) return;
      const prev = goals;
      const newGoals = typeof value === 'function' ? value(prev) : value;

      const prevIds = new Set(prev.map((g) => g.id));
      const newIds = new Set(newGoals.map((g) => g.id));
      const added = newGoals.filter((g) => !prevIds.has(g.id));
      const removed = prev.filter((g) => !newIds.has(g.id));
      const updated = newGoals.filter((g) => prevIds.has(g.id) && JSON.stringify(prev.find((x) => x.id === g.id)) !== JSON.stringify(g));

      setGoalsState(newGoals);

      try {
        for (const g of added) await api.goals.create(currentUser.id, g);
        for (const g of removed) await api.goals.delete(currentUser.id, g.id);
        for (const g of updated) await api.goals.update(currentUser.id, g.id, g);
        if (added.length || removed.length || updated.length) fetchGoals();
      } catch (err) {
        console.error('Failed to sync goals:', err);
        fetchGoals();
      }
    },
    [goals, fetchGoals, currentUser?.id]
  );

  return [loading ? [] : goals, setGoals];
}
