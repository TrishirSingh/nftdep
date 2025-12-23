import { getTokenOwnershipCollection } from '../../../lib/db';
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

    const { tokenId, ownerWallet, tokenURI, price } = req.body;

    // Validate inputs
    if (!tokenId || !ownerWallet) {
      return res.status(400).json({ 
        error: 'Missing required fields: tokenId and ownerWallet are required' 
      });
    }

    if (!ownerWallet.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const tokenOwnershipCollection = await getTokenOwnershipCollection();

    // Check if token already exists
    const existingToken = await tokenOwnershipCollection.findOne({
      tokenId: parseInt(tokenId),
    });

    if (existingToken) {
      // Update existing token ownership
      await tokenOwnershipCollection.updateOne(
        { tokenId: parseInt(tokenId) },
        {
          $set: {
            ownerEmail: session.user.email,
            ownerWallet: ownerWallet.toLowerCase(),
            tokenURI: tokenURI || existingToken.tokenURI,
            price: price || existingToken.price,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } else {
      // Create new token ownership record
      await tokenOwnershipCollection.insertOne({
        tokenId: parseInt(tokenId),
        ownerEmail: session.user.email,
        ownerWallet: ownerWallet.toLowerCase(),
        tokenURI: tokenURI || null,
        price: price || null,
        status: status || 'listed', // 'listed', 'owned', 'sold'
        transactionHash: transactionHash || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return res.status(200).json({
      message: 'Token ownership tracked successfully',
      tokenId: parseInt(tokenId),
    });
  } catch (error) {
    console.error('Track token creation error:', error);
    return res.status(500).json({
      error: 'Failed to track token creation. Please try again later.',
    });
  }
}

