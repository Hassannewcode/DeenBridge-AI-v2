import type { UserProfile } from '../types';

type FeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const patterns: Record<FeedbackType, number | number[]> = {
    light: 10,
    medium: 30,
    heavy: 50,
    success: [20, 40, 60],
    warning: [50, 50, 50],
    error: [100, 50, 100],
};

export const triggerHapticFeedback = (profile: UserProfile, type: FeedbackType) => {
    if (profile.enableHaptics && typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
            navigator.vibrate(patterns[type]);
        } catch (e) {
            console.warn("Haptic feedback failed:", e);
        }
    }
};
