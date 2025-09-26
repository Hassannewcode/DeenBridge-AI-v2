import { useEffect, RefObject } from 'react';

type AnyEvent = MouseEvent | TouchEvent;

export const useClickOutside = (
  refs: (RefObject<HTMLElement> | null)[],
  handler: (event: AnyEvent) => void,
) => {
  useEffect(() => {
    const listener = (event: AnyEvent) => {
      const isOutside = refs.every(ref => {
        return ref?.current && !ref.current.contains(event.target as Node);
      });

      if (isOutside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, handler]);
};
