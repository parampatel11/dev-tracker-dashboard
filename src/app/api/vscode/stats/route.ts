import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { VSCodeStat } from '@/models/VSCodeStat'; // <-- Using your actual model!

export const dynamic = 'force-dynamic';

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI in environment variables');
  await mongoose.connect(MONGODB_URI);
}

export async function GET() {
  try {
    await connectDB();
    // Fetches from your vscodestats collection
    const records = await VSCodeStat.find({}).sort({ date: -1 }).limit(30);
    return NextResponse.json(records || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    
    // Security check
    const authHeader = request.headers.get('authorization');
    const VSCODE_INGEST_SECRET = process.env.VSCODE_INGEST_SECRET;
    if (VSCODE_INGEST_SECRET && authHeader !== `Bearer ${VSCODE_INGEST_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const dateStr = body.date || new Date().toLocaleDateString('en-CA');

    // Fetch today's existing record
    let stat = await VSCodeStat.findOne({ date: dateStr });

    if (!stat) {
      // If it's the first sync of the day, create a brand new record
      stat = new VSCodeStat({
        date: dateStr,
        totalTimeSeconds: body.totalTimeSeconds || 0,
        filesModified: body.filesModified || 0,
        languages: body.languages || []
      });
    } else {
      // If the record exists, ACCUMULATE the new time (don't overwrite!)
      stat.totalTimeSeconds += (body.totalTimeSeconds || 0);
      stat.filesModified += (body.filesModified || 0);

      // Intelligently merge the languages array
      if (body.languages) {
        body.languages.forEach((incomingLang: any) => {
          const existingLang = stat.languages.find((l: any) => l.name === incomingLang.name);
          if (existingLang) {
            existingLang.timeSeconds += incomingLang.timeSeconds; // Add to existing language
          } else {
            stat.languages.push(incomingLang); // Or add a new language if you switched tech
          }
        });
      }
    }

    await stat.save();

    return NextResponse.json({ success: true, data: stat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}