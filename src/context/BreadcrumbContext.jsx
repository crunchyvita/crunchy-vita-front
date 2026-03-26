'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const BreadcrumbContext = createContext(null);

export function BreadcrumbProvider({ children }) {
  const [lastLabel, setLastLabelState] = useState('');

  const setLastLabel = useCallback((label) => {
    setLastLabelState(typeof label === 'string' && label.trim() ? label.trim() : '');
  }, []);

  const clearLastLabel = useCallback(() => setLastLabelState(''), []);

  const value = useMemo(
    () => ({ lastLabel, setLastLabel, clearLastLabel }),
    [lastLabel, setLastLabel, clearLastLabel]
  );

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumbOverride() {
  const ctx = useContext(BreadcrumbContext);
  return ctx ?? { lastLabel: '', setLastLabel: () => {}, clearLastLabel: () => {} };
}
