
import mongoose from 'mongoose';
import dns from 'dns';

// Force use of Google DNS to bypass ISP/Corporate DNS resolution issues with MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.mongo_uri;

if (!MONGODB_URI) {
    throw new Error(
        'Please define the mongo_uri environment variable inside .env.local'
    );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 60000, // 60 seconds
            connectTimeoutMS: 60000, // 60 seconds
            socketTimeoutMS: 60000, // 60 seconds
            family: 4 // Force IPv4
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
