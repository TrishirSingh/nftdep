import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { marketplaceApi } from "../utils/contract";
import { openseaApi } from "../utils/opensea";
import Button from "../components/Button/Button";
import styles from "../styles/Search.module.css";

const Search = () => {
  const router = useRouter();
  const { q } = router.query; // Get search query from URL
  const [searchQuery, setSearchQuery] = useState(q || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState("all"); // "all", "opensea", "marketplace"

  useEffect(() => {
    if (q) {
      setSearchQuery(q);
      performSearch(q);
    }
  }, [q]);

  const performSearch = async (query) => {
    if (!query || query.trim() === "") {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchTerm = query.trim().toLowerCase();
      const allResults = [];

      // Search OpenSea NFTs
      if (searchType === "all" || searchType === "opensea") {
        try {
          const openseaNFTs = await openseaApi.fetchPopularNFTs(100);
          const filtered = openseaNFTs.filter((nft) => {
            const name = (nft.name || "").toLowerCase();
            const collection = (nft.collection || "").toLowerCase();
            const tokenId = String(nft.tokenId || "").toLowerCase();
            return (
              name.includes(searchTerm) ||
              collection.includes(searchTerm) ||
              tokenId.includes(searchTerm)
            );
          });
          allResults.push(...filtered.map((nft) => ({ ...nft, source: "opensea" })));
        } catch (err) {
          console.warn("OpenSea search failed:", err);
        }
      }

      // Search Marketplace NFTs
      if (searchType === "all" || searchType === "marketplace") {
        try {
          const marketplaceNFTs = await marketplaceApi.fetchMarketItems();
          const filtered = marketplaceNFTs.filter((nft) => {
            const name = (nft.name || "").toLowerCase();
            const tokenId = String(nft.tokenId || "").toLowerCase();
            return name.includes(searchTerm) || tokenId.includes(searchTerm);
          });
          allResults.push(...filtered.map((nft) => ({ ...nft, source: "marketplace" })));
        } catch (err) {
          console.warn("Marketplace search failed:", err);
        }
      }

      setResults(allResults);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      performSearch(searchQuery.trim());
    }
  };

  const handleBuy = async (tokenId, priceEth, source) => {
    if (source === "opensea") {
      // Open external link
      const nft = results.find((r) => r.tokenId === tokenId && r.source === "opensea");
      if (nft && nft.contractAddress) {
        window.open(
          `https://opensea.io/assets/ethereum/${nft.contractAddress}/${tokenId}`,
          "_blank"
        );
      }
    } else {
      // Buy from marketplace
      try {
        await marketplaceApi.buyMarketItem(tokenId, priceEth);
        alert("Purchase successful! Refreshing results...");
        performSearch(searchQuery);
      } catch (err) {
        console.error("Buy failed:", err);
        alert("Purchase failed. Check console for details.");
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Search NFTs</h1>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, collection, or token ID..."
            className={styles.searchInput}
          />
          <Button btnName="Search" handleClick={handleSearch} />
        </form>
        <div className={styles.filters}>
          <button
            className={searchType === "all" ? styles.activeFilter : styles.filter}
            onClick={() => setSearchType("all")}
          >
            All
          </button>
          <button
            className={searchType === "opensea" ? styles.activeFilter : styles.filter}
            onClick={() => {
              setSearchType("opensea");
              if (searchQuery) performSearch(searchQuery);
            }}
          >
            OpenSea
          </button>
          <button
            className={searchType === "marketplace" ? styles.activeFilter : styles.filter}
            onClick={() => {
              setSearchType("marketplace");
              if (searchQuery) performSearch(searchQuery);
            }}
          >
            Marketplace
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>Searching...</div>
      )}

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {!loading && !error && searchQuery && results.length === 0 && (
        <div className={styles.empty}>
          <p>No NFTs found for "{searchQuery}"</p>
          <p>Try searching for a collection name, NFT name, or token ID</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className={styles.resultsCount}>
            Found {results.length} result{results.length !== 1 ? "s" : ""} for "{searchQuery}"
          </div>
          <div className={styles.grid}>
            {results.map((nft, index) => (
              <div key={`${nft.source}-${nft.tokenId}-${index}`} className={styles.nftCard}>
                <div className={styles.nftImage}>
                  {nft.imageUrl ? (
                    <img
                      src={nft.imageUrl}
                      alt={nft.name || `NFT #${nft.tokenId}`}
                      className={styles.nftImageElement}
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={styles.placeholder}
                    style={{ display: nft.imageUrl ? "none" : "flex" }}
                  >
                    {nft.imageUrl ? null : `NFT #${nft.tokenId}`}
                  </div>
                </div>
                <div className={styles.nftInfo}>
                  <div className={styles.sourceBadge}>
                    {nft.source === "opensea" ? "OpenSea" : "Marketplace"}
                  </div>
                  <h3>{nft.name || `Token #${nft.tokenId}`}</h3>
                  {nft.description && (
                    <p className={styles.description}>
                      {nft.description.substring(0, 100)}...
                    </p>
                  )}
                  {nft.priceEth !== null && (
                    <p className={styles.price}>{nft.priceEth.toFixed(4)} ETH</p>
                  )}
                  {nft.source === "opensea" ? (
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
                      handleClick={() => handleBuy(nft.tokenId, nft.priceEth, nft.source)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!searchQuery && (
        <div className={styles.empty}>
          <p>Enter a search term to find NFTs</p>
          <p>You can search by:</p>
          <ul>
            <li>NFT name (e.g., "Bored Ape")</li>
            <li>Collection name (e.g., "azuki")</li>
            <li>Token ID (e.g., "1234")</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Search;

