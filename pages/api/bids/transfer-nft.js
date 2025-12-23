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

    const { auctionId, sellerWallet, buyerWallet, tokenId } = req.body;

    if (!auctionId || !sellerWallet || !buyerWallet || !tokenId) {
      return res.status(400).json({ 
        error: 'Missing required fields: auctionId, sellerWallet, buyerWallet, and tokenId are required' 
      });
    }

    if (!sellerWallet.startsWith('0x') || !buyerWallet.startsWith('0x')) {
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

    // Verify seller
    if (auction.sellerWallet?.toLowerCase() !== sellerWallet.toLowerCase()) {
      return res.status(403).json({ error: 'Only the seller can transfer the NFT' });
    }

    // Verify auction is completed (payment received)
    if (auction.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Auction is not completed. Payment must be confirmed first.' 
      });
    }

    // Verify buyer matches
    if (auction.highestBidderWallet?.toLowerCase() !== buyerWallet.toLowerCase()) {
      return res.status(400).json({ 
        error: 'Buyer wallet does not match the highest bidder' 
      });
    }

    // Mark as transferred (optional - you can add a field to track this)
    await bidsCollection.updateOne(
      { _id: new ObjectId(auctionId) },
      { 
        $set: { 
          nftTransferred: true,
          transferredAt: new Date(),
        } 
      }
    );

    return res.status(200).json({
      message: 'NFT transfer confirmed. The seller should now transfer the NFT to the buyer.',
      auctionId: auctionId,
      sellerWallet: sellerWallet,
      buyerWallet: buyerWallet,
      tokenId: tokenId,
    });
  } catch (error) {
    console.error('Transfer NFT API error:', error);
    return res.status(500).json({
      error: 'Failed to process NFT transfer. Please try again later.',
    });
  }
}

