import React from "react";
import Link from "next/link";
import {
  HeroSection,
  Service,
  BigNFTSlider,
} from "../components/componentsindex";
import Button from "../components/Button/Button";
import styles from "../styles/Home.module.css";

const Home = () => {
  return (
    <div className={styles.container}>
      <section className={styles.heroWrapper}>
        <HeroSection />
      </section>

      <section className={styles.section}>
        <header className={styles.section_header}>
          <p className={styles.section_label}>How it works</p>
          <h2 className={styles.section_title}>
            Buy, sell and discover dope NFTs in a few clicks
          </h2>
          <p className={styles.section_subtitle}>
            Connect your wallet, explore curated drops and place bids on
            unique digital collectibles from creators all over the world.
          </p>
        </header>
        <Service />
      </section>

      <section className={styles.section}>
        <header className={styles.section_header}>
          <p className={styles.section_label}>Live auctions</p>
          <h2 className={styles.section_title}>
            Explore trending NFTs on the marketplace
          </h2>
          <p className={styles.section_subtitle}>
            Discover real NFTs from OpenSea and our marketplace, all in one place.
          </p>
        </header>
        <BigNFTSlider />
        <div className={styles.viewBidsButton}>
          <Link href="/bids">
            <Button btnName="View Current Bids" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;