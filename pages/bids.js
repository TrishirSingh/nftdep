import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { BrowserProvider, parseEther } from 'ethers';
import Link from 'next/link';
import BidTimer from '../components/BidTimer/BidTimer';
import Button from '../components/Button/Button';
import { marketplaceApi } from '../utils/contract';
import styles from '../styles/Bids.module.css';

const Bids = () => {
  const { data: session, status } = useSession();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState({});
  const [completing, setCompleting] = useState({});
  const [bidAmounts, setBidAmounts] = useState({});
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    loadActiveAuctions();
    checkWalletConnection();
    const interval = setInterval(loadActiveAuctions, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

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

  const formatAddress = (addr) => {
    if (!addr) return "Not connected";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const loadActiveAuctions = async () => {
    try {
      setError(null);
      const response = await fetch('/api/bids/active');
      
      if (!response.ok) {
        // Try to parse error message
        let errorMessage = 'Failed to load auctions';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            console.error('API error details:', errorData.details);
          }
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Failed to load auctions: ${response.status} ${response.statusText}`;
        }
        setError(errorMessage);
        setAuctions([]);
        return;
      }
      
      const data = await response.json();
      setAuctions(data.auctions || []);
    } catch (err) {
      console.error('Failed to load auctions:', err);
      setError(
        err.message === 'Failed to fetch' 
          ? 'Cannot connect to server. Please make sure the server is running and MongoDB is connected.'
          : `Failed to load auctions: ${err.message}`
      );
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAuction = async (auction) => {
    if (!account) {
      alert('Please connect your MetaMask wallet to confirm payment');
      return;
    }

    if (auction.highestBidderWallet?.toLowerCase() !== account.toLowerCase()) {
      alert('Only the highest bidder can confirm payment for this auction');
      return;
    }

    // Show detailed confirmation with payment details
    const confirmed = window.confirm(
      `Confirm Payment via MetaMask?\n\n` +
      `NFT Token ID: #${auction.tokenId}\n` +
      `Payment Amount: ${auction.currentBid} ETH\n` +
      `Your Wallet: ${account.slice(0, 6)}...${account.slice(-4)}\n\n` +
      `Clicking OK will:\n` +
      `1. Open MetaMask for payment confirmation\n` +
      `2. Deduct ${auction.currentBid} ETH from your wallet\n` +
      `3. Transfer the NFT to your wallet\n\n` +
      `Do you want to proceed with the payment?`
    );

    if (!confirmed) return;

    try {
      setCompleting({ ...completing, [auction._id]: true });

      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to complete the payment.');
      }

      // Verify wallet connection
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const connectedAddress = await signer.getAddress();
      
      if (connectedAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error('Connected wallet does not match. Please connect the correct wallet.');
      }

      // Check balance before proceeding
      const balance = await provider.getBalance(connectedAddress);
      const requiredAmount = parseEther(String(auction.currentBid));
      
      if (balance < requiredAmount) {
        throw new Error(`Insufficient balance. You need ${auction.currentBid} ETH but have ${(Number(balance) / 1e18).toFixed(4)} ETH.`);
      }

      // Check if NFT is owned by seller (direct transfer) or contract (marketplace purchase)
      const actualOwner = await marketplaceApi.getActualNFTOwner(auction.tokenId);
      const isListed = await marketplaceApi.isNFTListed(auction.tokenId);
      const sellerWallet = auction.sellerWallet?.toLowerCase();
      const isOwnedBySeller = actualOwner && actualOwner.toLowerCase() === sellerWallet;
      
      console.log('Auction completion check:', {
        tokenId: auction.tokenId,
        actualOwner,
        isListed,
        sellerWallet,
        isOwnedBySeller,
      });

      // First, mark as completed in database
      const response = await fetch('/api/bids/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auctionId: auction._id,
          buyerWallet: account,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete auction');
      }

      let receipt;

      if (isOwnedBySeller && !isListed) {
        // NFT is owned by seller directly - use direct transfer
        console.log('Using direct transfer: NFT owned by seller');
        
        alert(
          `Direct Transfer Mode\n\n` +
          `NFT #${auction.tokenId} is owned by the seller.\n` +
          `You will:\n` +
          `1. Send ${auction.currentBid} ETH directly to the seller\n` +
          `2. The seller will transfer the NFT to you\n\n` +
          `Opening MetaMask to send payment...`
        );

        // Send payment directly to seller
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const paymentTx = await signer.sendTransaction({
          to: auction.sellerWallet,
          value: parseEther(String(auction.currentBid)),
        });
        
        console.log('Payment transaction sent, waiting for confirmation...');
        const paymentReceipt = await paymentTx.wait();
        console.log('Payment confirmed! Transaction hash:', paymentReceipt.hash);
        
        // Now automatically transfer NFT from seller to buyer
        try {
          console.log('Attempting to automatically transfer NFT to buyer...');
          
          // Try to transfer NFT - this will work if seller has approved the contract
          // or if we can get the seller to sign (which we can't from buyer's side)
          // For now, we'll attempt and show appropriate message
          
          // Check if we can transfer (seller would need to be connected or have approved)
          // Since buyer is connected, we can't transfer on seller's behalf unless approved
          const transferReceipt = await marketplaceApi.transferNFTDirect(
            auction.tokenId,
            auction.sellerWallet,
            account
          );
          
          receipt = {
            ...paymentReceipt,
            transferHash: transferReceipt.hash,
            bothCompleted: true,
          };
          
          alert(
            `✅ Payment & Transfer Complete!\n\n` +
            `Payment Hash: ${paymentReceipt.hash.slice(0, 10)}...${paymentReceipt.hash.slice(-8)}\n` +
            `Transfer Hash: ${transferReceipt.hash.slice(0, 10)}...${transferReceipt.hash.slice(-8)}\n` +
            `Amount: ${auction.currentBid} ETH sent to seller\n` +
            `NFT #${auction.tokenId} has been transferred to your wallet!\n\n` +
            `You can view your NFT in the "My NFTs" section.`
          );
        } catch (transferError) {
          console.warn('Automatic transfer failed:', transferError);
          
          // Payment succeeded but transfer failed - seller needs to transfer manually
          receipt = paymentReceipt;
          
          alert(
            `✅ Payment Sent!\n\n` +
            `Transaction Hash: ${paymentReceipt.hash.slice(0, 10)}...${paymentReceipt.hash.slice(-8)}\n` +
            `Amount: ${auction.currentBid} ETH sent to seller\n\n` +
            `⚠️ Automatic NFT transfer failed.\n\n` +
            `The seller (${auction.sellerWallet.slice(0, 6)}...${auction.sellerWallet.slice(-4)}) ` +
            `needs to transfer NFT #${auction.tokenId} to your wallet (${account.slice(0, 6)}...${account.slice(-4)}).\n\n` +
            `Please contact the seller to complete the NFT transfer.`
          );
        }
      } else if (isListed) {
        // NFT is listed on marketplace - use marketplace purchase
        console.log('Using marketplace purchase: NFT listed on marketplace');
        
        // Show MetaMask confirmation message
        alert(
          `Opening MetaMask for payment confirmation...\n\n` +
          `Please confirm the transaction in MetaMask to:\n` +
          `- Pay ${auction.currentBid} ETH\n` +
          `- Receive NFT #${auction.tokenId}`
        );

        // Execute blockchain transaction through MetaMask
        receipt = await marketplaceApi.completeAuctionPurchase(auction.tokenId, auction.currentBid);
        
        alert(
          `✅ Payment Confirmed!\n\n` +
          `Transaction Hash: ${receipt.hash.slice(0, 10)}...${receipt.hash.slice(-8)}\n` +
          `Amount Paid: ${auction.currentBid} ETH\n` +
          `NFT #${auction.tokenId} has been transferred to your wallet.\n\n` +
          `You can view your NFT in the "My NFTs" section.`
        );
      } else {
        // NFT is not listed and not owned by seller
        throw new Error(
          `NFT #${auction.tokenId} is not available for purchase.\n\n` +
          `The NFT is currently owned by ${actualOwner?.slice(0, 6)}...${actualOwner?.slice(-4)} ` +
          `and is not listed on the marketplace.\n\n` +
          `Please contact the seller to list the NFT or transfer it directly.`
        );
      }
      
      // Track the purchase in MongoDB
      try {
        await fetch('/api/tokens/track-purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenId: auction.tokenId,
            buyerWallet: account,
            price: auction.currentBid,
            transactionHash: receipt.hash,
            sellerWallet: auction.sellerWallet,
          }),
        });
      } catch (err) {
        console.warn("Failed to track auction purchase:", err);
      }
      
      loadActiveAuctions();
    } catch (error) {
      console.error('Complete auction error:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to complete purchase. ';
      if (error.message.includes('user rejected') || error.message.includes('User denied')) {
        errorMessage += 'You rejected the MetaMask transaction.';
      } else if (error.message.includes('insufficient funds') || error.message.includes('Insufficient')) {
        errorMessage += 'You do not have enough ETH in your wallet.';
      } else if (error.message.includes('MetaMask')) {
        errorMessage += error.message;
      } else {
        errorMessage += error.message || 'Please check your wallet and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setCompleting({ ...completing, [auction._id]: false });
    }
  };

  const handlePlaceBid = async (auctionId, currentBid) => {
    if (status !== 'authenticated') {
      alert('Please sign in to place a bid');
      return;
    }

    if (!account) {
      alert('Please connect your wallet to place a bid');
      return;
    }

    const bidAmount = bidAmounts[auctionId];
    if (!bidAmount || parseFloat(bidAmount) <= parseFloat(currentBid)) {
      alert(`Your bid must be higher than the current bid of ${currentBid} ETH`);
      return;
    }

    try {
      setBidding({ ...bidding, [auctionId]: true });
      const response = await fetch('/api/bids/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auctionId,
          bidAmount,
          bidderWallet: account,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bid');
      }

      alert('Bid placed successfully!');
      setBidAmounts({ ...bidAmounts, [auctionId]: '' });
      loadActiveAuctions();
    } catch (error) {
      console.error('Place bid error:', error);
      alert(error.message || 'Failed to place bid');
    } finally {
      setBidding({ ...bidding, [auctionId]: false });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading active auctions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <Button btnName="Retry" handleClick={loadActiveAuctions} />
        <Link href="/">
          <Button btnName="Go Home" />
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Active Auctions</h1>
        <p>Place your bids on NFTs</p>
        <Button btnName="Refresh" handleClick={loadActiveAuctions} />
      </div>

      {auctions.length === 0 ? (
        <div className={styles.empty}>
          <p>No active auctions at the moment.</p>
          <Link href="/mynfts">
            <Button btnName="Create Auction" />
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {auctions.map((auction) => (
            <div key={auction._id} className={styles.auctionCard}>
              <div className={styles.auctionHeader}>
                <h3>NFT #{auction.tokenId}</h3>
                <span className={`${styles.status} ${
                  auction.status === 'ended' ? styles.statusEnded : 
                  auction.status === 'completed' ? styles.statusCompleted : 
                  auction.status === 'expired' ? styles.statusExpired :
                  styles.statusActive
                }`}>
                  {auction.status === 'ended' ? 'Waiting for Payment' : 
                   auction.status === 'completed' ? 'Completed' : 
                   auction.status === 'expired' ? 'Expired' :
                   'Active'}
                </span>
              </div>

              <div className={styles.auctionInfo}>
                <div className={styles.priceBox}>
                  <span>Current Bid</span>
                  <p>{auction.currentBid} ETH</p>
                  <small>Base Price: {auction.basePrice} ETH</small>
                </div>

                <BidTimer
                  endTime={auction.endTime}
                  onEnd={() => loadActiveAuctions()}
                />
              </div>

              {auction.status === 'ended' && auction.highestBidderWallet && (
                // Show payment section for all ended auctions with bids
                // Auctions remain visible for 7 days to allow payment completion
                <div className={styles.completeSection}>
                  {auction.highestBidderWallet?.toLowerCase() === account?.toLowerCase() ? (
                    <div className={styles.completeBox}>
                      <div className={styles.winnerBadge}>🏆 You Won This Auction!</div>
                      <p className={styles.winnerMessage}>
                        Congratulations! You are the highest bidder. Please confirm your payment via MetaMask to complete the purchase.
                      </p>
                      <div className={styles.paymentDetails}>
                        <div className={styles.paymentRow}>
                          <span>NFT Token ID:</span>
                          <strong>#{auction.tokenId}</strong>
                        </div>
                        <div className={styles.paymentRow}>
                          <span>Payment Amount:</span>
                          <strong className={styles.amount}>{auction.currentBid} ETH</strong>
                        </div>
                        <div className={styles.paymentRow}>
                          <span>Your Wallet:</span>
                          <strong>{formatAddress(account)}</strong>
                        </div>
                      </div>
                      <div className={styles.metamaskNote}>
                        <strong>⚠️ Payment via MetaMask:</strong>
                        <p>Clicking the button below will open MetaMask for payment confirmation. The payment will be deducted from your connected wallet.</p>
                      </div>
                      <Button
                        btnName={completing[auction._id] ? 'Confirming in MetaMask...' : 'Confirm Payment via MetaMask'}
                        handleClick={() => handleCompleteAuction(auction)}
                        disabled={completing[auction._id] || !account}
                      />
                      {completing[auction._id] && (
                        <p className={styles.processingNote}>
                          Please confirm the transaction in your MetaMask popup...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className={styles.completeBox}>
                      <p>⏳ Waiting for highest bidder ({formatAddress(auction.highestBidderWallet)}) to confirm payment via MetaMask...</p>
                      <p className={styles.waitingNote}>The highest bidder needs to confirm the payment of {auction.currentBid} ETH to complete the purchase.</p>
                    </div>
                  )}
                </div>
              )}

              {auction.status === 'active' && (
                <div className={styles.bidSection}>
                  <div className={styles.bidInput}>
                    <input
                      type="number"
                      step="0.0001"
                      min={auction.currentBid}
                      placeholder={`Min: ${auction.currentBid} ETH`}
                      value={bidAmounts[auction._id] || ''}
                      onChange={(e) =>
                        setBidAmounts({
                          ...bidAmounts,
                          [auction._id]: e.target.value,
                        })
                      }
                    />
                    <Button
                      btnName={
                        bidding[auction._id]
                          ? 'Placing...'
                          : !account
                          ? 'Connect Wallet'
                          : status === 'authenticated'
                          ? 'Place Bid'
                          : 'Sign In to Bid'
                      }
                      handleClick={() => handlePlaceBid(auction._id, auction.currentBid)}
                    />
                  </div>
                </div>
              )}

              <div className={styles.auctionFooter}>
                <p>
                  <strong>Seller:</strong> {auction.sellerWallet ? formatAddress(auction.sellerWallet) : 'N/A'}
                </p>
                {auction.highestBidderWallet && (
                  <p>
                    <strong>Highest Bidder:</strong> {formatAddress(auction.highestBidderWallet)}
                  </p>
                )}
                <p>
                  <strong>Total Bids:</strong> {auction.bids?.length || 0}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bids;

