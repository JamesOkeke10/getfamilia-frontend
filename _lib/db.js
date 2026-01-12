import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "getfamilia";

  if (!uri) throw new Error("Missing MONGODB_URI");

  if (cachedDb) return cachedDb;

  const client = cachedClient || new MongoClient(uri);
  if (!cachedClient) {
    cachedClient = client;
    await client.connect();
  }

  const db = client.db(dbName);
  cachedDb = db;
  return db;
}
