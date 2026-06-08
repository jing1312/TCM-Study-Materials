import { useEffect, useRef, useState } from 'react';

export function useAutoHideOnScroll(hideAfter = 96) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const delta = 8;
    const showAtTop = 24;

    function update() {
      const currentY = Math.max(window.scrollY, 0);
      const diff = currentY - lastScrollY.current;

      if (currentY <= showAtTop) {
        setHidden(false);
      } else if (diff > delta && currentY > hideAfter) {
        setHidden(true);
      } else if (diff < -delta) {
        setHidden(false);
      }

      lastScrollY.current = currentY;
      ticking.current = false;
    }

    function onScroll() {
      if (!ticking.current) {
        window.requestAnimationFrame(update);
        ticking.current = true;
      }
    }

    lastScrollY.current = Math.max(window.scrollY, 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hideAfter]);

  return hidden;
}
