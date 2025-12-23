import { BrowserProvider, JsonRpcProvider, Contract, parseEther } from "ethers";
import nftMarketplaceAbi from "../contracts/NFTMarketplaceABI.json";

// Deployed NFTMarketplace contract address
export const NFT_MARKETPLACE_ADDRESS =
  process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS ||
  "0xc7AB404632F9a5E1ef3432DA69C33B10Ad651158";

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

// Helper function to parse tokenURI and extract image
const parseTokenURI = async (tokenURI) => {
  if (!tokenURI) {
    return { imageUrl: null, name: null, description: null };
  }

  // If it's a direct image data URI, use it
  if (tokenURI.startsWith("data:image")) {
    return { imageUrl: tokenURI, name: null, description: null };
  }

  // If it's a base64-encoded JSON metadata URI
  if (tokenURI.startsWith("data:application/json;base64,")) {
    try {
      // Extract base64 part after the comma
      const base64Data = tokenURI.split(",")[1];
      // Decode base64 to JSON string
      const jsonString = atob(base64Data);
      // Parse JSON
      const metadata = JSON.parse(jsonString);
      
      // Extract image, name, and description
      let imageUrl = metadata.image || metadata.imageUrl || null;
      const name = metadata.name || null;
      const description = metadata.description || null;
      
      // If image is also a base64 data URI, use it directly
      // If it's IPFS, convert to gateway URL
      if (imageUrl && imageUrl.startsWith("ipfs://")) {
        imageUrl = `https://ipfs.io/ipfs/${imageUrl.replace("ipfs://", "")}`;
      }
      
      return { imageUrl, name, description };
    } catch (err) {
      console.error("Failed to parse base64 JSON metadata:", err);
      return { imageUrl: null, name: null, description: null };
    }
  }

  // If it's a regular URL (HTTP/HTTPS/IPFS), try to fetch metadata
  if (tokenURI.startsWith("http://") || tokenURI.startsWith("https://") || tokenURI.startsWith("ipfs://")) {
    try {
      const metadataUrl = tokenURI.startsWith("ipfs://") 
        ? `https://ipfs.io/ipfs/${tokenURI.replace("ipfs://", "")}`
        : tokenURI;
      const response = await fetch(metadataUrl);
      if (response.ok) {
        const metadata = await response.json();
        let imageUrl = metadata.image || metadata.imageUrl || null;
        // Handle IPFS image URLs
        if (imageUrl && imageUrl.startsWith("ipfs://")) {
          imageUrl = `https://ipfs.io/ipfs/${imageUrl.replace("ipfs://", "")}`;
        }
        return {
          imageUrl: imageUrl || tokenURI,
          name: metadata.name || null,
          description: metadata.description || null,
        };
      } else {
        // If metadata fetch fails, try using tokenURI as image directly
        return { imageUrl: tokenURI, name: null, description: null };
      }
    } catch (err) {
      // If fetch fails, use tokenURI as image
      return { imageUrl: tokenURI, name: null, description: null };
    }
  }

  // Assume it's a direct image URL
  return { imageUrl: tokenURI, name: null, description: null };
};

// High-level helpers aligned with your deployed contract
export const marketplaceApi = {
  // Check if NFT is already listed on marketplace (owned by contract)
  async isNFTListed(tokenId) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask.");
    }
    const provider = new BrowserProvider(window.ethereum);
    const readContract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, provider);
    
    try {
      const tokenOwner = await readContract.getTokenOwner(tokenId);
      const contractAddress = NFT_MARKETPLACE_ADDRESS.toLowerCase();
      return tokenOwner.toLowerCase() === contractAddress;
    } catch (err) {
      console.warn("Could not check if NFT is listed:", err);
      return false;
    }
  },

  // Check if NFT can be resold (has been sold before)
  async canResellNFT(tokenId) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask.");
    }
    const provider = new BrowserProvider(window.ethereum);
    const readContract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, provider);
    
    try {
      const tokenInfo = await readContract.getTokenInfo(tokenId);
      const itemSold = tokenInfo[4]; // sold status is 5th return value
      return itemSold === true; // Can only resell if it was sold before
    } catch (err) {
      console.warn("Could not check if NFT can be resold:", err);
      return false;
    }
  },

  // Get the actual ERC721 owner of the NFT (not just MarketItem.owner)
  async getActualNFTOwner(tokenId) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask.");
    }
    const provider = new BrowserProvider(window.ethereum);
    const readContract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, provider);
    
    try {
      const owner = await readContract.ownerOf(tokenId);
      return owner.toLowerCase();
    } catch (err) {
      console.warn("Could not get actual NFT owner:", err);
      return null;
    }
  },

  // Transfer NFT from seller to buyer (requires seller to sign or have approved contract)
  async transferNFTDirect(tokenId, fromAddress, toAddress) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask.");
    }
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, signer);
    
    try {
      // Check if current signer is the owner
      const currentAddress = await signer.getAddress();
      const actualOwner = await contract.ownerOf(tokenId);
      
      if (actualOwner.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error(
          `NFT #${tokenId} is not owned by ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}. ` +
          `Current owner: ${actualOwner.slice(0, 6)}...${actualOwner.slice(-4)}`
        );
      }
      
      // If current signer is the owner, transfer directly
      if (currentAddress.toLowerCase() === fromAddress.toLowerCase()) {
        console.log(`Transferring NFT #${tokenId} from ${fromAddress} to ${toAddress}...`);
        const tx = await contract.safeTransferFrom(fromAddress, toAddress, tokenId);
        console.log("Transfer transaction sent, waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("NFT transferred successfully! Transaction hash:", receipt.hash);
        return receipt;
      } else {
        // Current signer is not the owner - check if contract is approved
        const isApproved = await contract.isApprovedForAll(fromAddress, currentAddress);
        if (isApproved) {
          console.log(`Transferring NFT #${tokenId} on behalf of owner...`);
          const tx = await contract.safeTransferFrom(fromAddress, toAddress, tokenId);
          const receipt = await tx.wait();
          console.log("NFT transferred successfully! Transaction hash:", receipt.hash);
          return receipt;
        } else {
          throw new Error(
            `Cannot transfer NFT: You are not the owner and the contract is not approved. ` +
            `The owner (${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}) needs to transfer the NFT manually.`
          );
        }
      }
    } catch (err) {
      console.error("Transfer NFT error:", err);
      throw err;
    }
  },

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
              const parsed = await parseTokenURI(tokenURI);
              imageUrl = parsed.imageUrl;
              name = parsed.name || name;
              description = parsed.description || description;
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
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask to buy NFTs.");
    }
    
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = await getWriteContract();
    
    try {
      const tx = await contract.createMarketSale(tokenId, {
        value: parseEther(String(priceEth)),
      });
      
      console.log("Purchase transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("Purchase successful! NFT transferred.");
      
      // Extract purchase details from MarketItemSold event
      let purchaseDetails = { tokenId, price: priceEth };
      if (receipt.logs && receipt.logs.length > 0) {
        const eventInterface = contract.interface;
        for (const log of receipt.logs) {
          try {
            const parsedLog = eventInterface.parseLog(log);
            if (parsedLog && parsedLog.name === 'MarketItemSold') {
              purchaseDetails = {
                tokenId: parsedLog.args.tokenId?.toString() || tokenId,
                price: parsedLog.args.price ? (Number(parsedLog.args.price) / 1e18).toString() : priceEth,
                seller: parsedLog.args.seller,
                buyer: parsedLog.args.buyer,
                timestamp: parsedLog.args.timestamp?.toString(),
              };
              console.log("Purchase details from MarketItemSold event:", purchaseDetails);
              break;
            }
          } catch (e) {
            // Not this event, continue
          }
        }
      }
      
      // Track token purchase in MongoDB
      try {
        const buyerAddress = await signer.getAddress();
        const response = await fetch('/api/tokens/track-purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenId: parseInt(purchaseDetails.tokenId || tokenId),
            buyerWallet: purchaseDetails.buyer || buyerAddress,
            price: purchaseDetails.price || priceEth,
            transactionHash: receipt.hash,
            sellerWallet: purchaseDetails.seller,
            timestamp: purchaseDetails.timestamp,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.warn("Failed to track token purchase:", error);
        } else {
          console.log("Token ownership updated in MongoDB");
        }
      } catch (err) {
        console.warn("Failed to track token purchase in MongoDB:", err);
        // Don't fail the transaction if MongoDB tracking fails
      }
      
      return receipt;
    } catch (error) {
      console.error("Purchase error:", error);
      if (error.reason) {
        throw new Error(`Contract error: ${error.reason}`);
      }
      throw error;
    }
  },

  // Complete auction purchase - transfer NFT and deduct payment from highest bidder
  // Complete auction purchase with direct transfer (NFT owned by seller, not contract)
  async completeAuctionPurchaseDirect(tokenId, bidAmountEth, sellerWallet, buyerWallet) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask to complete the purchase.");
    }
    
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, signer);
    
    try {
      // Verify buyer is the one making the transaction
      const buyerAddress = await signer.getAddress();
      if (buyerAddress.toLowerCase() !== buyerWallet.toLowerCase()) {
        throw new Error("Connected wallet does not match buyer wallet.");
      }
      
      // Check if NFT is owned by seller (not contract)
      const actualOwner = await contract.ownerOf(tokenId);
      if (actualOwner.toLowerCase() !== sellerWallet.toLowerCase()) {
        throw new Error(
          `NFT #${tokenId} is not owned by the seller (${sellerWallet.slice(0, 6)}...${sellerWallet.slice(-4)}). ` +
          `Current owner: ${actualOwner.slice(0, 6)}...${actualOwner.slice(-4)}`
        );
      }
      
      // Step 1: Buyer sends payment to seller
      console.log(`Sending ${bidAmountEth} ETH to seller ${sellerWallet}...`);
      const paymentTx = await signer.sendTransaction({
        to: sellerWallet,
        value: parseEther(String(bidAmountEth)),
      });
      console.log("Payment transaction sent, waiting for confirmation...");
      const paymentReceipt = await paymentTx.wait();
      console.log("Payment confirmed! Transaction hash:", paymentReceipt.hash);
      
      // Step 2: Seller needs to transfer NFT to buyer
      // For now, we'll use the contract's transferFrom (requires seller to approve first)
      // Or we can use safeTransferFrom if seller has approved the contract
      // Actually, the best approach is to have the seller do this manually or via a separate function
      
      // Check if contract is approved to transfer on behalf of seller
      const isApproved = await contract.isApprovedForAll(sellerWallet, NFT_MARKETPLACE_ADDRESS);
      
      if (!isApproved) {
        // Contract is not approved, seller needs to transfer manually
        // Return payment receipt and instructions
        return {
          paymentReceipt,
          requiresManualTransfer: true,
          sellerWallet,
          buyerWallet,
          tokenId,
          message: "Payment sent successfully. The seller needs to transfer the NFT to you manually.",
        };
      }
      
      // If approved, we could transfer here, but it's safer to have seller do it
      // Return payment receipt
      return {
        paymentReceipt,
        requiresManualTransfer: true,
        sellerWallet,
        buyerWallet,
        tokenId,
        message: "Payment sent successfully. Please contact the seller to complete the NFT transfer.",
      };
    } catch (error) {
      console.error("Direct auction purchase error:", error);
      throw error;
    }
  },

  async completeAuctionPurchase(tokenId, bidAmountEth) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask to complete the purchase.");
    }
    
    const provider = new BrowserProvider(window.ethereum);
    const contract = await getWriteContract();
    
    try {
      // First, fetch the actual item info from the contract to validate
      const readContract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, provider);
      
      // Check if token exists
      const tokenExists = await readContract.tokenExists(tokenId);
      if (!tokenExists) {
        throw new Error(`Token #${tokenId} does not exist on the contract.`);
      }
      
      // Get token info to check price and status
      let itemPrice, itemSold, itemSeller, tokenOwner;
      try {
        const tokenInfo = await readContract.getTokenInfo(tokenId);
        itemPrice = tokenInfo[3]; // price is 4th return value (0-indexed: tokenId, seller, owner, price, sold, tokenURI)
        itemSold = tokenInfo[4];
        itemSeller = tokenInfo[1];
        tokenOwner = tokenInfo[2]; // owner is 3rd return value
      } catch (err) {
        console.warn("Could not fetch token info, trying alternative methods:", err);
        
        // Try to get token owner directly
        try {
          tokenOwner = await readContract.getTokenOwner(tokenId);
          console.log(`Token #${tokenId} owner: ${tokenOwner}`);
        } catch (ownerErr) {
          console.error("Could not get token owner:", ownerErr);
        }
        
        // Try to find in market items
        try {
          const marketItems = await readContract.fetchMarketItems();
          const item = marketItems.find(i => Number(i.tokenId) === Number(tokenId));
          if (item) {
            itemPrice = item.price;
            itemSold = item.sold;
            itemSeller = item.seller;
            console.log(`Found token #${tokenId} in marketplace listing`);
          }
        } catch (marketErr) {
          console.warn("Could not fetch market items:", marketErr);
        }
      }
      
      // Check if token is owned by the contract (available for sale)
      const contractAddress = NFT_MARKETPLACE_ADDRESS.toLowerCase();
      const isOwnedByContract = tokenOwner && tokenOwner.toLowerCase() === contractAddress;
      
      // If NFT is not owned by contract, it can't be purchased
      if (tokenOwner && !isOwnedByContract) {
        throw new Error(
          `Token #${tokenId} is not available for purchase. ` +
          `It is currently owned by ${tokenOwner.slice(0, 6)}...${tokenOwner.slice(-4)} ` +
          `and not listed on the marketplace.`
        );
      }
      
      // Validate item is available
      if (itemSold) {
        throw new Error(`Token #${tokenId} has already been sold.`);
      }
      
      // For auction purchases, if NFT is owned by contract but not listed (no price or seller),
      // we can still proceed using the bid amount as the price
      // The contract will handle the purchase if the NFT is owned by the contract
      if ((!itemPrice || itemPrice.toString() === "0" || !itemSeller || itemSeller === "0x0000000000000000000000000000000000000000") && isOwnedByContract) {
        // NFT is owned by contract but not properly listed in marketplace
        // This can happen if NFT was created but never listed, or listing was removed
        // For auction completion, we'll use the bid amount as price
        console.warn(
          `Token #${tokenId} is owned by contract but not listed in marketplace. ` +
          `Using bid amount (${bidAmountEth} ETH) as purchase price. ` +
          `The contract should allow purchase if NFT is owned by contract.`
        );
        // Continue - we'll use bid amount as price below
      } else if (!isOwnedByContract) {
        // NFT is not owned by contract and not listed - can't purchase
        throw new Error(
          `Token #${tokenId} is not listed for sale on the marketplace.\n\n` +
          `The NFT is currently owned by ${tokenOwner?.slice(0, 6)}...${tokenOwner?.slice(-4)} ` +
          `and needs to be listed on the marketplace before purchase.\n\n` +
          `Please contact the seller to list this NFT, or ensure the auction was created correctly.`
        );
      }
      
      // Convert prices to compare
      const itemPriceEth = Number(itemPrice) / 1e18;
      const bidAmountEthNum = parseFloat(bidAmountEth);
      
      console.log("Price validation:", {
        itemPriceWei: itemPrice.toString(),
        itemPriceEth: itemPriceEth,
        bidAmountEth: bidAmountEthNum,
        match: itemPriceEth === bidAmountEthNum,
      });
      
      // The contract requires exact match: msg.value == item.price
      // For auction purchases, if itemPrice is not set or is 0, use bid amount
      // Otherwise, use the contract's item.price
      let contractPriceWei;
      if (!itemPrice || itemPrice.toString() === "0") {
        // NFT not listed - use bid amount (but this might fail if contract requires listing)
        console.warn(`Token #${tokenId} price not found in contract, using bid amount: ${bidAmountEth} ETH`);
        contractPriceWei = parseEther(String(bidAmountEth));
      } else {
        // Use contract price
        contractPriceWei = itemPrice;
      }
      
      // Convert to BigInt for exact matching
      let contractPriceBigInt;
      if (typeof contractPriceWei === 'bigint') {
        contractPriceBigInt = contractPriceWei;
      } else if (contractPriceWei.toString) {
        contractPriceBigInt = BigInt(contractPriceWei.toString());
      } else {
        contractPriceBigInt = BigInt(contractPriceWei);
      }
      
      // Warn if bid amount doesn't match contract price
      if (Math.abs(itemPriceEth - bidAmountEthNum) > 0.0001) {
        console.warn(
          `⚠️ Bid amount (${bidAmountEthNum} ETH) doesn't match contract price (${itemPriceEth} ETH). ` +
          `Using contract price (${itemPriceEth} ETH) for transaction.`
        );
      }
      
      // Check balance
      const signer = await contract.runner;
      const signerAddress = await signer.getAddress();
      const balance = await provider.getBalance(signerAddress);
      
      if (balance < contractPriceBigInt) {
        throw new Error(
          `Insufficient balance. You need ${itemPriceEth.toFixed(6)} ETH but have ${(Number(balance) / 1e18).toFixed(6)} ETH.`
        );
      }
      
      // Call createMarketSale with the contract's exact price
      const tx = await contract.createMarketSale(tokenId, {
        value: contractPriceBigInt, // Use exact contract price
      });
      
      console.log("Auction completion transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("Auction completed successfully! NFT transferred and payment deducted.");
      return receipt;
    } catch (error) {
      console.error("Auction completion error:", error);
      
      // Provide detailed error diagnostics
      if (error.reason) {
        throw new Error(`Contract error: ${error.reason}`);
      }
      
      // Enhanced error message for "missing revert data"
      if (error.message && error.message.includes("missing revert data")) {
        throw new Error(
          `Transaction failed: The contract rejected the purchase.\n\n` +
          `Possible reasons:\n` +
          `1. Token #${tokenId} is already sold\n` +
          `2. Token #${tokenId} is not listed for sale on the marketplace\n` +
          `3. Price mismatch (contract requires exact price match)\n` +
          `4. Token does not exist\n\n` +
          `For auction purchases, the NFT must be listed on the marketplace.\n` +
          `Please contact the seller to list the NFT, or try again after the seller lists it.`
        );
      }
      
      // Check if error is about item not for sale
      if (error.message && (error.message.includes("not listed") || error.message.includes("not for sale"))) {
        throw new Error(
          `Token #${tokenId} is not listed for sale on the marketplace.\n\n` +
          `To complete this auction purchase, the NFT must be listed on the marketplace first.\n\n` +
          `The seller needs to:\n` +
          `1. Go to "My NFTs" page\n` +
          `2. Use the "Resell" button to list the NFT with price: ${bidAmountEth} ETH\n` +
          `3. Then you can complete the purchase\n\n` +
          `Alternatively, contact the seller to list the NFT.`
        );
      }
      
      throw error;
    }
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
      console.log("Listing price type:", typeof listingPrice, listingPrice.constructor?.name);
      
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
    
    // Convert listing price to BigInt for exact matching
    // ethers.js v6 returns BigNumber, we need to convert to BigInt for value
    let listingPriceBigInt;
    if (typeof listingPrice === 'bigint') {
      listingPriceBigInt = listingPrice;
    } else if (listingPrice.toString) {
      // It's a BigNumber or similar - convert to string then BigInt
      listingPriceBigInt = BigInt(listingPrice.toString());
    } else {
      listingPriceBigInt = BigInt(listingPrice);
    }
    
    const listingPriceWei = listingPriceBigInt.toString();
    console.log("Using listing price:", listingPriceWei, "wei", listingPriceWei === "0" ? "(no fee)" : `(${Number(listingPriceWei) / 1e18} ETH)`);
    
    // Convert price to wei - ensure it's a valid number
    const priceWei = parseEther(String(priceEth));
    
    // Validate tokenURI length (Solidity strings have practical limits)
    // Base64 data URIs can be very long, so we limit to ~8000 chars to be safe
    // This allows for ~6KB of base64 image data (which is ~4.5KB actual image)
    const maxURILength = 8000;
    if (tokenURI.length > maxURILength) {
      const sizeKB = (tokenURI.length * 3) / 4 / 1024; // Approximate size in KB
      throw new Error(
        `Token URI is too long (${tokenURI.length} characters, ~${sizeKB.toFixed(1)} KB).\n\n` +
        `Maximum recommended: ${maxURILength} characters (~6 KB image).\n\n` +
        `Solutions:\n` +
        `1. Use a smaller image (max 1024x1024 pixels recommended)\n` +
        `2. Use a lower quality image\n` +
        `3. Use an external URL instead of uploading (enter a token URI directly)\n` +
        `4. The image will be automatically compressed, but it may still be too large.`
      );
    }
    
    console.log("Creating NFT with:", {
      tokenURI: tokenURI.substring(0, 50) + (tokenURI.length > 50 ? "..." : ""),
      tokenURILength: tokenURI.length,
      priceEth: priceEth,
      priceWei: priceWei.toString(),
      listingPriceWei: listingPriceWei,
      listingPriceEth: Number(listingPriceWei) / 1e18,
    });
    
    // Check if user has enough balance for listing fee + gas
    const signerAddress = await signer.getAddress();
    const balance = await provider.getBalance(signerAddress);
    const requiredBalance = listingPriceBigInt + BigInt(500000) * BigInt(20000000000); // listing fee + estimated gas
    
    if (balance < requiredBalance) {
      throw new Error(
        `Insufficient balance. You need at least ${(Number(requiredBalance) / 1e18).toFixed(6)} ETH ` +
        `(Listing fee: ${Number(listingPriceWei) / 1e18} ETH + gas fees). ` +
        `Your balance: ${(Number(balance) / 1e18).toFixed(6)} ETH`
      );
    }
    
    try {
      // Call createToken with exact listing price as value
      // The value must match listingPrice exactly (as required by the contract)
      // Use BigInt to ensure exact match
      const tx = await contract.createToken(tokenURI, priceWei, {
        value: listingPriceBigInt, // Must match contract's listingPrice exactly
      });
      
      console.log("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("NFT created successfully!");
      
      // Extract tokenId from transaction receipt events
      let tokenId = null;
      try {
        // Parse MarketItemCreated event from transaction logs
        if (receipt.logs && receipt.logs.length > 0) {
          const eventInterface = contract.interface;
          for (const log of receipt.logs) {
            try {
              const parsedLog = eventInterface.parseLog(log);
              if (parsedLog && parsedLog.name === 'MarketItemCreated') {
                tokenId = parsedLog.args.tokenId?.toString();
                console.log("TokenId extracted from MarketItemCreated event:", tokenId);
                // Also log tokenURI if available
                if (parsedLog.args.tokenURI) {
                  console.log("TokenURI from event:", parsedLog.args.tokenURI);
                }
                break;
              }
            } catch (e) {
              // Not this event, continue
            }
          }
        }
        
        // Fallback: Query contract for the latest tokenId
        if (!tokenId) {
          console.log("TokenId not found in events, querying contract...");
          // Get all market items and find the latest one for this seller
          const signerAddress = await signer.getAddress();
          const provider = new BrowserProvider(window.ethereum);
          const readContract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, provider);
          const allItems = await readContract.fetchItemsCreated();
          // Find the most recent item by this seller
          const sellerItems = allItems.filter(item => 
            item.seller.toLowerCase() === signerAddress.toLowerCase()
          );
          if (sellerItems.length > 0) {
            // Get the highest tokenId (most recent)
            tokenId = sellerItems.reduce((max, item) => 
              item.tokenId > max ? item.tokenId : max, sellerItems[0].tokenId
            ).toString();
            console.log("TokenId found from contract query:", tokenId);
          }
        }
      } catch (err) {
        console.warn("Could not extract tokenId from receipt:", err);
      }
      
      // Track token creation in MongoDB
      try {
        const signerAddress = await signer.getAddress();
        const response = await fetch('/api/tokens/track-creation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenId: tokenId,
            ownerWallet: signerAddress,
            tokenURI: tokenURI,
            price: priceEth,
            transactionHash: receipt.hash,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.warn("Failed to track token creation:", error);
        } else {
          console.log("Token ownership tracked in MongoDB");
        }
      } catch (err) {
        console.warn("Failed to track token creation in MongoDB:", err);
        // Don't fail the transaction if MongoDB tracking fails
      }
      
      return { ...receipt, tokenId };
    } catch (error) {
      console.error("Transaction error:", error);
      console.error("Error details:", {
        message: error.message,
        reason: error.reason,
        code: error.code,
        data: error.data,
        listingPriceSent: listingPriceWei,
        priceSent: priceWei.toString(),
        tokenURILength: tokenURI.length,
      });
      
      // Check for specific revert reasons
      if (error.message && (error.message.includes("missing revert data") || error.message.includes("estimateGas"))) {
        // Get the actual listing price from contract to compare
        let actualListingPrice;
        try {
          const readContract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, provider);
          actualListingPrice = await readContract.getListingPrice();
          console.error("Actual listing price from contract:", actualListingPrice.toString(), "wei");
          console.error("Sent listing price:", listingPriceWei, "wei");
          console.error("Match:", actualListingPrice.toString() === listingPriceWei);
        } catch (e) {
          console.error("Could not fetch listing price for comparison:", e);
        }
        
        const errorMsg = 
          `Transaction failed during gas estimation. Common causes:\n\n` +
          `1. Listing Fee Mismatch:\n` +
          `   - Contract expects: ${actualListingPrice ? (Number(actualListingPrice) / 1e18).toFixed(6) : '?'} ETH (${actualListingPrice ? actualListingPrice.toString() : '?'} wei)\n` +
          `   - We're sending: ${(Number(listingPriceWei) / 1e18).toFixed(6)} ETH (${listingPriceWei} wei)\n` +
          `   - Match: ${actualListingPrice ? (actualListingPrice.toString() === listingPriceWei ? '✓' : '✗ MISMATCH') : 'Unknown'}\n\n` +
          `2. Price Validation:\n` +
          `   - Your price: ${priceEth} ETH (${priceWei.toString()} wei)\n` +
          `   - Must be > 0: ${parseFloat(priceEth) > 0 ? '✓' : '✗'}\n\n` +
          `3. TokenURI Length:\n` +
          `   - Length: ${tokenURI.length} characters\n` +
          `   - Status: ${tokenURI.length > 10000 ? '✗ TOO LONG (max ~10000)' : '✓ OK'}\n\n` +
          `4. Balance Check:\n` +
          `   - Your balance: ${(Number(balance) / 1e18).toFixed(6)} ETH\n` +
          `   - Required: ${(Number(requiredBalance) / 1e18).toFixed(6)} ETH\n` +
          `   - Status: ${balance >= requiredBalance ? '✓' : '✗ INSUFFICIENT'}\n\n` +
          `Please check the console for detailed logs and try again.`;
        
        throw new Error(errorMsg);
      }
      
      if (error.reason) {
        throw new Error(`Contract error: ${error.reason}`);
      }
      
      if (error.data && error.data.message) {
        throw new Error(`Transaction failed: ${error.data.message}`);
      }
      
      // Generic error with helpful context
      throw new Error(
        `Failed to create NFT: ${error.message || 'Unknown error'}\n\n` +
        `Please check:\n` +
        `- You're on the correct network\n` +
        `- Your wallet is connected\n` +
        `- You have enough ETH for listing fee (${(Number(listingPriceWei) / 1e18).toFixed(6)} ETH) + gas\n` +
        `- The listing price matches the contract (${(Number(listingPriceWei) / 1e18).toFixed(6)} ETH)`
      );
    }
  },

  // Fetch NFTs owned by the connected wallet
  async fetchMyNFTs() {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask to view your NFTs.");
    }
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const contract = new Contract(NFT_MARKETPLACE_ADDRESS, nftMarketplaceAbi, signer);
    
    // Get NFTs from marketplace (MarketItem.owner)
    const marketplaceItems = await contract.fetchMyNFTs();
    
    // Also check all tokens to find NFTs owned via direct transfer
    // Get total token count and check ownership of each
    let allOwnedTokens = [];
    try {
      // Get all market items to find total token count
      const allMarketItems = await contract.fetchMarketItems();
      const totalTokens = allMarketItems.length > 0 
        ? Math.max(...allMarketItems.map(item => Number(item.tokenId))) 
        : 0;
      
      // Also check items created to get a better count
      try {
        const createdItems = await contract.fetchItemsCreated();
        const maxCreated = createdItems.length > 0
          ? Math.max(...createdItems.map(item => Number(item.tokenId)))
          : 0;
        
        // Get user's balance to estimate how many tokens to check
        const userBalance = await contract.balanceOf(userAddress);
        const balanceNum = Number(userBalance);
        
        // Check up to max of: 100, totalTokens, maxCreated, or balance * 2 (to account for transfers)
        const totalTokensEstimate = Math.max(
          totalTokens, 
          maxCreated, 
          balanceNum * 3, // Check more tokens if user has many
          100 // Minimum check
        );
        
        console.log(`Checking ownership for tokens 1-${totalTokensEstimate} (user balance: ${balanceNum})`);
        
        // Check ownership of tokens 1 to totalTokensEstimate
        const ownershipChecks = [];
        for (let i = 1; i <= totalTokensEstimate; i++) {
          ownershipChecks.push(
            contract.ownerOf(i).then(owner => ({
              tokenId: i,
              owner: owner.toLowerCase(),
            })).catch(() => null) // Token doesn't exist
          );
        }
        
        const ownershipResults = await Promise.all(ownershipChecks);
        const directlyOwned = ownershipResults
          .filter(result => result && result.owner === userAddress.toLowerCase())
          .map(result => result.tokenId);
        
        // Combine marketplace items and directly owned tokens
        const marketplaceTokenIds = new Set(marketplaceItems.map(item => Number(item.tokenId)));
        const newOwnedTokens = directlyOwned.filter(id => !marketplaceTokenIds.has(id));
        
        // Fetch info for directly owned tokens
        const directOwnedItems = await Promise.all(
          newOwnedTokens.map(async (tokenId) => {
            try {
              const tokenURI = await contract.tokenURI(tokenId);
              let imageUrl = null;
              let name = `Token #${tokenId}`;
              let description = "";
              
              if (tokenURI) {
                const parsed = await parseTokenURI(tokenURI);
                imageUrl = parsed.imageUrl;
                name = parsed.name || name;
                description = parsed.description || description;
              }
              
              return {
                tokenId: tokenId,
                seller: null,
                owner: userAddress,
                priceWei: "0",
                priceEth: 0,
                sold: true, // Directly owned, not for sale
                tokenURI: tokenURI,
                imageUrl: imageUrl,
                name: name,
                description: description,
              };
            } catch (err) {
              return null;
            }
          })
        );
        
        allOwnedTokens = directOwnedItems.filter(item => item !== null);
      } catch (err) {
        console.warn("Could not check direct ownership, using marketplace items only:", err);
      }
    } catch (err) {
      console.warn("Could not fetch all tokens, using marketplace items only:", err);
    }
    
    // Combine marketplace items and directly owned tokens
    const allItems = [...marketplaceItems, ...allOwnedTokens];
    
    // Fetch tokenURI for each NFT
    const nftsWithMetadata = await Promise.all(
      allItems.map(async (item) => {
        try {
          const tokenURI = item.tokenURI || await contract.tokenURI(item.tokenId);
          let imageUrl = null;
          let name = `Token #${item.tokenId}`;
          let description = "";
          
          // Try to fetch and parse metadata
          if (tokenURI) {
            const parsed = await parseTokenURI(tokenURI);
            imageUrl = parsed.imageUrl;
            name = parsed.name || name;
            description = parsed.description || description;
          }
          
          return {
            tokenId: Number(item.tokenId),
            seller: item.seller,
            owner: item.owner,
            priceWei: item.priceWei || item.price?.toString() || "0",
            priceEth: item.priceEth || (item.price ? Number(item.price) / 1e18 : 0),
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
            priceWei: item.priceWei || item.price?.toString() || "0",
            priceEth: item.priceEth || (item.price ? Number(item.price) / 1e18 : 0),
            sold: item.sold,
            tokenURI: null,
            imageUrl: null,
            name: `Token #${item.tokenId}`,
            description: "",
          };
        }
      })
    );
    
    // Remove duplicates (same tokenId)
    const uniqueNFTs = nftsWithMetadata.reduce((acc, nft) => {
      if (!acc.find(item => item.tokenId === nft.tokenId)) {
        acc.push(nft);
      }
      return acc;
    }, []);
    
    return uniqueNFTs;
  },

  // Resell an NFT you own
  async resellToken(tokenId, priceEth) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please connect MetaMask to resell NFTs.");
    }
    
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = await getWriteContract();
    
    // Get listing price
    const listingPrice = await contract.getListingPrice();
    
    try {
      const tx = await contract.resellToken(tokenId, parseEther(String(priceEth)), {
        value: listingPrice,
      });
      
      console.log("Resell transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("NFT relisted successfully!");
      
      // Update token ownership in MongoDB (seller is relisting, so ownership transfers to marketplace)
      try {
        const sellerAddress = await signer.getAddress();
        const response = await fetch('/api/tokens/track-creation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenId: parseInt(tokenId),
            ownerWallet: sellerAddress, // Original owner (seller)
            price: priceEth,
            status: 'listed', // Relisted on marketplace
            transactionHash: receipt.hash,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.warn("Failed to track token resell:", error);
        } else {
          console.log("Token relisting tracked in MongoDB");
        }
      } catch (err) {
        console.warn("Failed to track token resell in MongoDB:", err);
      }
      
      return receipt;
    } catch (error) {
      console.error("Resell error:", error);
      if (error.reason) {
        throw new Error(`Contract error: ${error.reason}`);
      }
      throw error;
    }
  },
};

