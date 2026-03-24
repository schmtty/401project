import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const base = 'Area Book 2.0';
    document.title = title ? `${title} | ${base}` : base;
    return () => { document.title = base; };
  }, [title]);
}
