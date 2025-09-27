import React, { createContext, useContext, useState, useEffect } from 'react';

interface DeviceContextType {
    isMobile: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize state synchronously to prevent a re-render flicker on load
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return false;
    });

    useEffect(() => {
        const checkDevice = () => {
            if (typeof window !== 'undefined') {
                // Use a common breakpoint for mobile. 768px is Tailwind's `md` breakpoint.
                setIsMobile(window.innerWidth < 768);
            }
        };
        
        // No need for initial check, as it's done in useState
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);
    
    const value = { isMobile };

    return (
        <DeviceContext.Provider value={value}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDevice = (): DeviceContextType => {
    const context = useContext(DeviceContext);
    if (context === undefined) {
        throw new Error('useDevice must be used within a DeviceProvider');
    }
    return context;
};