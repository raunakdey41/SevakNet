import { useState, useEffect, useRef } from 'react';

export function useTypewriter(lines, speed = 60, pauseDuration = 2000) {
  const [displayed, setDisplayed] = useState('');
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!lines || lines.length === 0) return;
    const currentLine = lines[lineIndex % lines.length];

    const tick = () => {
      if (!deleting) {
        if (charIndex < currentLine.length) {
          setDisplayed(currentLine.slice(0, charIndex + 1));
          setCharIndex(c => c + 1);
          timeoutRef.current = setTimeout(tick, speed);
        } else {
          timeoutRef.current = setTimeout(() => setDeleting(true), pauseDuration);
        }
      } else {
        if (charIndex > 0) {
          setDisplayed(currentLine.slice(0, charIndex - 1));
          setCharIndex(c => c - 1);
          timeoutRef.current = setTimeout(tick, speed / 2);
        } else {
          setDeleting(false);
          setLineIndex(i => (i + 1) % lines.length);
          timeoutRef.current = setTimeout(tick, 300);
        }
      }
    };

    timeoutRef.current = setTimeout(tick, speed);
    return () => clearTimeout(timeoutRef.current);
  }, [charIndex, deleting, lineIndex, lines, speed, pauseDuration]);

  return displayed;
}
