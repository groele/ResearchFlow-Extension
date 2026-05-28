import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/ui/cn';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  delayMs = 300,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const gap = 8;
        let x = 0;
        let y = 0;

        switch (side) {
          case 'top':
            x = rect.left + rect.width / 2;
            y = rect.top - gap;
            break;
          case 'bottom':
            x = rect.left + rect.width / 2;
            y = rect.bottom + gap;
            break;
          case 'left':
            x = rect.left - gap;
            y = rect.top + rect.height / 2;
            break;
          case 'right':
            x = rect.right + gap;
            y = rect.top + rect.height / 2;
            break;
        }

        setCoords({ x, y });
        setVisible(true);
      }
    }, delayMs);
  }, [side, delayMs]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <div
            className={cn(
              'fixed z-[100000] px-2.5 py-1.5 text-2xs font-medium text-slate-200',
              'bg-slate-800 border border-slate-700 rounded-md shadow-lg',
              'pointer-events-none animate-fade-in',
              positionClasses[side],
              className
            )}
            style={{ left: coords.x, top: coords.y }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
