import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { marketplaceApi } from "../utils/contract";
import { openseaApi } from "../utils/opensea";
import Button from "../components/Button/Button";
import styles from "../styles/Explore.module.css";

const Explore = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showType, setShowType] = useState("opensea"); // "opensea" or "marketplace"

  useEffect(() => {
    loadNFTs();
  }, [showType]);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (showType === "opensea") {
        // Fetch real NFTs from OpenSea
        const items = await openseaApi.fetchPopularNFTs(20);
        setNfts(items);
      } else {
        // Fetch NFTs from your marketplace
        const items = await marketplaceApi.fetchMarketItems();
        setNfts(items);
      }
    } catch (err) {
      console.error("Failed to load NFTs:", err);
      const errorMsg = err.message || "Failed to load NFTs";
      if (errorMsg.includes("fetchMarketItems")) {
        setError("Your deployed contract doesn't have the fetchMarketItems function. You need to redeploy the full contract version from Remix that includes fetchMarketItems, fetchMyNFTs, and fetchItemsListed functions.");
      } else if (errorMsg.includes("OpenSea")) {
        setError(`Failed to load NFTs from OpenSea: ${errorMsg}. Trying marketplace NFTs...`);
        // Fallback to marketplace NFTs
        try {
          const items = await marketplaceApi.fetchMarketItems();
          setNfts(items);
          setShowType("marketplace");
        } catch (marketplaceErr) {
          setError(`Failed to load NFTs: ${errorMsg}`);
        }
      } else {
        setError(`Failed to load NFTs: ${errorMsg}. Make sure you're on the correct network.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (tokenId, priceEth) => {
    try {
      await marketplaceApi.buyMarketItem(tokenId, priceEth);
      alert("Purchase successful! Refreshing listings...");
      loadNFTs(); // Reload after purchase
    } catch (err) {
      console.error("Buy failed:", err);
      alert("Purchase failed. Check console for details.");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading NFTs from marketplace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <Button btnName="Retry" handleClick={loadNFTs} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Explore Marketplace</h1>
        <p>Discover NFTs from OpenSea and your marketplace</p>
        <div className={styles.toggleButtons}>
          <button 
            className={showType === "opensea" ? styles.activeTab : styles.tab}
            onClick={() => setShowType("opensea")}
          >
            OpenSea NFTs
          </button>
          <button 
            className={showType === "marketplace" ? styles.activeTab : styles.tab}
            onClick={() => setShowType("marketplace")}
          >
            My Marketplace
          </button>
        </div>
        <Button btnName="Refresh" handleClick={loadNFTs} />
      </div>

      {nfts.length === 0 ? (
        <div className={styles.empty}>
          <p>No NFTs listed yet.</p>
          <Link href="/">
            <Button btnName="Go Home" />
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {nfts.map((nft) => (
            <div key={nft.tokenId} className={styles.nftCard}>
              <div className={styles.nftImage}>
                {nft.imageUrl ? (
                  <img 
                    src={nft.imageUrl} 
                    alt={nft.name || `NFT #${nft.tokenId}`}
                    className={styles.nftImageElement}
                    onError={(e) => {
                      // If image fails to load, show placeholder
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div className={styles.placeholder} style={{ display: nft.imageUrl ? 'none' : 'flex' }}>
                  {nft.imageUrl ? null : `NFT #${nft.tokenId}`}
                </div>
              </div>
              <div className={styles.nftInfo}>
                <h3>{nft.name || `Token #${nft.tokenId}`}</h3>
                {nft.description && (
                  <p className={styles.description}>{nft.description.substring(0, 100)}...</p>
                )}
                {nft.priceEth !== null && (
                  <p className={styles.price}>
                    {nft.priceEth.toFixed(4)} ETH
                  </p>
                )}
                {nft.seller && (
                  <p className={styles.seller}>
                    Seller: {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
                  </p>
                )}
                {nft.external ? (
                  <a 
                    href={`https://opensea.io/assets/ethereum/${nft.contractAddress}/${nft.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.viewButton}
                  >
                    View on OpenSea
                  </a>
                ) : (
                  <Button
                    btnName="Buy Now"
                    handleClick={() => handleBuy(nft.tokenId, nft.priceEth)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;

