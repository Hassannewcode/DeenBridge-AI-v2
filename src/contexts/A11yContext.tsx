import React, { createContext, useContext, useState, useCallback } from 'react';

interface A11yContextType {
  announce: (message: string) => void;
  message: string;
  key: number;
}

const A11yContext = createContext<A11yContextType | undefined>(undefined);

export const A11yProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [message, setMessage] = useState('');
    const [key, setKey] = useState(0); // Key to force re-render and re-announcement

    const announce = useCallback((newMessage: string) => {
        setMessage(newMessage);
        setKey(prev => prev + 1);
    }, []);

    const value = { announce, message, key };

    return (
        <A11yContext.Provider value={value}>
            {children}
        </A11yContext.Provider>
    );
};

export const useA11yContext = (): A11yContextType => {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error('useA11yContext must be used within an A11yProvider');
  }
  return context;
};