import { getBidsCollection, getUsersCollection } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test MongoDB connection by trying to access collections
    const connectionStatus = {
      connected: false,
      error: null,
      collections: {},
      timestamp: new Date().toISOString(),
    };

    try {
      // Test bids collection
      const bidsCollection = await getBidsCollection();
      const bidsCount = await bidsCollection.countDocuments();
      connectionStatus.collections.bids = {
        accessible: true,
        count: bidsCount,
      };
    } catch (bidsError) {
      connectionStatus.collections.bids = {
        accessible: false,
        error: bidsError.message,
      };
    }

    try {
      // Test users collection
      const usersCollection = await getUsersCollection();
      const usersCount = await usersCollection.countDocuments();
      connectionStatus.collections.users = {
        accessible: true,
        count: usersCount,
      };
    } catch (usersError) {
      connectionStatus.collections.users = {
        accessible: false,
        error: usersError.message,
      };
    }

    // If we can access at least one collection, connection is working
    if (connectionStatus.collections.bids?.accessible || connectionStatus.collections.users?.accessible) {
      connectionStatus.connected = true;
      return res.status(200).json({
        status: 'success',
        message: 'MongoDB is connected and working!',
        ...connectionStatus,
      });
    } else {
      // Both collections failed
      const firstError = connectionStatus.collections.bids?.error || connectionStatus.collections.users?.error || 'Unknown error';
      connectionStatus.error = firstError;
      return res.status(500).json({
        status: 'error',
        message: 'MongoDB connection failed',
        ...connectionStatus,
      });
    }
  } catch (error) {
    console.error('MongoDB test error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to test MongoDB connection',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

