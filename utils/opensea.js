// OpenSea API integration to fetch real NFTs
const OPENSEA_API_KEY = process.env.NEXT_PUBLIC_OPENSEA_API_KEY || "";
const OPENSEA_API_URL = "https://api.opensea.io/api/v2";

// Fetch NFTs from OpenSea (public listings)
export const openseaApi = {
  // Fetch NFTs by collection (popular collections)
  async fetchNFTsByCollection(collectionSlug = "boredapeyachtclub", limit = 20) {
    try {
      const url = `${OPENSEA_API_URL}/collection/${collectionSlug}/nfts?limit=${limit}`;
      const headers = {
        "Accept": "application/json",
      };
      
      if (OPENSEA_API_KEY) {
        headers["X-API-KEY"] = OPENSEA_API_KEY;
      } else {
        console.warn("OpenSea API key not found. Some requests may be rate-limited. Get a free API key at: https://docs.opensea.io/reference/api-keys");
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("OpenSea API requires an API key. Please add NEXT_PUBLIC_OPENSEA_API_KEY to your .env.local file. Get one at: https://docs.opensea.io/reference/api-keys");
        }
        if (response.status === 429) {
          throw new Error("OpenSea API rate limit exceeded. Please add an API key to increase limits.");
        }
        throw new Error(`OpenSea API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.nfts) {
        return data.nfts.map((nft) => ({
          tokenId: nft.identifier || nft.token_id,
          name: nft.name || `#${nft.identifier || nft.token_id}`,
          description: nft.description || "",
          imageUrl: nft.image_url || nft.image || "",
          collection: nft.collection || collectionSlug,
          contractAddress: nft.contract || "",
          priceEth: null, // OpenSea API v2 doesn't include price in this endpoint
          seller: null,
          external: true, // Mark as external NFT
        }));
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching NFTs from OpenSea:", error);
      throw error;
    }
  },

  // Fetch trending NFTs
  async fetchTrendingNFTs(limit = 20) {
    try {
      // Use a popular collection as default
      return await this.fetchNFTsByCollection("boredapeyachtclub", limit);
    } catch (error) {
      console.error("Error fetching trending NFTs:", error);
      throw error;
    }
  },

  // Fetch NFTs from multiple popular collections
  async fetchPopularNFTs(limit = 20) {
    const collections = [
      "boredapeyachtclub",
      "cryptopunks",
      "azuki",
      "doodles-official",
      "clone-x",
    ];

    try {
      const allNFTs = [];
      
      for (const collection of collections.slice(0, 2)) {
        try {
          const nfts = await this.fetchNFTsByCollection(collection, Math.ceil(limit / 2));
          allNFTs.push(...nfts);
          if (allNFTs.length >= limit) break;
        } catch (err) {
          console.warn(`Failed to fetch from ${collection}:`, err);
        }
      }
      
      return allNFTs.slice(0, limit);
    } catch (error) {
      console.error("Error fetching popular NFTs:", error);
      throw error;
    }
  },
};

