import { useRef, useState } from "react";
import { Loader2, ArrowDown } from "lucide-react";

const THRESHOLD = 70;
const MAX_PULL = 100;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  const onTouchStart = (e) => {
    if (refreshing) return;
    // Only engage when the page is scrolled to the very top.
    if (window.scrollY > 0) {
      startY.current = null;
      return;
    }
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, MAX_PULL));
  };

  const onTouchEnd = async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(0);
      try {
        await Promise.resolve(onRefresh?.());
      } finally {
        setRefreshing(false);
      }
    } else {
      setPull(0);
    }
  };

  const indicatorHeight = refreshing ? 40 : pull;
  const reached = pull >= THRESHOLD;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150 ease-out"
        style={{ height: indicatorHeight }}
        aria-hidden="true"
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin text-accent-ink" />
        ) : reached ? (
          <ArrowDown className="h-5 w-5 text-accent-ink" />
        ) : null}
      </div>
      {children}
    </div>
  );
}