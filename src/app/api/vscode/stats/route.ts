import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

const TelemetrySchema = new mongoose.Schema({
  date: { type: String, required: true },
  filesModified: { type: Number, default: 0 },
  languages: [
    {
      name: { type: String, required: true },
      timeSeconds: { type: Number, default: 0 }
    }
  ]
});

const Telemetry = mongoose.models.Telemetry || mongoose.model('Telemetry', TelemetrySchema);

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI in environment variables');
  await mongoose.connect(MONGODB_URI);
}

// GET: Serves data to FileActivityList and LanguageDonutChart
export async function GET() {
  try {
    await connectDB();
    // Fetch recent telemetry records from MongoDB
    const records = await Telemetry.find({}).sort({ date: -1 }).limit(30);

    // If no records exist yet in MongoDB, return a sample placeholder array so the UI lights up immediately
    if (!records || records.length === 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      return NextResponse.json([
        {
          date: todayStr,
          filesModified: 5,
          languages: [
            { name: 'TypeScript', timeSeconds: 7200 },
            { name: 'React', timeSeconds: 5400 },
            { name: 'JavaScript', timeSeconds: 1800 },
            { name: 'JSON', timeSeconds: 900 }
          ]
        }
      ]);
    }

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('API /vscode/stats Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}