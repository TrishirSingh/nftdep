import React from 'react';
import Image from 'next/image';
import styles from './service.module.css';
import images from '../../img';

const Service = () => {
  return (
    <div className={styles.service}>
      <div className={styles.service_box}>
        <div className={styles.service_box_item}>
          <Image src={images.service1} alt="Filter and discover" width={100} height={100} />
          <p>
            <span>step 1</span>
          </p>
          <h3>Filter and discover</h3>
          <p>
            connect your wallet to start exploring the NFTs
          </p>
        </div>
        <div className={styles.service_box_item}>
          <Image src={images.service2} alt="Connect your wallet" width={100} height={100} />
          <p>
            <span>step 2</span>
          </p>
          <h3>Connect your wallet</h3>
          <p>
            connect your wallet to start exploring the NFTs
          </p>
        </div>
        <div className={styles.service_box_item}>
          <Image src={images.service3} alt="Buy and sell" width={100} height={100} />
          <p>
            <span>step 3</span>
          </p>
          <h3>Buy and sell</h3>
          <p>
            connect your wallet to start exploring the NFTs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Service;