import { useRef, useCallback, useEffect, useState } from 'react';

interface Props {
  onMove: (dx: number, dy: number) => void;
}

const JOYSTICK_SIZE = 120;
const KNOB_SIZE = 48;
const MAX_DIST = (JOYSTICK_SIZE - KNOB_SIZE) / 2;

const VirtualJoystick = ({ onMove }: Props) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const activeTouch = useRef<number | null>(null);
  const center = useRef({ x: 0, y: 0 });

  const handleStart = useCallback((clientX: number, clientY: number, id: number) => {
    const rect = baseRef.current!.getBoundingClientRect();
    center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    activeTouch.current = id;
    handleMove(clientX, clientY);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - center.current.x;
    const dy = clientY - center.current.y;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, MAX_DIST);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * clampedDist;
    const ny = Math.sin(angle) * clampedDist;
    setKnobPos({ x: nx, y: ny });
    onMove(dist > 3 ? nx / MAX_DIST : 0, dist > 3 ? ny / MAX_DIST : 0);
  }, [onMove]);

  const handleEnd = useCallback(() => {
    activeTouch.current = null;
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (activeTouch.current === null) return;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === activeTouch.current) {
          e.preventDefault();
          handleMove(e.touches[i].clientX, e.touches[i].clientY);
          return;
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (activeTouch.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouch.current) {
          handleEnd();
          return;
        }
      }
    };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleMove, handleEnd]);

  return (
    <div
      ref={baseRef}
      className="absolute bottom-8 right-8 z-50 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm"
      style={{ width: JOYSTICK_SIZE, height: JOYSTICK_SIZE, touchAction: 'none' }}
      onTouchStart={(e) => {
        const t = e.changedTouches[0];
        handleStart(t.clientX, t.clientY, t.identifier);
      }}
    >
      <div
        className="absolute rounded-full bg-white/40 border border-white/50"
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          left: JOYSTICK_SIZE / 2 - KNOB_SIZE / 2 + knobPos.x,
          top: JOYSTICK_SIZE / 2 - KNOB_SIZE / 2 + knobPos.y,
          transition: activeTouch.current !== null ? 'none' : 'all 0.15s ease-out',
        }}
      />
    </div>
  );
};

export default VirtualJoystick;
