
import React, { useEffect, useState } from 'react';

interface CoinEffectProps {
  startX: number;
  startY: number;
  onComplete: () => void;
}

const CoinEffect: React.FC<CoinEffectProps> = ({ startX, startY, onComplete }) => {
  const [particles, setParticles] = useState<{ id: number; tx: number; ty: number }[]>([]);

  useEffect(() => {
    const targetX = window.innerWidth - 60;
    const targetY = 30;
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      tx: targetX - startX,
      ty: targetY - startY,
    }));
    setParticles(newParticles);
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="coin-particle"
          style={{
            left: startX,
            top: startY,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            animation: `coinFly 0.8s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards`,
            animationDelay: `${p.id * 0.05}s`,
          } as any}
        >
          <i className="fa-solid fa-coins"></i>
        </div>
      ))}
    </>
  );
};

export default CoinEffect;
