import React, { useState, useEffect } from "react";
import Link from "next/link";
import { marketplaceApi } from "../utils/contract";
import Button from "../components/Button/Button";
import styles from "../styles/MyNFTs.module.css";

const MyNFTs = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reselling, setReselling] = useState({});

  useEffect(() => {
    loadMyNFTs();
  }, []);

  const loadMyNFTs = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await marketplaceApi.fetchMyNFTs();
      setNfts(items);
    } catch (err) {
      console.error("Failed to load NFTs:", err);
      setError(err.message || "Failed to load your NFTs. Make sure you're connected to the correct network.");
    } finally {
      setLoading(false);
    }
  };

  const handleResell = async (tokenId, newPrice) => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    try {
      setReselling({ ...reselling, [tokenId]: true });
      await marketplaceApi.resellToken(tokenId, newPrice);
      alert("NFT listed for sale successfully!");
      loadMyNFTs(); // Reload after reselling
    } catch (err) {
      console.error("Resell failed:", err);
      alert("Failed to resell NFT. Check console for details.");
    } finally {
      setReselling({ ...reselling, [tokenId]: false });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your NFTs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <Button btnName="Retry" handleClick={loadMyNFTs} />
        <Link href="/">
          <Button btnName="Go Home" />
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My NFTs</h1>
        <p>NFTs you currently own</p>
        <Button btnName="Refresh" handleClick={loadMyNFTs} />
      </div>

      {nfts.length === 0 ? (
        <div className={styles.empty}>
          <p>You don't own any NFTs yet.</p>
          <p>Buy from the marketplace!</p>
          <div className={styles.emptyActions}>
            <Link href="/explore">
              <Button btnName="Explore Marketplace" />
            </Link>
          </div>
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
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={styles.placeholder} style={{ display: nft.imageUrl ? 'none' : 'flex' }}>
                  {nft.imageUrl ? null : `NFT #${nft.tokenId}`}
                </div>
              </div>
              <div className={styles.nftInfo}>
                <h3>{nft.name || `Token #${nft.tokenId}`}</h3>
                <p className={styles.status}>
                  {nft.sold ? "Sold" : "Owned by you"}
                </p>
                <div className={styles.resellSection}>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="New price (ETH)"
                    className={styles.priceInput}
                    id={`price-${nft.tokenId}`}
                  />
                  <Button
                    btnName={reselling[nft.tokenId] ? "Listing..." : "Resell"}
                    handleClick={() => {
                      const input = document.getElementById(`price-${nft.tokenId}`);
                      handleResell(nft.tokenId, input?.value);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyNFTs;

