import { BrowserProvider, JsonRpcProvider, Contract, parseEther } from "ethers";
import nftMarketplaceAbi from "../contracts/NFTMarketplaceABI.json";

// Deployed NFTMarketplace contract address
export const NFT_MARKETPLACE_ADDRESS =
  process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS ||
  "0xEb4eE0717F19c189172e0B1Eb91a3603e253d6ad";

// Read-only provider: uses a public RPC (e.g. Infura or Alchemy)
const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID";

export const readProvider = new JsonRpcProvider(rpcUrl);

export const getReadOnlyContract = () =>
  new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, readProvider);

export const getWriteContract = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No crypto wallet found. Please install MetaMask.");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, signer);
};

// High-level helpers aligned with your deployed contract
export const marketplaceApi = {
  // Read the listing fee in ETH
  async getListingPriceEth() {
    // Use MetaMask provider for reads (works without needing Infura)
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask to get listing price.");
    }
    const provider = new BrowserProvider(window.ethereum);
    const contract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, provider);
    const priceWei = await contract.getListingPrice();
    return Number(priceWei) / 1e18;
  },

  // Fetch all unsold NFTs currently listed on the marketplace
  async fetchMarketItems() {
    // Use MetaMask provider for reads (works without needing Infura)
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask to view NFTs.");
    }
    const provider = new BrowserProvider(window.ethereum);
    const contract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, provider);
    
    try {
      // Check if function exists by trying to call it
      const items = await contract.fetchMarketItems();
      
      // Fetch tokenURI and metadata for each NFT
      const nftsWithMetadata = await Promise.all(
        items.map(async (item) => {
          const tokenId = Number(item.tokenId);
          let tokenURI = null;
          let imageUrl = null;
          let name = `Token #${tokenId}`;
          let description = "";
          
          try {
            // Get tokenURI from contract
            tokenURI = await contract.tokenURI(tokenId);
            
            // Parse metadata if tokenURI exists
            if (tokenURI) {
              // If it's a data URL (base64), use it directly
              if (tokenURI.startsWith("data:image")) {
                imageUrl = tokenURI;
              }
              // If it's a URL, try to fetch metadata
              else if (tokenURI.startsWith("http://") || tokenURI.startsWith("https://") || tokenURI.startsWith("ipfs://")) {
                try {
                  const metadataUrl = tokenURI.startsWith("ipfs://") 
                    ? `https://ipfs.io/ipfs/${tokenURI.replace("ipfs://", "")}`
                    : tokenURI;
                  const response = await fetch(metadataUrl);
                  if (response.ok) {
                    const metadata = await response.json();
                    imageUrl = metadata.image || metadata.imageUrl || (metadata.image_url || null);
                    // Handle IPFS image URLs
                    if (imageUrl && imageUrl.startsWith("ipfs://")) {
                      imageUrl = `https://ipfs.io/ipfs/${imageUrl.replace("ipfs://", "")}`;
                    }
                    name = metadata.name || name;
                    description = metadata.description || "";
                  } else {
                    // If metadata fetch fails, try using tokenURI as image directly
                    imageUrl = tokenURI;
                  }
                } catch (err) {
                  // If fetch fails, use tokenURI as image
                  imageUrl = tokenURI;
                }
              } else {
                // Assume it's a direct image URL
                imageUrl = tokenURI;
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch metadata for token ${tokenId}:`, err);
          }
          
          return {
            tokenId: tokenId,
            seller: item.seller,
            owner: item.owner,
            priceWei: item.price.toString(),
            priceEth: Number(item.price) / 1e18,
            sold: item.sold,
            tokenURI: tokenURI,
            imageUrl: imageUrl,
            name: name,
            description: description,
          };
        })
      );
      
      return nftsWithMetadata;
    } catch (err) {
      // If fetchMarketItems doesn't exist, return empty array with helpful message
      if (err.message && err.message.includes("missing revert data")) {
        throw new Error("The deployed contract doesn't have fetchMarketItems. Please redeploy with the full contract version that includes this function.");
      }
      throw err;
    }
  },

  // Buy an NFT already listed on the marketplace
  async buyMarketItem(tokenId, priceEth) {
    const contract = await getWriteContract();
    const tx = await contract.createMarketSale(tokenId, {
      value: parseEther(String(priceEth)),
    });
    return tx.wait();
  },

  // Create (mint) a new NFT and list it for sale
  async createToken(tokenURI, priceEth) {
    // Basic validation
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask to create NFTs.");
    }

    if (!tokenURI || tokenURI.trim() === "") {
      throw new Error("Token URI cannot be empty");
    }
    
    if (!priceEth || parseFloat(priceEth) <= 0) {
      throw new Error("Price must be greater than 0");
    }

    // Get provider and signer
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, signer);
    
    // Get listing price - use provider (read-only, no signer needed for view functions)
    let listingPrice;
    try {
      // Use provider instead of signer for view functions (more reliable)
      const readContract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, provider);
      listingPrice = await readContract.getListingPrice();
      console.log("Listing price fetched:", listingPrice.toString(), "wei");
      
      // If it's zero, try with signer as fallback
      if (listingPrice.toString() === "0") {
        console.log("Listing price was 0, trying with signer...");
        listingPrice = await contract.getListingPrice();
        console.log("Listing price (with signer):", listingPrice.toString(), "wei");
      }
    } catch (err) {
      console.error("Error fetching listing price:", err);
      throw new Error(`Failed to fetch listing price: ${err.message}. Make sure you're on the correct network.`);
    }
    
    // Ensure listingPrice is valid
    if (!listingPrice) {
      throw new Error("Failed to fetch listing price from contract.");
    }
    
    const listingPriceWei = listingPrice.toString();
    console.log("Using listing price:", listingPriceWei, "wei", listingPriceWei === "0" ? "(no fee)" : `(${Number(listingPriceWei) / 1e18} ETH)`);
    
    // Convert price to wei - ensure it's a valid number
    const priceWei = parseEther(String(priceEth));
    
    console.log("Creating NFT with:", {
      tokenURI: tokenURI.substring(0, 50),
      priceEth: priceEth,
      priceWei: priceWei.toString(),
      listingPriceWei: listingPrice.toString(),
    });
    
    try {
      // Call createToken with exact listing price as value
      // The value must match listingPrice exactly (as required by createMarketItem)
      const tx = await contract.createToken(tokenURI, priceWei, {
        value: listingPrice, // Must match contract's listingPrice exactly
      });
      
      console.log("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("NFT created successfully!");
      return receipt;
    } catch (error) {
      console.error("Transaction error:", error);
      
      // Check for specific revert reasons
      if (error.message && error.message.includes("missing revert data")) {
        throw new Error(
          `Transaction reverted. This usually means:\n` +
          `1. msg.value (${listingPrice.toString()} wei) doesn't match listingPrice in contract\n` +
          `2. Price must be > 0 (you entered: ${priceEth} ETH)\n` +
          `3. Make sure you have enough ETH for listing fee + gas\n\n` +
          `Try refreshing the page and creating again.`
        );
      }
      
      if (error.reason) {
        throw new Error(`Contract error: ${error.reason}`);
      }
      
      throw error;
    }
  },

  // Fetch NFTs owned by the connected wallet
  async fetchMyNFTs() {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask to view your NFTs.");
    }
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, signer);
    const items = await contract.fetchMyNFTs();
    
    // Fetch tokenURI for each NFT
    const nftsWithMetadata = await Promise.all(
      items.map(async (item) => {
        try {
          const tokenURI = await contract.tokenURI(item.tokenId);
          let imageUrl = null;
          let name = `Token #${item.tokenId}`;
          let description = "";
          
          // Try to fetch and parse metadata
          if (tokenURI) {
            // If it's a data URL (base64), use it directly
            if (tokenURI.startsWith("data:image")) {
              imageUrl = tokenURI;
            }
            // If it's a URL, try to fetch metadata
            else if (tokenURI.startsWith("http://") || tokenURI.startsWith("https://") || tokenURI.startsWith("ipfs://")) {
              try {
                const metadataUrl = tokenURI.startsWith("ipfs://") 
                  ? `https://ipfs.io/ipfs/${tokenURI.replace("ipfs://", "")}`
                  : tokenURI;
                const response = await fetch(metadataUrl);
                if (response.ok) {
                  const metadata = await response.json();
                  imageUrl = metadata.image || metadata.imageUrl || tokenURI;
                  name = metadata.name || name;
                  description = metadata.description || "";
                } else {
                  // If metadata fetch fails, try using tokenURI as image directly
                  imageUrl = tokenURI;
                }
              } catch (err) {
                // If fetch fails, use tokenURI as image
                imageUrl = tokenURI;
              }
            } else {
              // Assume it's a direct image URL
              imageUrl = tokenURI;
            }
          }
          
          return {
            tokenId: Number(item.tokenId),
            seller: item.seller,
            owner: item.owner,
            priceWei: item.price.toString(),
            priceEth: Number(item.price) / 1e18,
            sold: item.sold,
            tokenURI: tokenURI,
            imageUrl: imageUrl,
            name: name,
            description: description,
          };
        } catch (err) {
          // If tokenURI fetch fails, return NFT without image
          return {
            tokenId: Number(item.tokenId),
            seller: item.seller,
            owner: item.owner,
            priceWei: item.price.toString(),
            priceEth: Number(item.price) / 1e18,
            sold: item.sold,
            tokenURI: null,
            imageUrl: null,
            name: `Token #${item.tokenId}`,
            description: "",
          };
        }
      })
    );
    
    return nftsWithMetadata;
  },

  // Resell an NFT you own
  async resellToken(tokenId, priceEth) {
    const contract = await getWriteContract();
    const listingPrice = await contract.getListingPrice();
    const tx = await contract.resellToken(tokenId, parseEther(String(priceEth)), {
      value: listingPrice,
    });
    return tx.wait();
  },
};

