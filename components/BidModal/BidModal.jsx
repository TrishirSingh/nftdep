import React, { useState } from 'react';
import { GrClose } from 'react-icons/gr';
import Button from '../Button/Button';
import styles from './BidModal.module.css';

const BidModal = ({ isOpen, onClose, tokenId, nftName, onCreateAuction }) => {
  const [basePrice, setBasePrice] = useState('');
  const [duration, setDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('hours');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!basePrice || parseFloat(basePrice) <= 0) {
      setError('Please enter a valid base price');
      return;
    }

    if (!duration || duration === '') {
      setError('Please enter a duration');
      return;
    }

    // Convert duration to seconds
    const durationNum = parseFloat(duration);
    
    if (isNaN(durationNum) || durationNum < 0) {
      setError('Please enter a valid duration number');
      return;
    }

    // Validation: seconds must be at least 1, but hours and minutes can be 0
    if (durationUnit === 'seconds' && durationNum < 1) {
      setError('Duration in seconds must be at least 1');
      return;
    }

    let durationSeconds = 0;

    switch (durationUnit) {
      case 'seconds':
        durationSeconds = Math.floor(durationNum);
        break;
      case 'minutes':
        durationSeconds = Math.floor(durationNum * 60);
        break;
      case 'hours':
        durationSeconds = Math.floor(durationNum * 60 * 60);
        break;
      case 'days':
        durationSeconds = Math.floor(durationNum * 60 * 60 * 24);
        break;
      default:
        durationSeconds = Math.floor(durationNum * 60 * 60);
    }

    // Final check: total duration must be at least 1 second
    if (durationSeconds < 1) {
      setError('Total auction duration must be at least 1 second');
      return;
    }

    console.log('Creating auction:', {
      tokenId,
      basePrice,
      duration: durationNum,
      durationUnit,
      durationSeconds,
    });

    setIsCreating(true);
    try {
      await onCreateAuction(tokenId, basePrice, durationSeconds);
      onClose();
      setBasePrice('');
      setDuration('');
      setDurationUnit('hours');
      setError('');
    } catch (err) {
      console.error('Create auction error:', err);
      setError(err.message || 'Failed to create auction');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Start Bidding for {nftName || `NFT #${tokenId}`}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <GrClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="basePrice">Base Price (ETH)</label>
            <input
              id="basePrice"
              type="number"
              step="0.0001"
              min="0"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="0.001"
              required
            />
            <small>Minimum bid amount</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="duration">Auction Duration</label>
            <div className={styles.durationInput}>
              <input
                id="duration"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={duration}
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow numbers (including 0)
                  if (val === '' || /^\d+$/.test(val)) {
                    setDuration(val);
                  }
                }}
                onKeyDown={(e) => {
                  // Allow: backspace, delete, tab, escape, enter, and numbers
                  if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                      (e.keyCode === 65 && e.ctrlKey === true) ||
                      (e.keyCode === 67 && e.ctrlKey === true) ||
                      (e.keyCode === 86 && e.ctrlKey === true) ||
                      (e.keyCode === 88 && e.ctrlKey === true) ||
                      // Allow: home, end, left, right
                      (e.keyCode >= 35 && e.keyCode <= 39)) {
                    return;
                  }
                  // Ensure that it is a number and stop the keypress
                  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                  }
                }}
                placeholder={durationUnit === 'seconds' ? "1" : "0"}
                required
                autoFocus={false}
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                className={styles.unitSelect}
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            <small>
              {durationUnit === 'seconds' 
                ? 'Minimum 1 second required' 
                : 'You can set hours and minutes to 0, but seconds must be at least 1'}
            </small>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="submit"
              disabled={isCreating}
              className={styles.submitButton}
            >
              {isCreating ? 'Creating...' : 'Start Auction'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BidModal;

