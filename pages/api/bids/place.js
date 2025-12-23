import { getBidsCollection } from '../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }

    let { auctionId, bidAmount, bidderWallet } = req.body;
    
    // Log incoming request for debugging
    console.log('Place bid request:', {
      auctionId,
      bidAmount,
      bidderWallet: bidderWallet ? `${bidderWallet.substring(0, 10)}...` : 'missing',
      email: session?.user?.email,
    });

    // Validate inputs
    if (!auctionId || !bidAmount) {
      return res.status(400).json({ 
        error: 'Missing required fields: auctionId and bidAmount are required' 
      });
    }

    // Validate wallet address
    if (!bidderWallet || typeof bidderWallet !== 'string') {
      return res.status(400).json({ 
        error: 'Wallet address is required. Please connect your wallet.' 
      });
    }
    
    // Normalize wallet address (remove whitespace, convert to lowercase)
    const normalizedBidderWallet = bidderWallet.trim().toLowerCase();
    
    if (!normalizedBidderWallet.startsWith('0x') || normalizedBidderWallet.length !== 42) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format. Please connect a valid wallet.' 
      });
    }
    
    // Use normalized wallet for all comparisons
    bidderWallet = normalizedBidderWallet;

    const bidAmountNum = parseFloat(bidAmount);
    if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
      return res.status(400).json({ error: 'Bid amount must be a positive number' });
    }

    const bidsCollection = await getBidsCollection();

    // Find the auction
    let auction;
    try {
      auction = await bidsCollection.findOne({ _id: new ObjectId(auctionId) });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid auction ID' });
    }
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Check if auction is still active
    if (auction.status !== 'active') {
      return res.status(400).json({ error: 'This auction is no longer active' });
    }

    // Check if auction has ended
    const now = new Date();
    if (new Date(auction.endTime) < now) {
      // Mark auction as ended
      await bidsCollection.updateOne(
        { _id: new ObjectId(auctionId) },
        { $set: { status: 'ended' } }
      );
      return res.status(400).json({ error: 'This auction has ended' });
    }

    // Check if user is the seller (by wallet address only, not email)
    // Same Gmail account can bid with different wallet addresses
    // Only block if the bidder wallet EXACTLY matches the seller wallet
    // bidderWallet is already normalized at this point
    const sellerWalletNormalized = auction.sellerWallet ? auction.sellerWallet.toLowerCase().trim() : null;
    
    if (sellerWalletNormalized && sellerWalletNormalized === bidderWallet) {
      console.log('Bid blocked: Seller and bidder have same wallet address', {
        sellerWallet: sellerWalletNormalized,
        bidderWallet: bidderWallet,
      });
      return res.status(400).json({ 
        error: 'You cannot bid on your own auction with the same wallet address. Please use a different wallet to bid.' 
      });
    }
    
    // Allow same email to bid multiple times with different wallets
    // No email-based restriction - only wallet address matters
    // If seller and bidder have different wallets, allow the bid
    console.log('Bid validation passed - different wallets:', {
      sellerWallet: sellerWalletNormalized,
      bidderWallet: bidderWallet,
      areDifferent: sellerWalletNormalized !== bidderWallet,
    });

    // Check if bid is higher than current bid
    if (bidAmountNum <= auction.currentBid) {
      return res.status(400).json({ 
        error: `Your bid must be higher than the current bid of ${auction.currentBid} ETH` 
      });
    }

    // Add bid to bids array
    // Note: Same Gmail account can bid multiple times with different wallet addresses
    // Each bid is tracked by wallet address, not email
    // bidderWallet is already normalized at this point
    const newBid = {
      bidder: session.user.email, // Keep email for reference only
      bidderWallet: bidderWallet, // Already normalized - primary identifier - unique per bid
      amount: bidAmountNum,
      timestamp: new Date(),
    };

    // Update auction with new highest bid
    // Wallet address is the primary identifier, email is just for reference
    await bidsCollection.updateOne(
      { _id: new ObjectId(auctionId) },
      {
        $set: {
          currentBid: bidAmountNum,
          highestBidder: session.user.email, // For reference
          highestBidderWallet: bidderWallet, // Already normalized - primary - determines winner
        },
        $push: { bids: newBid },
      }
    );

    return res.status(200).json({
      message: 'Bid placed successfully!',
      bid: newBid,
      currentBid: bidAmountNum,
    });
  } catch (error) {
    console.error('Place bid error:', error);
    return res.status(500).json({
      error: 'Failed to place bid. Please try again later.',
    });
  }
}

