import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Don't throw at import time during build; throw when actually used.
  console.warn("[db] MONGODB_URI is not set. Set it in .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Reuse the connection across hot reloads / serverless invocations.
const globalForMongoose = global as unknown as { _mongoose?: MongooseCache };
const cached: MongooseCache =
  globalForMongoose._mongoose || (globalForMongoose._mongoose = { conn: null, promise: null });

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined. Add it to .env.local");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
