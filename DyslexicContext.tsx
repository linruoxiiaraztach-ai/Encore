import React, { createContext, useContext, useState, useEffect } from 'react';

interface DyslexicContextType {
  isDyslexic: boolean;
  toggleDyslexic: () => void;
}

const DyslexicContext = createContext<DyslexicContextType>({ isDyslexic: false, toggleDyslexic: () => {} });

export const DyslexicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDyslexic, setIsDyslexic] = useState(() => localStorage.getItem('dyslexic') === 'true');

  useEffect(() => {
    if (isDyslexic) {
      document.documentElement.classList.add('dyslexic-mode');
    } else {
      document.documentElement.classList.remove('dyslexic-mode');
    }
    localStorage.setItem('dyslexic', String(isDyslexic));
  }, [isDyslexic]);

  return (
    <DyslexicContext.Provider value={{ isDyslexic, toggleDyslexic: () => setIsDyslexic(p => !p) }}>
      {children}
    </DyslexicContext.Provider>
  );
};

export const useDyslexic = () => useContext(DyslexicContext);
