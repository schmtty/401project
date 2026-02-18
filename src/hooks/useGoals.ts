import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { sampleGoals } from '@/utils/sampleData';
import { migrateGoal } from '@/utils/migrateData';
import type { Goal } from '@/utils/sampleData';

export function useGoals(): [Goal[], (value: Goal[] | ((prev: Goal[]) => Goal[])) => void] {
  const [goals, setGoals] = useLocalStorage<Goal[]>('goals', sampleGoals);
  const migratedRef = useRef(false);

  useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    const needsMigration = goals.some(g => g.goalType == null);
    if (needsMigration) {
      setGoals(prev => prev.map(migrateGoal));
    }
  }, [goals, setGoals]);

  return [goals, setGoals];
}
