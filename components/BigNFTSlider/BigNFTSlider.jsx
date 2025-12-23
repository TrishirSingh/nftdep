import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AiFillFire } from "react-icons/ai";
import { MdVerified } from "react-icons/md";
import styles from "./BigNFTSlider.module.css";
import { openseaApi } from "../../utils/opensea";

const BigNFTSlider = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch NFTs from OpenSea only
      let openseaNFTs = [];
      try {
        openseaNFTs = await openseaApi.fetchPopularNFTs(20); // Fetch more to have variety
      } catch (err) {
        console.error("Could not fetch OpenSea NFTs:", err);
        throw new Error("Failed to load NFTs from OpenSea");
      }

      // Format OpenSea NFTs
      const formattedOpenseaNFTs = openseaNFTs.map((nft) => ({
        id: nft.tokenId,
        title: nft.name || `NFT #${nft.tokenId}`,
        name: "OpenSea",
        collection: nft.collection || "OpenSea",
        price: "View on OpenSea",
        imageUrl: nft.imageUrl,
        external: true,
        verified: true,
      }));

      // Shuffle for variety
      const shuffled = formattedOpenseaNFTs.sort(() => Math.random() - 0.5);
      
      setNfts(shuffled.slice(0, 20)); // Limit to 20 NFTs
    } catch (err) {
      console.error("Failed to load NFTs:", err);
      setError(err.message || "Failed to load NFTs from OpenSea");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.bigNFTSlider}>
        <div className={styles.bigNFTSlider_header}>
          <div className={styles.bigNFTSlider_header_left}>
            <AiFillFire className={styles.fireIcon} />
            <p>Live NFTs</p>
          </div>
        </div>
        <div className={styles.loading}>
          <p>Loading NFTs...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.bigNFTSlider}>
        <div className={styles.bigNFTSlider_header}>
          <div className={styles.bigNFTSlider_header_left}>
            <AiFillFire className={styles.fireIcon} />
            <p>Live NFTs</p>
          </div>
        </div>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadNFTs} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (nfts.length === 0) {
    return (
      <section className={styles.bigNFTSlider}>
        <div className={styles.bigNFTSlider_header}>
          <div className={styles.bigNFTSlider_header_left}>
            <AiFillFire className={styles.fireIcon} />
            <p>Live NFTs</p>
          </div>
        </div>
        <div className={styles.empty}>
          <p>No NFTs available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.bigNFTSlider}>
      <div className={styles.bigNFTSlider_header}>
        <div className={styles.bigNFTSlider_header_left}>
          <AiFillFire className={styles.fireIcon} />
          <p>Live NFTs</p>
        </div>
      </div>

      <div className={styles.scrollingContainer}>
        <div className={styles.scrollingContent}>
          {/* First set */}
          {nfts.map((nft, index) => (
            <div key={`first-${index}`} className={styles.nftCard}>
              <div className={styles.nftImageWrapper}>
                {nft.imageUrl ? (
                  <Image
                    src={nft.imageUrl}
                    alt={nft.title}
                    width={300}
                    height={300}
                    className={styles.nftImage}
                    unoptimized
                  />
                ) : (
                  <div className={styles.placeholderImage}>
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <div className={styles.nftCard_footer}>
                <div>
                  <p className={styles.nftTitle}>{nft.title}</p>
                  <span className={styles.nftId}>
                    {nft.external ? "OpenSea" : `#${nft.id}`}
                  </span>
                </div>
                <div className={styles.nftPriceSmall}>
                  <span>{nft.collection}</span>
                  <p>{nft.price}</p>
                </div>
              </div>
              {nft.verified && (
                <MdVerified className={styles.verifiedBadge} />
              )}
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {nfts.map((nft, index) => (
            <div key={`second-${index}`} className={styles.nftCard}>
              <div className={styles.nftImageWrapper}>
                {nft.imageUrl ? (
                  <Image
                    src={nft.imageUrl}
                    alt={nft.title}
                    width={300}
                    height={300}
                    className={styles.nftImage}
                    unoptimized
                  />
                ) : (
                  <div className={styles.placeholderImage}>
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <div className={styles.nftCard_footer}>
                <div>
                  <p className={styles.nftTitle}>{nft.title}</p>
                  <span className={styles.nftId}>
                    {nft.external ? "OpenSea" : `#${nft.id}`}
                  </span>
                </div>
                <div className={styles.nftPriceSmall}>
                  <span>{nft.collection}</span>
                  <p>{nft.price}</p>
                </div>
              </div>
              {nft.verified && (
                <MdVerified className={styles.verifiedBadge} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BigNFTSlider;
