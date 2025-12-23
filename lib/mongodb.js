import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  console.error('⚠️ MONGODB_URI not found in .env.local');
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;

// Enhanced connection options to prevent disconnections
const options = {
  // Connection pool settings
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  
  // Connection timeout settings
  connectTimeoutMS: 30000, // 30 seconds to establish connection
  socketTimeoutMS: 45000, // 45 seconds for socket operations
  
  // Retry settings
  retryWrites: true,
  retryReads: true,
  
  // Server selection settings
  serverSelectionTimeoutMS: 30000, // 30 seconds to select a server
  
  // Heartbeat settings (keep connection alive)
  heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
  
  // Compression
  compressors: ['zlib'],
};

let client;
let clientPromise;
let isConnecting = false;

// Function to create a new connection with retry logic
async function createConnection() {
  if (isConnecting) {
    // If already connecting, wait for existing connection
    return clientPromise;
  }

  isConnecting = true;
  
  try {
    client = new MongoClient(uri, options);
    
    // Add event listeners for connection monitoring
    client.on('connectionPoolCreated', () => {
      console.log('✅ MongoDB connection pool created');
    });
    
    client.on('connectionPoolClosed', () => {
      console.log('⚠️ MongoDB connection pool closed');
    });
    
    client.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error.message);
      isConnecting = false;
    });
    
    // Connect with retry logic
    const connectedClient = await client.connect();
    console.log('✅ MongoDB connected successfully');
    isConnecting = false;
    
    // Verify connection by pinging
    await connectedClient.db().admin().ping();
    
    return connectedClient;
  } catch (error) {
    isConnecting = false;
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Retry connection after 5 seconds
    console.log('🔄 Retrying MongoDB connection in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Retry once
    try {
      client = new MongoClient(uri, options);
      const retryClient = await client.connect();
      console.log('✅ MongoDB reconnected successfully');
      return retryClient;
    } catch (retryError) {
      console.error('❌ MongoDB reconnection failed:', retryError.message);
      throw retryError;
    }
  }
}

// Function to check if connection is alive
async function isConnectionAlive(client) {
  try {
    await client.db().admin().ping();
    return true;
  } catch (error) {
    return false;
  }
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createConnection();
  }
  
  // Add connection health check wrapper
  clientPromise = (async () => {
    try {
      const client = await global._mongoClientPromise;
      
      // Check if connection is still alive
      if (!(await isConnectionAlive(client))) {
        console.log('🔄 MongoDB connection lost, reconnecting...');
        global._mongoClientPromise = createConnection();
        return await global._mongoClientPromise;
      }
      
      return client;
    } catch (error) {
      console.error('❌ MongoDB connection check failed:', error.message);
      // Try to reconnect
      global._mongoClientPromise = createConnection();
      return await global._mongoClientPromise;
    }
  })();
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = createConnection();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

