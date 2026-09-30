import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// Define a simple Mongoose schema for your editor telemetry
const TelemetrySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  hours: { type: Number, default: 0 },
  minutes: { type: Number, default: 0 },
  topTech: { type: String, default: 'JS' },
  techPercent: { type: Number, default: 0 },
  filesModified: { type: Number, default: 0 },
});

const Telemetry = mongoose.models.Telemetry || mongoose.model('Telemetry', TelemetrySchema);

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI in environment variables');
  await mongoose.connect(MONGODB_URI);
}

// GET: Fetches today's telemetry stats for your dashboard UI
export async function GET() {
  try {
    await connectDB();
    const todayUTC = new Date().toISOString().split('T')[0];
    
    // Find today's record, or return default values if none exists yet
    let record = await Telemetry.findOne({ date: todayUTC });

    if (!record) {
      record = {
        hours: 0,
        minutes: 0,
        topTech: 'Next.js',
        techPercent: 85,
        filesModified: 0,
      };
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Telemetry GET Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Allows your local environment or automation script to ingest new telemetry data
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const VSCODE_INGEST_SECRET = process.env.VSCODE_INGEST_SECRET;

    // Secure the endpoint so only your authorized local scripts can push data
    if (VSCODE_INGEST_SECRET && authHeader !== `Bearer ${VSCODE_INGEST_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const todayUTC = new Date().toISOString().split('T')[0];

    const updated = await Telemetry.findOneAndUpdate(
      { date: todayUTC },
      { $set: { ...body, date: todayUTC } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Telemetry POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}