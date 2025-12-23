import { getDb } from '../../../lib/db';

/**
 * API endpoint to clear all database collections
 * WARNING: This will delete ALL data from the database
 * 
 * Usage: POST /api/admin/clear-database
 * Headers: { "x-admin-secret": "YOUR_SECRET_KEY" }
 * 
 * Set ADMIN_SECRET in .env.local for security
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security check - require secret key
  const adminSecret = process.env.ADMIN_SECRET || 'dev-secret-change-in-production';
  const providedSecret = req.headers['x-admin-secret'] || req.body.secret;

  if (providedSecret !== adminSecret) {
    return res.status(401).json({ 
      error: 'Unauthorized. Provide x-admin-secret header or secret in body.' 
    });
  }

  try {
    const db = await getDb();
    
    // List of all collections to clear
    // NOTE: OpenSea NFTs are NOT stored in the database - they're fetched live from OpenSea API
    // This only clears marketplace data: users, bids, transactions, etc.
    const collectionsToClear = [
      'users',
      'accounts',
      'sessions',
      'verificationtokens',
      'wallets',
      'favorites', // Only clears favorite references, not the actual NFTs
      'transactions',
      'subscriptions',
      'bids', // Only marketplace auction bids
      'tokenOwnership' // Only marketplace NFT ownership tracking
    ];

    const results = {
      cleared: [],
      notFound: [],
      errors: []
    };

    // Clear each collection
    for (const collectionName of collectionsToClear) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          results.cleared.push({
            collection: collectionName,
            deletedCount: result.deletedCount
          });
        } else {
          results.notFound.push({
            collection: collectionName,
            message: 'Collection is already empty or does not exist'
          });
        }
      } catch (error) {
        results.errors.push({
          collection: collectionName,
          error: error.message
        });
      }
    }

    // Get final counts
    const finalCounts = {};
    for (const collectionName of collectionsToClear) {
      try {
        const collection = db.collection(collectionName);
        finalCounts[collectionName] = await collection.countDocuments();
      } catch (error) {
        finalCounts[collectionName] = 'error';
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Database cleared successfully. OpenSea NFTs are safe - they are fetched live and not stored in the database.',
      note: 'OpenSea NFTs are not affected - they are fetched directly from OpenSea API and not stored in MongoDB',
      results: {
        cleared: results.cleared,
        notFound: results.notFound,
        errors: results.errors
      },
      finalCounts: finalCounts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing database:', error);
    return res.status(500).json({
      error: 'Failed to clear database',
      message: error.message
    });
  }
}
