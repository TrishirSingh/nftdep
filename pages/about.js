import React from "react";
import styles from "../styles/About.module.css";
import { 
  AiOutlineRocket,
  AiOutlineSafety,
  AiOutlineThunderbolt,
  AiOutlineGlobal,
  AiOutlineTeam,
  AiOutlineTrophy
} from "react-icons/ai";

const About = () => {
  const stats = [
    { number: "10K+", label: "Active Users" },
    { number: "50K+", label: "NFTs Listed" },
    { number: "1M+", label: "Volume Traded" },
    { number: "500+", label: "Collections" },
  ];

  const values = [
    {
      icon: <AiOutlineSafety />,
      title: "Security First",
      description: "Blockchain-powered smart contracts ensure secure and transparent transactions"
    },
    {
      icon: <AiOutlineThunderbolt />,
      title: "Lightning Fast",
      description: "Instant transactions with minimal gas fees and fast confirmations"
    },
    {
      icon: <AiOutlineGlobal />,
      title: "Global Reach",
      description: "Connect with creators and collectors from around the world"
    },
    {
      icon: <AiOutlineTeam />,
      title: "Community Driven",
      description: "Built by the community, for the community"
    },
    {
      icon: <AiOutlineTrophy />,
      title: "Premium Quality",
      description: "Curated collections from verified creators and artists"
    },
    {
      icon: <AiOutlineRocket />,
      title: "Innovation",
      description: "Cutting-edge technology for the future of digital ownership"
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            About <span className={styles.accent}>NFT Marketplace</span>
          </h1>
          <p className={styles.heroSubtitle}>
            The premier destination for buying, selling, and discovering unique digital collectibles
          </p>
        </div>
        <div className={styles.heroGlow}></div>
      </div>

      <section className={styles.section}>
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>Our Mission</h2>
          <p className={styles.sectionText}>
            We're revolutionizing the way people interact with digital art and collectibles. 
            Our platform combines cutting-edge blockchain technology with an intuitive user experience 
            to create the most accessible NFT marketplace in the world.
          </p>
          <p className={styles.sectionText}>
            Whether you're a seasoned collector or just starting your journey into the world of NFTs, 
            we provide the tools, security, and community you need to thrive in the digital art space.
          </p>
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What We Offer</h2>
        <div className={styles.valuesGrid}>
          {values.map((value, index) => (
            <div key={index} className={styles.valueCard}>
              <div className={styles.valueIcon}>{value.icon}</div>
              <h3 className={styles.valueTitle}>{value.title}</h3>
              <p className={styles.valueDescription}>{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>Why Choose Us</h2>
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <div className={styles.featureDot}></div>
              <div>
                <h3 className={styles.featureTitle}>Smart Contract Security</h3>
                <p className={styles.featureText}>
                  All transactions are secured by audited smart contracts on the blockchain, 
                  ensuring your assets are safe and transactions are transparent.
                </p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureDot}></div>
              <div>
                <h3 className={styles.featureTitle}>Live Auctions</h3>
                <p className={styles.featureText}>
                  Participate in real-time auctions with competitive bidding. Set your own 
                  auctions with custom durations and base prices.
                </p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureDot}></div>
              <div>
                <h3 className={styles.featureTitle}>OpenSea Integration</h3>
                <p className={styles.featureText}>
                  Browse NFTs from both our marketplace and OpenSea, all in one convenient location. 
                  Discover trending collections and popular artists.
                </p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureDot}></div>
              <div>
                <h3 className={styles.featureTitle}>User-Friendly Interface</h3>
                <p className={styles.featureText}>
                  Our intuitive design makes it easy to create, buy, sell, and manage your NFT collection 
                  with just a few clicks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
          <p className={styles.ctaText}>
            Join thousands of creators and collectors in the future of digital ownership
          </p>
          <div className={styles.ctaButtons}>
            <a href="/create" className={styles.ctaButton}>
              Create Your First NFT
            </a>
            <a href="/explore" className={styles.ctaButtonSecondary}>
              Explore Marketplace
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

