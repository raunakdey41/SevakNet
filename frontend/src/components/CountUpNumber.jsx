import React, { useRef, useState, useEffect } from 'react';
import { useCountUp } from '../hooks/useCountUp';

export default function CountUpNumber({ target, duration=1200, suffix='', prefix='', className='' }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) setInView(true); }, { threshold:0.3 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const count = useCountUp(target, duration, inView);
  return <span ref={ref} className={className}>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
}
