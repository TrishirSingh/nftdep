import React, { useEffect, useRef, useState } from 'react';
import styles from './Notification.module.css';
import { AiFillFire } from 'react-icons/ai';

const Notification = () => {
  const containerRef = useRef(null);
  const fireworksRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !showFireworks || typeof window === 'undefined') return;

    // Create a full-page container for fireworks
    const fireworksContainer = document.createElement('div');
    fireworksContainer.id = 'full-page-fireworks';
    fireworksContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(fireworksContainer);
    containerRef.current = fireworksContainer;

    let timer;
    let fireworksInstance = null;

    // Dynamically import fireworks-js only on client side
    import('fireworks-js').then(({ Fireworks }) => {
      if (!containerRef.current) return;

      // Initialize fireworks with full spectrum colors
      const fireworks = new Fireworks(containerRef.current, {
        autoresize: true,
        opacity: 0.6,
        acceleration: 1.05,
        friction: 0.97,
        gravity: 1.5,
        particles: 100, // More particles for better effect
        traceLength: 4,
        traceSpeed: 12,
        explosion: 8, // More explosions
        intensity: 50, // Higher intensity
        flickering: 60,
        lineStyle: 'round',
        hue: { min: 0, max: 360 }, // Full color spectrum (rainbow)
        delay: { min: 15, max: 30 }, // More frequent
        rocketsPoint: { min: 50, max: 50 },
        lineWidth: { explosion: { min: 2, max: 4 }, trace: { min: 1, max: 3 } },
        brightness: { min: 60, max: 100 }, // Brighter colors
        decay: { min: 0.015, max: 0.03 },
        mouse: { click: false, move: false, max: 1 }
      });

      fireworks.start();
      fireworksInstance = fireworks;
      fireworksRef.current = fireworks;

      // Stop fireworks after 5 seconds
      timer = setTimeout(() => {
        if (fireworksInstance) {
          fireworksInstance.stop();
        }
        setShowFireworks(false);
      }, 5000);
    }).catch((error) => {
      console.error('Failed to load fireworks-js:', error);
      setShowFireworks(false);
    });

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (fireworksInstance) {
        fireworksInstance.stop();
      }
      if (fireworksRef.current) {
        fireworksRef.current.stop();
        fireworksRef.current = null;
      }
      // Remove the container from DOM
      const container = document.getElementById('full-page-fireworks');
      if (container) {
        document.body.removeChild(container);
      }
    };
  }, [isClient, showFireworks]);

  // Trigger fireworks when notification opens
  useEffect(() => {
    setShowFireworks(true);
  }, []);

  return (
    <>
      <div className={styles.notification}>
        <p className={styles.notificationTitle}>
          <AiFillFire className={styles.fireIcon} />
          Notifications
        </p>

        <div className={styles.dropNotification}>
          <div className={styles.dropIcon}>🎉</div>
          <div className={styles.dropContent}>
            <h4 className={styles.dropTitle}>New Drop Coming Soon!</h4>
            <p className={styles.dropText}>
              <span className={styles.highlight}>Drop happens every 3 days</span>
            </p>
            <p className={styles.dropSubtext}>
              Stay tuned for the next exclusive NFT collection drop!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Notification;
