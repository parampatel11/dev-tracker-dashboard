import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

// Connect to MongoDB if not already connected
if (!mongoose.connection.readyState) {
  mongoose.connect(MONGODB_URI);
}

// Define the schema to match the data we sent from the extension
const StatSchema = new mongoose.Schema({
  timeSeconds: Number,
  filesModified: Number,
  foldersCreated: Number,
  language: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'vscodestats' });

// Use existing model or create a new one
const Stat = mongoose.models.Stat || mongoose.model('Stat', StatSchema);

export async function GET() {
  try {
    // Fetch the latest 100 coding sessions, sorted by newest first
    const stats = await Stat.find({}).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Database fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}