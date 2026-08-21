import React, { useState, useEffect, useMemo } from 'react';

interface TextTypeProps {
  text: string | string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  startDelay?: number;
  loop?: boolean;
  cursor?: string;
  cursorClassName?: string;
  className?: string;
  onComplete?: () => void;
  showCursor?: boolean;
}

export const TextType: React.FC<TextTypeProps> = ({
  text,
  typingSpeed = 35,
  deletingSpeed = 20,
  pauseDuration = 2200,
  startDelay = 100,
  loop = true,
  cursor = '|',
  cursorClassName = 'text-[#64748B]',
  className = '',
  onComplete,
  showCursor = true,
}) => {
  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasStarted(true);
    }, startDelay);
    return () => clearTimeout(timer);
  }, [startDelay]);

  useEffect(() => {
    if (!hasStarted || textArray.length === 0) return;

    const currentString = textArray[currentTextIndex] || '';

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        if (loop || textArray.length > 1) {
          setIsDeleting(true);
        } else {
          onComplete?.();
        }
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    if (!isDeleting) {
      if (displayedText.length < currentString.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentString.slice(0, displayedText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else {
        // Finished typing the current string
        if (loop || textArray.length > 1) {
          setIsPaused(true);
        } else {
          onComplete?.();
        }
      }
    } else {
      if (displayedText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentString.slice(0, displayedText.length - 1));
        }, deletingSpeed);
        return () => clearTimeout(timeout);
      } else {
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
      }
    }
  }, [
    hasStarted,
    displayedText,
    isDeleting,
    isPaused,
    currentTextIndex,
    textArray,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    loop,
    onComplete,
  ]);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span>{displayedText}</span>
      {showCursor && (
        <span
          className={`inline-block ml-0.5 font-mono font-normal animate-pulse select-none ${cursorClassName}`}
          aria-hidden="true"
        >
          {cursor}
        </span>
      )}
    </span>
  );
};
