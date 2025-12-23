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
      return res.status(403).json({ error: 'Only the seller can expire this auction' });
    }

    // Can only expire ended auctions (waiting for payment)
    if (auction.status !== 'ended') {
      return res.status(400).json({ 
        error: `Cannot expire auction with status: ${auction.status}. Only 'ended' auctions can be expired.` 
      });
    }

    // Mark as expired - allows re-auctioning
    await bidsCollection.updateOne(
      { _id: new ObjectId(auctionId) },
      { 
        $set: { 
          status: 'expired',
          expiredAt: new Date(),
        } 
      }
    );

    return res.status(200).json({
      message: 'Auction marked as expired. You can now create a new auction for this NFT.',
      tokenId: auction.tokenId,
      auction: {
        ...auction,
        status: 'expired',
        _id: auction._id.toString(),
      },
    });
  } catch (error) {
    console.error('Expire auction error:', error);
    return res.status(500).json({
      error: 'Failed to expire auction. Please try again later.',
    });
  }
}

