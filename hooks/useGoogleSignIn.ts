import { useState, useEffect, useCallback } from 'react';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export interface GoogleProfile {
    name: string;
    email: string;
    picture: string;
}

export const useGoogleSignIn = (
    onSuccess: (profile: GoogleProfile) => void,
    setToastInfo: (info: { message: string, type: 'success' | 'error' } | null) => void
) => {
    const [isReady, setIsReady] = useState(false);

    const handleCredentialResponse = useCallback((response: any) => {
        if (response.credential) {
            try {
                // Decode the JWT to get user profile information
                const decoded: GoogleProfile = JSON.parse(atob(response.credential.split('.')[1]));
                onSuccess(decoded);
            } catch (e) {
                console.error("Error decoding Google JWT:", e);
                setToastInfo({ message: 'Could not process Google Sign-In.', type: 'error' });
            }
        }
    }, [onSuccess, setToastInfo]);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.warn("Google Client ID is not configured. Google Sign-In will be disabled.");
            setIsReady(false);
            return;
        }

        if (typeof window.google === 'undefined' || typeof window.google.accounts === 'undefined') {
            // Google script might not have loaded yet, this effect will re-run
            return;
        }

        try {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse
            });
            setIsReady(true);
        } catch (error) {
            console.error("Google Sign-In initialization failed:", error);
            setIsReady(false);
        }
    }, [handleCredentialResponse]);

    const signIn = useCallback(() => {
        if (isReady && window.google?.accounts?.id) {
            window.google.accounts.id.prompt();
        } else {
            // Only show an error if the client ID was provided but initialization still failed.
            if (GOOGLE_CLIENT_ID) {
                setToastInfo({ message: 'Google Sign-In is not available at the moment.', type: 'error' });
            }
            // Silently fail if not configured, as the button shouldn't be visible anyway.
        }
    }, [isReady, setToastInfo]);

    return { signIn, isReady };
};