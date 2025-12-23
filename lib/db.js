import clientPromise from './mongodb';

// Helper function to get database instance with retry logic
async function getClientWithRetry(retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const client = await clientPromise;
      // Verify connection is alive
      await client.db().admin().ping();
      return client;
    } catch (error) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, error.message);
      if (i < retries) {
        console.log(`Retrying MongoDB connection... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      } else {
        throw new Error(`MongoDB connection failed after ${retries + 1} attempts: ${error.message}`);
      }
    }
  }
}

// Helper function to get database instance
export async function getDb() {
  const client = await getClientWithRetry();
  return client.db(process.env.MONGODB_DB_NAME || 'nft-marketplace');
}

// Helper function to get collections
export async function getUsersCollection() {
  const db = await getDb();
  return db.collection('users');
}

export async function getWalletsCollection() {
  const db = await getDb();
  return db.collection('wallets');
}

export async function getFavoritesCollection() {
  const db = await getDb();
  return db.collection('favorites');
}

export async function getTransactionsCollection() {
  const db = await getDb();
  return db.collection('transactions');
}

export async function getSubscriptionsCollection() {
  const db = await getDb();
  return db.collection('subscriptions');
}

export async function getBidsCollection() {
  const db = await getDb();
  return db.collection('bids');
}

export async function getTokenOwnershipCollection() {
  const db = await getDb();
  return db.collection('tokenOwnership');
}

