import { getBidsCollection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokenId } = req.query;
    
    // Try to get bids collection - this will fail if MongoDB is not connected
    let bidsCollection;
    try {
      bidsCollection = await getBidsCollection();
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError);
      return res.status(500).json({
        error: 'Database connection failed. Please check your MongoDB connection.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
      });
    }

    let query = { status: 'active' };
    if (tokenId) {
      query.tokenId = parseInt(tokenId);
    }

    // Also check for ended auctions that haven't been processed
    const now = new Date();
    const gracePeriodHours = 24; // Give 24 hours for highest bidder to complete purchase
    const gracePeriodMs = gracePeriodHours * 60 * 60 * 1000;
    
    try {
      // Mark auctions that have passed end time
      const expiredAuctions = await bidsCollection.find({
        status: 'active',
        endTime: { $lte: now },
      }).toArray();

      for (const auction of expiredAuctions) {
        // If no bids, mark as expired immediately (can be re-auctioned)
        if (!auction.highestBidderWallet || !auction.bids || auction.bids.length === 0) {
          await bidsCollection.updateOne(
            { _id: auction._id },
            { $set: { status: 'expired', endedAt: now } }
          );
        } else {
          // Has bids - mark as ended (waiting for payment)
          // But give only 1 hour grace period for payment, then auto-expire
          await bidsCollection.updateOne(
            { _id: auction._id },
            { $set: { status: 'ended', endedAt: now } }
          );
        }
      }

      // Auto-expire "ended" auctions after 7 days if payment not completed
      // This gives plenty of time for the highest bidder to complete payment
      // Only expire auctions that have no bids or where highest bidder hasn't paid
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000; // 7 days
      const oldEndedAuctions = await bidsCollection.find({
        status: 'ended',
        endedAt: { $exists: true, $lte: new Date(now.getTime() - sevenDaysMs) },
      }).toArray();

      if (oldEndedAuctions.length > 0) {
        // Only expire auctions that have been waiting for payment for 7+ days
        // This gives the highest bidder plenty of time to complete payment
        await bidsCollection.updateMany(
          { _id: { $in: oldEndedAuctions.map(a => a._id) } },
          { $set: { status: 'expired', expiredAt: now } }
        );
        console.log(`Auto-expired ${oldEndedAuctions.length} old unsold auctions (7+ days old)`);
      }

      // Get active auctions and all ended auctions (not expired)
      // Ended auctions remain visible until payment is completed or 7 days pass
      // This allows the highest bidder to complete payment
      const allAuctions = await bidsCollection.find({
        status: { $in: ['active', 'ended'] }, // Show all active and ended auctions
        ...(tokenId ? { tokenId: parseInt(tokenId) } : {}),
      }).toArray();

      return res.status(200).json({
        auctions: allAuctions.map(auction => ({
          ...auction,
          _id: auction._id.toString(),
        })),
      });
    } catch (queryError) {
      console.error('Database query error:', queryError);
      return res.status(500).json({
        error: 'Failed to query auctions from database.',
        details: process.env.NODE_ENV === 'development' ? queryError.message : undefined,
      });
    }
  } catch (error) {
    console.error('Get active bids error:', error);
    return res.status(500).json({
      error: 'Failed to fetch active auctions.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

