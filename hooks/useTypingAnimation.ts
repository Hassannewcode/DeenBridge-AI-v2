import { useState, useEffect, useRef } from 'react';

export function useTypingAnimation(
  fullText: string = '',
  isStreaming: boolean
) {
  const [typedText, setTypedText] = useState('');
  const charsQueueRef = useRef<string[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const prevTextLength = useRef(0);

  useEffect(() => {
    // When a new stream comes in, add the new characters to the queue
    if (isStreaming && fullText.length > prevTextLength.current) {
      const newChars = fullText.slice(prevTextLength.current).split('');
      charsQueueRef.current.push(...newChars);
    }
    
    prevTextLength.current = fullText.length;

    // If streaming stops, clear queue and show full text immediately
    if (!isStreaming) {
        charsQueueRef.current = [];
        setTypedText(fullText);
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
        return;
    }

    // Animation loop function
    const animate = () => {
      if (charsQueueRef.current.length > 0) {
        // Process a few characters per frame for speed
        const charsToAdd = charsQueueRef.current.splice(0, 20).join('');
        setTypedText((prev) => prev + charsToAdd);
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    // Start the animation loop if it's not already running
    if (!animationFrameId.current) {
        animationFrameId.current = requestAnimationFrame(animate);
    }
    
    // Cleanup
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [fullText, isStreaming]);

  // Reset for a completely new message (heuristic: when isStreaming becomes true after being false)
  const wasStreamingRef = useRef(isStreaming);
  useEffect(() => {
      if(isStreaming && !wasStreamingRef.current) {
          setTypedText('');
          prevTextLength.current = 0;
          charsQueueRef.current = [];
      }
      wasStreamingRef.current = isStreaming;
  }, [isStreaming]);


  return typedText;
}