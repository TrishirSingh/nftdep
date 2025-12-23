// OpenSea API integration to fetch real NFTs
const OPENSEA_API_KEY = process.env.NEXT_PUBLIC_OPENSEA_API_KEY || "";
const OPENSEA_API_URL = "https://api.opensea.io/api/v2";

// Fetch NFTs from OpenSea (public listings)
export const openseaApi = {
  // Fetch NFTs by collection (popular collections)
  async fetchNFTsByCollection(collectionSlug = "boredapeyachtclub", limit = 50) {
    try {
      // OpenSea API v2 allows up to 50 NFTs per request
      const maxLimit = Math.min(limit, 50);
      // Try the collection endpoint - if it fails, we'll catch and return empty
      const url = `${OPENSEA_API_URL}/collection/${collectionSlug}/nfts?limit=${maxLimit}`;
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
        if (response.status === 404) {
          // Collection doesn't exist or slug is wrong - return empty array instead of throwing
          console.warn(`Collection "${collectionSlug}" not found (404)`);
          return [];
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error("OpenSea API requires an API key. Please add NEXT_PUBLIC_OPENSEA_API_KEY to your .env.local file. Get one at: https://docs.opensea.io/reference/api-keys");
        }
        if (response.status === 429) {
          throw new Error("OpenSea API rate limit exceeded. Please add an API key to increase limits.");
        }
        // For other errors, return empty array instead of throwing
        console.warn(`OpenSea API error for ${collectionSlug}: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      
      if (data.nfts && data.nfts.length > 0) {
        return data.nfts.map((nft) => ({
          tokenId: nft.identifier || nft.token_id,
          name: nft.name || `${collectionSlug} #${nft.identifier || nft.token_id}`,
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
      console.error(`Error fetching NFTs from ${collectionSlug}:`, error);
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
  async fetchPopularNFTs(limit = 50) {
    // Using verified collection slugs from OpenSea
    const collections = [
      "boredapeyachtclub",           // Bored Ape Yacht Club
      "azuki",                        // Azuki
      "doodles-official",             // Doodles
      "clone-x",                      // Clone X
      "mutant-ape-yacht-club",        // Mutant Ape Yacht Club
      "pudgypenguins",                // Pudgy Penguins
      "cool-cats-nft",                // Cool Cats
      "world-of-women-nft",           // World of Women
      "cryptoadz-by-gremplin",        // Cryptoadz
      "bored-ape-kennel-club",        // BAKC
    ];

    try {
      const allNFTs = [];
      const nftsPerCollection = Math.ceil(limit / collections.length);
      
      // Fetch from all collections in parallel for faster loading
      const promises = collections.map(async (collection) => {
        try {
          const nfts = await this.fetchNFTsByCollection(collection, nftsPerCollection);
          console.log(`✅ Fetched ${nfts.length} NFTs from ${collection}`);
          return nfts;
        } catch (err) {
          // Silently skip collections that don't exist or fail
          console.warn(`⚠️ Skipped ${collection}: ${err.message}`);
          return [];
        }
      });
      
      const results = await Promise.all(promises);
      
      // Combine all NFTs
      results.forEach((nfts) => {
        allNFTs.push(...nfts);
      });
      
      // Shuffle and return up to limit
      const shuffled = allNFTs.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit);
    } catch (error) {
      console.error("Error fetching popular NFTs:", error);
      throw error;
    }
  },
};

