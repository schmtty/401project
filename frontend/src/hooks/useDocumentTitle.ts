import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const base = 'Keeper';
    document.title = title ? `${title} | ${base}` : base;
    return () => { document.title = base; };
  }, [title]);
}
