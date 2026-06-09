import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop({
  threshold = 300,
  scrollWindow
}: {
  threshold?: number;
  scrollWindow?: Window | null;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targetWindow = scrollWindow ?? window;
    let ticking = false;
    let animationFrameId = 0;

    function updateVisibility() {
      setVisible(targetWindow.scrollY > threshold);
      ticking = false;
      animationFrameId = 0;
    }

    function onScroll() {
      if (!ticking) {
        animationFrameId = targetWindow.requestAnimationFrame(updateVisibility);
        ticking = true;
      }
    }

    targetWindow.addEventListener('scroll', onScroll, { passive: true });
    updateVisibility();
    return () => {
      targetWindow.removeEventListener('scroll', onScroll);
      if (animationFrameId) targetWindow.cancelAnimationFrame(animationFrameId);
      ticking = false;
      animationFrameId = 0;
    };
  }, [scrollWindow, threshold]);

  function handleClick() {
    (scrollWindow ?? window).scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!visible) return null;

  return (
    <button
      className="back-to-top"
      type="button"
      onClick={handleClick}
      aria-label="回到顶部"
      title="回到顶部"
    >
      <ArrowUp size={20} />
    </button>
  );
}
