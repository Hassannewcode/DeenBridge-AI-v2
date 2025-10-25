import { useA11yContext } from '../contexts/A11yContext';

export const useA11y = (): { announce: (message: string) => void } => {
    const { announce } = useA11yContext();
    return { announce };
};