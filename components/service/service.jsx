import React, { useState, useEffect } from 'react';
import styles from './service.module.css';
import { 
  AiOutlineThunderbolt,
  AiOutlineGlobal,
  AiOutlineDollar,
  AiOutlineSafety,
  AiOutlineRocket,
  AiOutlineBarChart
} from 'react-icons/ai';

const Service = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const features = [
    {
      icon: <AiOutlineRocket />,
      title: "Discover NFTs",
      description: "Explore thousands of unique digital collectibles from top creators worldwide",
      delay: "0s"
    },
    {
      icon: <AiOutlineSafety />,
      title: "Secure Trading",
      description: "Blockchain-powered marketplace with smart contract security",
      delay: "0.1s"
    },
    {
      icon: <AiOutlineThunderbolt />,
      title: "Instant Transactions",
      description: "Fast and seamless buying, selling, and bidding experience",
      delay: "0.2s"
    },
    {
      icon: <AiOutlineBarChart />,
      title: "Live Auctions",
      description: "Participate in real-time auctions and place competitive bids",
      delay: "0.3s"
    },
    {
      icon: <AiOutlineGlobal />,
      title: "Global Marketplace",
      description: "Connect with creators and collectors from around the world",
      delay: "0.4s"
    },
    {
      icon: <AiOutlineDollar />,
      title: "Fair Pricing",
      description: "Transparent pricing with real-time market valuations",
      delay: "0.5s"
    }
  ];

  return (
    <div className={styles.service}>
      <div className={styles.service_grid}>
        {features.map((feature, index) => (
          <div
            key={index}
            className={`${styles.service_card} ${hoveredIndex === index ? styles.service_card_hovered : ''}`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ animationDelay: feature.delay }}
          >
            <div className={styles.service_card_glow}></div>
            <div className={styles.service_icon_wrapper}>
              <div className={styles.service_icon}>
                {feature.icon}
              </div>
              <div className={styles.service_icon_pulse}></div>
            </div>
            <h3 className={styles.service_title}>{feature.title}</h3>
            <p className={styles.service_description}>{feature.description}</p>
            <div className={styles.service_underline}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Service;
