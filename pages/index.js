import React from "react";
import {
  HeroSection,
  Service,
  BigNFTSlider,
} from "../components/componentsindex";
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
            Scroll through featured items and get a feel for the marketplace
            experience before we plug into a real blockchain API.
          </p>
        </header>
        <BigNFTSlider />
      </section>
    </div>
  );
};

export default Home;