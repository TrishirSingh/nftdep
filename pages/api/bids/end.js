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

    const { auctionId, sellerWallet } = req.body;

    if (!auctionId) {
      return res.status(400).json({ error: 'auctionId is required' });
    }

    if (!sellerWallet || !sellerWallet.startsWith('0x')) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const bidsCollection = await getBidsCollection();
    let auction;
    try {
      auction = await bidsCollection.findOne({ _id: new ObjectId(auctionId) });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid auction ID' });
    }

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Check if user is the seller (by wallet address)
    if (!auction.sellerWallet || auction.sellerWallet.toLowerCase() !== sellerWallet.toLowerCase()) {
      return res.status(403).json({ error: 'Only the seller can end this auction' });
    }

    // Check if auction has ended
    const now = new Date();
    if (new Date(auction.endTime) > now) {
      return res.status(400).json({ 
        error: 'Auction has not ended yet. Wait for the timer to expire.' 
      });
    }

    if (auction.status === 'completed') {
      return res.status(400).json({ error: 'This auction has already been completed' });
    }

    // Determine status based on whether there are bids
    // If no bids, mark as expired (can be re-auctioned immediately)
    // If has bids, mark as ended (waiting for payment)
    const hasBids = auction.highestBidderWallet && auction.bids && auction.bids.length > 0;
    const newStatus = hasBids ? 'ended' : 'expired';
    
    await bidsCollection.updateOne(
      { _id: new ObjectId(auctionId) },
      { 
        $set: { 
          status: newStatus,
          endedAt: new Date(),
        } 
      }
    );

    return res.status(200).json({
      message: hasBids
        ? `Auction ended! Highest bidder ${auction.highestBidderWallet} needs to complete the purchase. Payment of ${auction.currentBid} ETH will be deducted when they complete.`
        : 'Auction ended with no bids. You can create a new auction for this NFT.',
      requiresCompletion: hasBids,
      canReAuction: !hasBids, // Can immediately re-auction if no bids
      highestBidderWallet: auction.highestBidderWallet,
      bidAmount: auction.currentBid,
      tokenId: auction.tokenId,
      auction: {
        ...auction,
        status: newStatus,
        _id: auction._id.toString(),
      },
    });
  } catch (error) {
    console.error('End auction error:', error);
    return res.status(500).json({
      error: 'Failed to end auction. Please try again later.',
    });
  }
}

