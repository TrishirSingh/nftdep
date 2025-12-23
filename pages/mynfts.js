import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrowserProvider } from "ethers";
import { marketplaceApi, NFT_MARKETPLACE_ADDRESS } from "../utils/contract";
import Button from "../components/Button/Button";
import BidModal from "../components/BidModal/BidModal";
import styles from "../styles/MyNFTs.module.css";

const MyNFTs = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reselling, setReselling] = useState({});
  const [bidModal, setBidModal] = useState({ isOpen: false, tokenId: null, nftName: null });
  const [account, setAccount] = useState(null);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [transferring, setTransferring] = useState({});

  useEffect(() => {
    loadMyNFTs();
    checkWalletConnection();
    loadPendingTransfers();
  }, [account]);

  const loadPendingTransfers = async () => {
    if (!account) return;
    
    try {
      const response = await fetch(`/api/bids/pending-transfers?sellerWallet=${account}`);
      const data = await response.json();
      if (response.ok) {
        // Filter to only show transfers where current account is the seller
        const filtered = (data.pendingTransfers || []).filter(auction => 
          auction.sellerWallet?.toLowerCase() === account.toLowerCase()
        );
        setPendingTransfers(filtered);
      }
    } catch (err) {
      console.error('Failed to load pending transfers:', err);
    }
  };

  const handleTransferNFT = async (auction) => {
    if (!account) {
      alert('Please connect your wallet to transfer the NFT.');
      return;
    }

    if (account.toLowerCase() !== auction.sellerWallet?.toLowerCase()) {
      alert('Only the seller can transfer this NFT.');
      return;
    }

    const confirmed = window.confirm(
      `Transfer NFT #${auction.tokenId} to buyer?\n\n` +
      `Buyer: ${auction.highestBidderWallet?.slice(0, 6)}...${auction.highestBidderWallet?.slice(-4)}\n` +
      `Amount Received: ${auction.currentBid} ETH\n\n` +
      `This will transfer the NFT from your wallet to the buyer's wallet.`
    );

    if (!confirmed) return;

    try {
      setTransferring({ ...transferring, [auction._id]: true });

      // Transfer NFT from seller to buyer
      const receipt = await marketplaceApi.transferNFTDirect(
        auction.tokenId,
        auction.sellerWallet,
        auction.highestBidderWallet
      );

      // Mark as transferred in database
      await fetch('/api/bids/transfer-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auctionId: auction._id,
          sellerWallet: auction.sellerWallet,
          buyerWallet: auction.highestBidderWallet,
          tokenId: auction.tokenId,
        }),
      });

      alert(
        `✅ NFT Transferred Successfully!\n\n` +
        `Transaction Hash: ${receipt.hash.slice(0, 10)}...${receipt.hash.slice(-8)}\n` +
        `NFT #${auction.tokenId} has been transferred to the buyer.\n\n` +
        `Buyer: ${auction.highestBidderWallet?.slice(0, 6)}...${auction.highestBidderWallet?.slice(-4)}`
      );

      // Reload pending transfers and NFTs
      await loadPendingTransfers();
      // Wait a bit for blockchain to update, then reload NFTs
      setTimeout(async () => {
        await loadMyNFTs();
        await loadPendingTransfers(); // Reload again to make sure pending list is updated
      }, 3000);
    } catch (err) {
      console.error('Transfer NFT error:', err);
      alert(`Failed to transfer NFT: ${err.message || 'Please check console for details.'}`);
    } finally {
      setTransferring({ ...transferring, [auction._id]: false });
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        }
      } catch (err) {
        console.error("Error checking wallet:", err);
      }
    }
  };

  const loadMyNFTs = async () => {
    if (!account) {
      setNfts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // fetchMyNFTs() now checks actual ERC721 ownership, so we can trust it
      const items = await marketplaceApi.fetchMyNFTs();
      
      // Double-check ownership for each NFT (safety check)
      const verifiedItems = await Promise.all(
        items.map(async (nft) => {
          try {
            const actualOwner = await marketplaceApi.getActualNFTOwner(nft.tokenId);
            const isOwnedByUser = actualOwner === account.toLowerCase();
            if (!isOwnedByUser) {
              console.log(`NFT #${nft.tokenId} is not owned by ${account} (owner: ${actualOwner}), skipping...`);
              return null;
            }
            return nft;
          } catch (err) {
            console.warn(`Could not verify ownership for NFT #${nft.tokenId}:`, err);
            // If verification fails, still show it (might be a temporary issue or token doesn't exist)
            // But only if it was returned by fetchMyNFTs (which should have checked ownership)
            return nft;
          }
        })
      );
      
      // Filter out nulls (NFTs not owned by user)
      const ownedNFTs = verifiedItems.filter(nft => nft !== null);
      console.log(`Loaded ${ownedNFTs.length} NFTs for account ${account}`);
      setNfts(ownedNFTs);
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

  const handleCreateAuction = async (tokenId, basePrice, duration) => {
    // Check if wallet is connected
    if (!account) {
      alert('Please connect your wallet first to create an auction.');
      return;
    }

    try {
      // First, check if the NFT is already listed on the marketplace
      // This is required for auction purchases to work
      console.log('Checking if NFT is listed on marketplace...');
      
      const isListed = await marketplaceApi.isNFTListed(tokenId);
      console.log(`NFT #${tokenId} is ${isListed ? 'already listed' : 'not listed'} on marketplace`);
      
      // Check actual NFT owner (ERC721 ownerOf) vs marketplace listing
      const actualOwner = await marketplaceApi.getActualNFTOwner(tokenId);
      const contractAddress = NFT_MARKETPLACE_ADDRESS.toLowerCase();
      
      const isActuallyOwnedByContract = actualOwner === contractAddress;
      const isActuallyOwnedByUser = actualOwner === account.toLowerCase();
      
      console.log(`NFT #${tokenId} ownership:`, {
        isListed,
        actualOwner,
        isActuallyOwnedByContract,
        isActuallyOwnedByUser,
        userAccount: account?.toLowerCase()
      });
      
      if (!isListed && !isActuallyOwnedByContract) {
        // NFT is owned by the user, check if it can be resold
        const canResell = await marketplaceApi.canResellNFT(tokenId);
        console.log(`NFT #${tokenId} can ${canResell ? '' : 'not '}be resold`);
        
        if (canResell) {
          // NFT was sold before, so we can resell it to list it
          try {
            await marketplaceApi.resellToken(tokenId, basePrice);
            console.log('NFT listed on marketplace successfully via resellToken');
          } catch (resellError) {
            console.error('Failed to resell NFT:', resellError);
            throw new Error(
              `Failed to list NFT on marketplace: ${resellError.message}\n\n` +
              `The NFT must be listed on the marketplace for auction purchases to work.`
            );
          }
        } else {
          // NFT was never sold, so it can't be resold
          // But if user actually owns it, they should be able to create an auction
          // The purchase will need to handle listing, but for now allow auction creation
          if (isActuallyOwnedByUser) {
            console.warn(
              `NFT #${tokenId} is owned by you but was never sold.\n` +
              `Auction will be created, but purchases may fail if NFT is not listed.\n` +
              `Consider listing it first if possible.`
            );
            // Allow auction creation - we'll handle listing during purchase if needed
          } else {
            throw new Error(
              `Cannot create auction: NFT #${tokenId} is not listed and you don't own it.\n\n` +
              `The NFT must be listed on the marketplace or owned by you to create an auction.`
            );
          }
        }
      } else if (isListed || isActuallyOwnedByContract) {
        console.log('NFT is already listed on marketplace, skipping resellToken');
      }

      console.log('Sending auction creation request:', {
        tokenId,
        basePrice,
        duration,
        sellerWallet: account,
      });

      const response = await fetch('/api/bids/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: parseInt(tokenId),
          basePrice: parseFloat(basePrice),
          duration: parseInt(duration),
          sellerWallet: account,
        }),
      });

      const data = await response.json();
      console.log('Auction creation response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create auction');
      }

      alert('Auction created successfully! Users can now bid on your NFT.\n\nThe NFT has been listed on the marketplace to enable purchases.');
      return data;
    } catch (error) {
      console.error('Create auction error:', error);
      throw error;
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
        <Button btnName="Refresh" handleClick={() => { loadMyNFTs(); loadPendingTransfers(); }} />
      </div>

      {pendingTransfers.length > 0 && (
        <div className={styles.pendingTransfers}>
          <h2>⚠️ Pending Transfers</h2>
          <p>You have received payment for these auctions. Please transfer the NFTs to complete the sale.</p>
          <div className={styles.pendingList}>
            {pendingTransfers.map((auction) => (
              <div key={auction._id} className={styles.pendingItem}>
                <div className={styles.pendingInfo}>
                  <p><strong>NFT #{auction.tokenId}</strong></p>
                  <p>Buyer: {auction.highestBidderWallet?.slice(0, 6)}...{auction.highestBidderWallet?.slice(-4)}</p>
                  <p>Amount Received: {auction.currentBid} ETH</p>
                </div>
                <Button
                  btnName={transferring[auction._id] ? "Transferring..." : "Transfer NFT"}
                  handleClick={() => handleTransferNFT(auction)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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
                <div className={styles.bidSection}>
                  <Button
                    btnName="Start Bidding"
                    handleClick={() => {
                      setBidModal({
                        isOpen: true,
                        tokenId: nft.tokenId,
                        nftName: nft.name || `Token #${nft.tokenId}`,
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BidModal
        isOpen={bidModal.isOpen}
        onClose={() => setBidModal({ isOpen: false, tokenId: null, nftName: null })}
        tokenId={bidModal.tokenId}
        nftName={bidModal.nftName}
        onCreateAuction={handleCreateAuction}
      />
    </div>
  );
};

export default MyNFTs;

