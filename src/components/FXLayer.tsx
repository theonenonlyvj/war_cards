import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export const FXLayer = ({ trigger }: { trigger: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({ 
        resizeTo: window, 
        backgroundAlpha: 0,
        antialias: true
      });
      containerRef.current?.appendChild(app.canvas);
      appRef.current = app;
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (trigger && appRef.current) {
      createExplosion(appRef.current);
    }
  }, [trigger]);

  const createExplosion = (app: PIXI.Application) => {
    const particleCount = 50;
    const particles: PIXI.Graphics[] = [];
    const centerX = app.screen.width / 2;
    const centerY = app.screen.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics();
      const color = Math.random() > 0.5 ? 0x00ffff : 0xff00ff; // Neon Cyan or Magenta
      particle.circle(0, 0, 2 + Math.random() * 3);
      particle.fill(color);
      
      particle.x = centerX;
      particle.y = centerY;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };

      app.stage.addChild(particle);
      particles.push(particle);

      // Animate particle
      const animate = () => {
        if (!particle.parent) return;
        particle.x += velocity.x;
        particle.y += velocity.y;
        particle.alpha -= 0.02;
        
        if (particle.alpha <= 0) {
          app.stage.removeChild(particle);
          particle.destroy();
        } else {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }
  };

  return <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }} />;
};
