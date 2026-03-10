import { MongoClient, Db, MongoClientOptions } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "expense-tracker";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

const options: MongoClientOptions = {
  // Do NOT set tls:true manually — mongodb+srv:// URIs already enable TLS automatically.
  // Setting it explicitly can trigger SSL handshake conflicts (ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR).
  retryWrites: true,
  retryReads: true,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 1,
};

// Cache the MongoClient on globalThis to prevent multiple connections in dev
const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function createClientPromise(): Promise<MongoClient> {
  const client = new MongoClient(MONGODB_URI, options);
  const promise = client.connect();

  // If connection fails, clear the cache so the next call can retry
  promise.catch(() => {
    if (globalWithMongo._mongoClientPromise === promise) {
      globalWithMongo._mongoClientPromise = undefined;
    }
  });

  return promise;
}

function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = createClientPromise();
    }
    return globalWithMongo._mongoClientPromise;
  }
  return createClientPromise();
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(DB_NAME);
}
