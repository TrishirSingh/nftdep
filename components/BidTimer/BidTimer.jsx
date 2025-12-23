import React, { useState, useEffect } from 'react';
import { MdTimer } from 'react-icons/md';
import styles from './BidTimer.module.css';

const BidTimer = ({ endTime, onEnd }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (onEnd) onEnd();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endTime, onEnd]);

  if (expired) {
    return (
      <div className={styles.timerExpired}>
        <MdTimer className={styles.timerIcon} />
        <span>Auction Ended</span>
      </div>
    );
  }

  return (
    <div className={styles.timer}>
      <div className={styles.timerHeader}>
        <MdTimer className={styles.timerIcon} />
        <span>Ends in</span>
      </div>
      <div className={styles.timerValues}>
        <div className={styles.timerUnit}>
          <p>{timeLeft.days}</p>
          <small>Days</small>
        </div>
        <div className={styles.timerUnit}>
          <p>{timeLeft.hours}</p>
          <small>Hours</small>
        </div>
        <div className={styles.timerUnit}>
          <p>{timeLeft.minutes}</p>
          <small>Mins</small>
        </div>
        <div className={styles.timerUnit}>
          <p>{timeLeft.seconds}</p>
          <small>Secs</small>
        </div>
      </div>
    </div>
  );
};

export default BidTimer;

