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

    const { tokenId, buyerWallet, price, transactionHash, sellerWallet, timestamp } = req.body;

    // Validate inputs
    if (!tokenId || !buyerWallet) {
      return res.status(400).json({ 
        error: 'Missing required fields: tokenId and buyerWallet are required' 
      });
    }

    if (!buyerWallet.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const tokenOwnershipCollection = await getTokenOwnershipCollection();

    // Find the token
    const token = await tokenOwnershipCollection.findOne({
      tokenId: parseInt(tokenId),
    });

    if (!token) {
      // If token doesn't exist in DB, create it (might be from external source)
      await tokenOwnershipCollection.insertOne({
        tokenId: parseInt(tokenId),
        ownerEmail: session.user.email,
        ownerWallet: buyerWallet.toLowerCase(),
        price: price || null,
        status: 'owned',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // Update ownership - transfer from previous owner to buyer
      await tokenOwnershipCollection.updateOne(
        { tokenId: parseInt(tokenId) },
        {
          $set: {
            ownerEmail: session.user.email,
            ownerWallet: buyerWallet.toLowerCase(),
            price: price || token.price,
            status: 'owned',
            previousOwner: sellerWallet || token.ownerWallet,
            previousOwnerEmail: token.ownerEmail,
            soldAt: timestamp ? new Date(parseInt(timestamp) * 1000) : new Date(),
            transactionHash: transactionHash || token.transactionHash,
            updatedAt: new Date(),
          },
          $push: {
            ownershipHistory: {
              ownerEmail: token.ownerEmail,
              ownerWallet: token.ownerWallet,
              transferredAt: new Date(),
              transferredTo: buyerWallet.toLowerCase(),
              transactionHash: transactionHash || null,
            },
          },
        }
      );
    }

    return res.status(200).json({
      message: 'Token ownership updated successfully',
      tokenId: parseInt(tokenId),
      newOwner: buyerWallet.toLowerCase(),
    });
  } catch (error) {
    console.error('Track token purchase error:', error);
    return res.status(500).json({
      error: 'Failed to track token purchase. Please try again later.',
    });
  }
}

