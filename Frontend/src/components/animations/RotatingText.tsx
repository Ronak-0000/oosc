import React, { useState, useEffect } from 'react';

interface RotatingTextProps {
  texts: string[];
  transitionDuration?: number;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | 'random';
  splitBy?: 'characters' | 'words' | 'lines';
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
  animatePresence?: boolean;
}

export const RotatingText: React.FC<RotatingTextProps> = ({
  texts,
  rotationInterval = 2800,
  staggerDuration = 0.025,
  splitBy = 'characters',
  mainClassName = '',
  splitLevelClassName = '',
  elementLevelClassName = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!texts || texts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
      setAnimationKey((prev) => prev + 1);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [texts, rotationInterval]);

  const currentText = texts[currentIndex] || '';

  const renderElements = () => {
    if (splitBy === 'characters') {
      const words = currentText.split(' ');
      let charCounter = 0;

      return words.map((word, wordIndex) => (
        <span
          key={`word-${wordIndex}-${animationKey}`}
          className={`inline-flex whitespace-nowrap ${splitLevelClassName}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {word.split('').map((char) => {
            const index = charCounter++;
            const delay = index * staggerDuration;

            return (
              <span
                key={`char-${index}-${animationKey}`}
                className={`inline-block will-change-transform ${elementLevelClassName}`}
                style={{
                  transformStyle: 'preserve-3d',
                  animation: `rotateCharIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
                }}
              >
                {char}
              </span>
            );
          })}
        </span>
      ));
    }

    if (splitBy === 'words') {
      const words = currentText.split(' ');
      return words.map((word, wordIndex) => {
        const delay = wordIndex * (staggerDuration * 2.5);
        return (
          <span
            key={`word-${wordIndex}-${animationKey}`}
            className={`inline-block will-change-transform ${elementLevelClassName}`}
            style={{
              transformStyle: 'preserve-3d',
              animation: `rotateWordIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
            }}
          >
            {word}
          </span>
        );
      });
    }

    return (
      <span
        key={`line-${animationKey}`}
        className={`inline-block will-change-transform ${elementLevelClassName}`}
        style={{
          transformStyle: 'preserve-3d',
          animation: 'rotateWordIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0s both',
        }}
      >
        {currentText}
      </span>
    );
  };

  return (
    <span
      className={`inline-flex flex-wrap items-center justify-center gap-x-[0.25em] ${mainClassName}`}
      style={{ perspective: '1000px' }}
      aria-label={currentText}
    >
      {renderElements()}

      <style>{`
        @keyframes rotateCharIn {
          0% {
            opacity: 0;
            transform: translateY(120%) rotateX(-90deg);
            filter: blur(4px);
          }
          40% {
            opacity: 0.7;
          }
          100% {
            opacity: 1;
            transform: translateY(0%) rotateX(0deg);
            filter: blur(0px);
          }
        }
        @keyframes rotateWordIn {
          0% {
            opacity: 0;
            transform: translateY(100%) rotateX(-80deg);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0%) rotateX(0deg);
            filter: blur(0px);
          }
        }
      `}</style>
    </span>
  );
};
