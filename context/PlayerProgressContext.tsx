import React, { createContext, useContext, ReactNode } from 'react';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';

type PlayerProgressContextType = ReturnType<typeof usePlayerProgress>;

const PlayerProgressContext = createContext<PlayerProgressContextType | undefined>(undefined);

export const PlayerProgressProvider = ({ children }: { children: ReactNode }) => {
  const playerProgress = usePlayerProgress();

  return (
    <PlayerProgressContext.Provider value={playerProgress}>
      {children}
    </PlayerProgressContext.Provider>
  );
};

export const usePlayerProgressContext = () => {
  const context = useContext(PlayerProgressContext);
  if (context === undefined) {
    throw new Error('usePlayerProgressContext must be used within a PlayerProgressProvider');
  }
  return context;
};
