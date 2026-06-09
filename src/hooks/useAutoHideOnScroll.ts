import { useEffect, useRef, useState } from 'react';

export function useAutoHideOnScroll(hideAfter = 96, enabled = true) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      ticking.current = false;
      return;
    }

    const delta = 8;
    const showAtTop = 24;
    let lastTouchY: number | null = null;
    let animationFrameId = 0;
    let lastInputDirection: 'up' | 'down' | null = null;

    function update() {
      const currentY = Math.max(window.scrollY, 0);
      const diff = currentY - lastScrollY.current;

      if (currentY <= showAtTop) {
        setHidden(false);
      } else if (diff > delta && currentY > hideAfter) {
        setHidden(true);
      } else if (diff < -delta && lastInputDirection === 'up') {
        setHidden(false);
      }

      lastScrollY.current = currentY;
      ticking.current = false;
      animationFrameId = 0;
    }

    function onScroll() {
      if (!ticking.current) {
        animationFrameId = window.requestAnimationFrame(update);
        ticking.current = true;
      }
    }

    function onWheel(event: WheelEvent) {
      if (event.deltaY > 12 && window.scrollY > hideAfter) {
        lastInputDirection = 'down';
        setHidden(true);
      } else if (event.deltaY < -12) {
        lastInputDirection = 'up';
        setHidden(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (['ArrowDown', 'End', 'PageDown', 'Space'].includes(event.code)) {
        lastInputDirection = 'down';
      } else if (['ArrowUp', 'Home', 'PageUp'].includes(event.code)) {
        lastInputDirection = 'up';
        setHidden(false);
      }
    }

    function onTouchStart(event: TouchEvent) {
      lastTouchY = event.touches[0]?.clientY ?? null;
    }

    function onTouchMove(event: TouchEvent) {
      const currentTouchY = event.touches[0]?.clientY;
      if (typeof currentTouchY !== 'number' || lastTouchY === null) return;

      const touchDiff = currentTouchY - lastTouchY;
      if (touchDiff < -10 && window.scrollY > hideAfter) {
        lastInputDirection = 'down';
        setHidden(true);
      } else if (touchDiff > 10) {
        lastInputDirection = 'up';
        setHidden(false);
      }

      lastTouchY = currentTouchY;
    }

    lastScrollY.current = Math.max(window.scrollY, 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      ticking.current = false;
      animationFrameId = 0;
    };
  }, [enabled, hideAfter]);

  return hidden;
}
