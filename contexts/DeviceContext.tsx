import React, { createContext, useContext, useState, useEffect } from 'react';

interface DeviceContextType {
    isMobile: boolean;
    isIOS: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Default to false, will be set by useEffect. This prevents SSR issues and is fine for a client-only app.
    const [isMobile, setIsMobile] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        const userAgent = navigator.userAgent;
        // A robust check for mobile devices using the user agent string.
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            userAgent
        );
        setIsMobile(isMobileDevice);

        // Check for iOS specifically
        const isIOSDevice = /iPhone|iPad|iPod/.test(userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);
    }, []);
    
    const value = { isMobile, isIOS };

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
