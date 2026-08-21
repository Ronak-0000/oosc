import React, { useState, useCallback } from 'react';

interface FoldTextProps {
  text: string;
  className?: string;
  wordClassName?: string;
  charClassName?: string;
  stagger?: number;
  duration?: number;
  perspective?: number;
  foldDirection?: 'top' | 'bottom' | 'left' | 'right';
  hoverEffect?: boolean;
}

export const FoldText: React.FC<FoldTextProps> = ({
  text,
  className = '',
  wordClassName = '',
  charClassName = '',
  stagger = 0.035,
  duration = 0.65,
  perspective = 1000,
  foldDirection = 'top',
  hoverEffect = true,
}) => {
  const [animationCycle, setAnimationCycle] = useState(0);

  const handleMouseEnter = useCallback(() => {
    if (hoverEffect) {
      setAnimationCycle((prev) => prev + 1);
    }
  }, [hoverEffect]);

  // Split text into words while tracking cumulative character index for staggered delay
  const words = text.split(' ');
  let globalCharIndex = 0;

  return (
    <span
      className={`inline-flex flex-wrap justify-center items-center gap-x-[0.28em] select-none cursor-default ${className}`}
      style={{ perspective: `${perspective}px` }}
      aria-label={text}
      onMouseEnter={handleMouseEnter}
    >
      {words.map((word, wordIdx) => {
        const wordChars = word.split('');
        return (
          <span
            key={`word-${wordIdx}-${animationCycle}`}
            className={`inline-flex whitespace-nowrap ${wordClassName}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {wordChars.map((char) => {
              const charIndex = globalCharIndex++;
              const delay = charIndex * stagger;

              return (
                <span
                  key={`char-${charIndex}-${animationCycle}`}
                  className={`inline-block will-change-transform ${charClassName}`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin:
                      foldDirection === 'top'
                        ? '50% 0%'
                        : foldDirection === 'bottom'
                        ? '50% 100%'
                        : foldDirection === 'left'
                        ? '0% 50%'
                        : '100% 50%',
                    animation: `foldTextIn-${foldDirection} ${duration}s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s both`,
                  }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        );
      })}

      <style>{`
        @keyframes foldTextIn-top {
          0% {
            opacity: 0;
            transform: rotateX(90deg) translateY(-24px) translateZ(15px);
            filter: blur(4px);
          }
          50% {
            opacity: 0.8;
            filter: blur(1px);
          }
          100% {
            opacity: 1;
            transform: rotateX(0deg) translateY(0px) translateZ(0px);
            filter: blur(0px);
          }
        }
        @keyframes foldTextIn-bottom {
          0% {
            opacity: 0;
            transform: rotateX(-90deg) translateY(24px) translateZ(15px);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: rotateX(0deg) translateY(0px) translateZ(0px);
            filter: blur(0px);
          }
        }
        @keyframes foldTextIn-left {
          0% {
            opacity: 0;
            transform: rotateY(-90deg) translateX(-24px);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: rotateY(0deg) translateX(0px);
            filter: blur(0px);
          }
        }
        @keyframes foldTextIn-right {
          0% {
            opacity: 0;
            transform: rotateY(90deg) translateX(24px);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: rotateY(0deg) translateX(0px);
            filter: blur(0px);
          }
        }
      `}</style>
    </span>
  );
};
