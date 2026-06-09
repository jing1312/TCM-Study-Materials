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

    const showAtTop = 24;
    let lastTouchY: number | null = null;
    let animationFrameId = 0;

    function update() {
      const currentY = Math.max(window.scrollY, 0);

      if (currentY <= showAtTop) {
        setHidden(false);
      } else if (currentY > lastScrollY.current && currentY > hideAfter) {
        setHidden(true);
      }
      // 向上滚动不再重新显示，只有回到顶部才出现

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
        setHidden(true);
      }
      // 向上滚轮不再触发显示
    }

    function onTouchStart(event: TouchEvent) {
      lastTouchY = event.touches[0]?.clientY ?? null;
    }

    function onTouchMove(event: TouchEvent) {
      const currentTouchY = event.touches[0]?.clientY;
      if (typeof currentTouchY !== 'number' || lastTouchY === null) return;

      const touchDiff = currentTouchY - lastTouchY;
      if (touchDiff < -10 && window.scrollY > hideAfter) {
        setHidden(true);
      }
      // 向下滑动不再触发显示

      lastTouchY = currentTouchY;
    }

    lastScrollY.current = Math.max(window.scrollY, 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      ticking.current = false;
      animationFrameId = 0;
    };
  }, [enabled, hideAfter]);

  return hidden;
}
