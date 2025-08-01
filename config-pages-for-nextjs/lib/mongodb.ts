// MongoDB connection utility for Google Meet MCP Server
import { MongoClient, MongoClientOptions, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const options: MongoClientOptions = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export interface DatabaseConnection {
  client: MongoClient;
  db: Db;
}

export async function connectToDatabase(): Promise<DatabaseConnection> {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    return {
      client,
      db
    };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

export { clientPromise };

// Helper function to ensure indexes exist
export async function ensureIndexes(): Promise<void> {
  const { db } = await connectToDatabase();
  
  try {
    // API Keys collection indexes
    await db.collection('api_keys').createIndex({ userId: 1 });
    await db.collection('api_keys').createIndex({ apiKey: 1 }, { unique: true });
    await db.collection('api_keys').createIndex({ isActive: 1 });
    await db.collection('api_keys').createIndex({ lastUsed: 1 });
    
    // MCP Requests collection indexes
    await db.collection('mcp_requests').createIndex({ userId: 1 });
    await db.collection('mcp_requests').createIndex({ timestamp: 1 });
    await db.collection('mcp_requests').createIndex({ toolName: 1 });
    
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ 'googleCredentials': 1 }, { sparse: true });
    
    console.log('Database indexes ensured successfully');
  } catch (error) {
    console.error('Error ensuring indexes:', error);
  }
}