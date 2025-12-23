import { getBidsCollection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sellerWallet } = req.query;

    if (!sellerWallet || !sellerWallet.startsWith('0x')) {
      return res.status(400).json({ error: 'Valid sellerWallet is required' });
    }

    const bidsCollection = await getBidsCollection();

    // Find completed auctions where payment was received but NFT might not be transferred
    const pendingTransfers = await bidsCollection.find({
      sellerWallet: sellerWallet.toLowerCase(),
      status: 'completed',
      // Optionally check if nftTransferred is false or doesn't exist
      $or: [
        { nftTransferred: { $exists: false } },
        { nftTransferred: false }
      ]
    }).toArray();

    return res.status(200).json({
      pendingTransfers: pendingTransfers.map(auction => ({
        ...auction,
        _id: auction._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Get pending transfers error:', error);
    return res.status(500).json({
      error: 'Failed to fetch pending transfers.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

