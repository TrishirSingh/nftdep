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

    const { auctionId, buyerWallet } = req.body;

    if (!auctionId || !buyerWallet) {
      return res.status(400).json({ 
        error: 'Missing required fields: auctionId and buyerWallet are required' 
      });
    }

    if (!buyerWallet.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid wallet address' });
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

    // Check if auction has ended
    const now = new Date();
    if (new Date(auction.endTime) > now && auction.status === 'active') {
      return res.status(400).json({ 
        error: 'Auction has not ended yet' 
      });
    }

    // Check if already completed
    if (auction.status === 'completed') {
      return res.status(400).json({ error: 'This auction has already been completed' });
    }

    // Verify buyer is the highest bidder
    if (!auction.highestBidderWallet || 
        auction.highestBidderWallet.toLowerCase() !== buyerWallet.toLowerCase()) {
      return res.status(403).json({ 
        error: 'Only the highest bidder can complete this purchase' 
      });
    }

    // Mark as completed (payment will be handled by smart contract on frontend)
    await bidsCollection.updateOne(
      { _id: new ObjectId(auctionId) },
      { 
        $set: { 
          status: 'completed',
          completedAt: new Date(),
          completedBy: buyerWallet.toLowerCase(),
        } 
      }
    );

    return res.status(200).json({
      message: 'Auction marked as completed. Please complete the blockchain transaction to transfer funds.',
      requiresBlockchainTx: true,
      tokenId: auction.tokenId,
      bidAmount: auction.currentBid,
      sellerWallet: auction.sellerWallet,
      buyerWallet: buyerWallet,
      auction: {
        ...auction,
        status: 'completed',
        _id: auction._id.toString(),
      },
    });
  } catch (error) {
    console.error('Complete auction error:', error);
    return res.status(500).json({
      error: 'Failed to complete auction. Please try again later.',
    });
  }
}

