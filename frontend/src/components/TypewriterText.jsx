import React from 'react';
import { useTypewriter } from '../hooks/useTypewriter';

export default function TypewriterText({ lines, speed=60, className='', style={} }) {
  const text = useTypewriter(lines, speed);
  return (
    <span className={className} style={style}>
      {text}<span className="typewriter-cursor"/>
    </span>
  );
}
