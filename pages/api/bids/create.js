import { getBidsCollection } from '../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }

    const { tokenId, basePrice, duration, sellerWallet } = req.body;

    // Validate inputs
    if (!tokenId || !basePrice || !duration) {
      return res.status(400).json({ 
        error: 'Missing required fields: tokenId, basePrice, and duration are required' 
      });
    }

    // Validate wallet address
    if (!sellerWallet || !sellerWallet.startsWith('0x')) {
      return res.status(400).json({ 
        error: 'Wallet address is required. Please connect your wallet.' 
      });
    }

    if (parseFloat(basePrice) <= 0) {
      return res.status(400).json({ error: 'Base price must be greater than 0' });
    }

    // Validate duration (in seconds)
    const durationSeconds = parseInt(duration);
    if (isNaN(durationSeconds) || durationSeconds <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive number' });
    }

    const bidsCollection = await getBidsCollection();

    // Check if there's already an active or ended auction for this token
    // Allow creating new auction if previous one expired or was completed
    const existingActiveBid = await bidsCollection.findOne({
      tokenId: parseInt(tokenId),
      status: { $in: ['active', 'ended'] }, // Block if active or waiting for payment
    });

    if (existingActiveBid) {
      // If it's ended (waiting for payment), don't allow new auction yet
      if (existingActiveBid.status === 'ended') {
        return res.status(400).json({ 
          error: 'An auction for this NFT is waiting for payment completion. Please wait or mark it as expired.' 
        });
      }
      // If it's active, block
      return res.status(400).json({ 
        error: 'An active auction already exists for this NFT' 
      });
    }
    
    // Expired or completed auctions are fine - can create new one

    // Calculate end time
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

    // Create auction
    const auction = {
      tokenId: parseInt(tokenId),
      seller: session.user.email, // Keep email for reference
      sellerWallet: sellerWallet.toLowerCase(), // Primary identifier
      basePrice: parseFloat(basePrice),
      currentBid: parseFloat(basePrice),
      highestBidder: null,
      highestBidderWallet: null,
      bids: [],
      startTime,
      endTime,
      duration: durationSeconds,
      status: 'active',
      createdAt: new Date(),
    };

    const result = await bidsCollection.insertOne(auction);

    return res.status(200).json({
      message: 'Auction created successfully!',
      auctionId: result.insertedId.toString(),
      auction: {
        ...auction,
        _id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error('Create auction error:', error);
    return res.status(500).json({
      error: 'Failed to create auction. Please try again later.',
    });
  }
}

