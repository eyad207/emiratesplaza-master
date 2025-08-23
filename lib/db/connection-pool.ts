import mongoose from 'mongoose'

// Connection pool optimization for better performance
const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

interface CachedMongoose {
  conn: mongoose.Mongoose | null
  promise: Promise<mongoose.Mongoose> | null
}

declare global {
  var mongooseCache: CachedMongoose | undefined
}

let cached = global.mongooseCache

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null }
}

// Set a few mongoose global options to avoid buffering and unexpected behavior
mongoose.set('bufferCommands', false)
mongoose.set('strictQuery', false)

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn
  }

  if (!cached!.promise) {
    const opts = {
      // tuned for serverless environments; adjust maxPoolSize per your Atlas limits
      maxPoolSize: 20, // increase from 10 if your plan supports it
      minPoolSize: 0,
      serverSelectionTimeoutMS: 4000, // faster failover on cold start
      socketTimeoutMS: 45000,
      family: 4,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000,
      // recommended driver options (no-op for newer mongoose but harmless)
      useNewUrlParser: true,
      useUnifiedTopology: true,
      appName: 'emiratesplaza-vercel',
      // retryWrites helps transient failures
      retryWrites: true,
    }

    cached!.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    cached!.conn = await cached!.promise
  } catch (e) {
    cached!.promise = null
    throw e
  }

  return cached!.conn
}

// Lightweight warmup/ping helper — call this from a short-lived API route or server middleware
export async function warmupDatabase(timeoutMs = 2000) {
  try {
    const db = await connectToDatabase()
    // Check if connection is ready with readyState
    if (db.connection.readyState === 1) {
      return true
    }
    // Fallback timeout check
    return await Promise.race([
      new Promise((resolve) => {
        if (db.connection.readyState === 1) {
          resolve(true)
        } else {
          const timer = setInterval(() => {
            if (db.connection.readyState === 1) {
              clearInterval(timer)
              resolve(true)
            }
          }, 100)
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('warmup timeout')), timeoutMs)
      ),
    ])
  } catch (err) {
    // swallow errors in warmup to avoid blocking main flow
    console.warn('DB warmup failed:', (err as Error).message)
    return false
  }
}

// Helper function to close connections (useful for cleanup)
export async function disconnectFromDatabase() {
  if (cached?.conn) {
    await cached.conn.disconnect()
    cached.conn = null
    cached.promise = null
  }
}
