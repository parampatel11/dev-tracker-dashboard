import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { VSCodeStat } from '@/models/VSCodeStat';

export async function POST(req: Request) {
  try {
    // 1. Security Check: Verify the secret password
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.VSCODE_INGEST_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized access. Invalid secret.' }, { status: 401 });
    }

    // 2. Parse the incoming data from VS Code
    const body = await req.json();
    const { 
      timeSeconds = 0, 
      filesModified = 0, 
      foldersCreated = 0, 
      language = 'Unknown' 
    } = body;

    // 3. Connect to MongoDB
    await connectDB();

    // 4. Get today's date in YYYY-MM-DD format (e.g., "2026-09-30")
    // This ensures all activity for the day groups into a single database row
    const today = new Date().toISOString().split('T')[0];

    // 5. Find today's record, or initialize a fresh one if it's a new day
    let stat = await VSCodeStat.findOne({ date: today });

    if (!stat) {
      stat = new VSCodeStat({
        date: today,
        totalTimeSeconds: 0,
        filesModified: 0,
        foldersCreated: 0,
        languages: [],
      });
    }

    // 6. Add the new incoming data to today's running totals
    stat.totalTimeSeconds += timeSeconds;
    stat.filesModified += filesModified;
    stat.foldersCreated += foldersCreated;

    // 7. Handle the language breakdown
    const langIndex = stat.languages.findIndex((l: any) => l.name === language);
    if (langIndex >= 0) {
      // If we already coded in this language today, add the time to it
      stat.languages[langIndex].timeSeconds += timeSeconds;
    } else {
      // If this is the first time using this language today, add it to the list
      stat.languages.push({ name: language, timeSeconds });
    }

    // 8. Save the updated totals back to the database
    await stat.save();

    return NextResponse.json({ success: true, message: 'VS Code activity logged!' }, { status: 200 });

  } catch (error) {
    console.error('VS Code Ingest Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}