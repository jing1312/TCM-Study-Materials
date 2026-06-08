import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop({ threshold = 300 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > threshold);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  function handleClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!visible) return null;

  return (
    <button
      className="back-to-top"
      type="button"
      style={{
        position: 'fixed',
        background: 'linear-gradient(135deg, rgb(105 125 215 / 0.9), rgb(160 175 240 / 0.85))',
        color: 'white',
      }}
      onClick={handleClick}
      aria-label="回到顶部"
      title="回到顶部"
    >
      <ArrowUp size={20} />
    </button>
  );
}
