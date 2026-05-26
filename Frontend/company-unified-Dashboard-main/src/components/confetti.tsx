'use client';
import { useEffect } from 'react';

declare global {
  interface Window {
    confetti: any;
  }
}

interface ConfettiProps {
    show: boolean;
}

const Confetti = ({ show }: ConfettiProps) => {
    useEffect(() => {
        if (show && typeof window.confetti === 'function') {
            const duration = 3 * 1000;
            const end = Date.now() + duration;

            (function frame() {
                window.confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.7 }
                });
                window.confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.7 }
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    }, [show]);

    return null;
};

export default Confetti;
