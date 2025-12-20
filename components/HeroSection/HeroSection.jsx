import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './HeroSection.module.css';
import { Button } from '../componentsindex';
import images from '../../img';

const HeroSection = () => {
  return (
    <div className={styles.heroSection}>
      <div className={styles.heroSection_box}>
        <div className={styles.heroSection_box_left}>
          <h1>Discover, collect, and sell Dope NFTs</h1>
          <p>Discover the craziest and the most outstanding NFT's</p>
          <Link href="/explore">
            <Button btnName="Explore Now" />
          </Link>
        </div>
        <div className={styles.heroSection_box_right}>
            <Image src={images.hero} alt="Hero Section" width={600} height={600} />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;