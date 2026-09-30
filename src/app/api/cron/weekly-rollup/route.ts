import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { VSCodeStat } from '@/models/VSCodeStat';
import { WeeklyArchive } from '@/models/WeeklyArchive';
import { subDays, startOfDay, endOfDay } from 'date-fns';

// Force Next.js to run this dynamically on every request
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Security Check: Verify the CRON_SECRET password
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized. Invalid Cron Secret.' }, { status: 401 });
    }

    await connectDB();

    // 2. Define the exact 7-day window (ending exactly when the cron runs)
    const now = new Date();
    const weekEndDate = endOfDay(now);
    const weekStartDate = startOfDay(subDays(now, 7)); // 7 days ago

    // Format dates to match our VSCodeStat string format (YYYY-MM-DD)
    const startString = weekStartDate.toISOString().split('T')[0];
    const endString = weekEndDate.toISOString().split('T')[0];

    // 3. Fetch all daily records within this 7-day window
    const dailyStats = await VSCodeStat.find({
      date: { $gte: startString,$lte: endString }
    });

    // If you didn't code at all this week, gracefully exit
    if (dailyStats.length === 0) {
      return NextResponse.json({ message: 'No coding activity found for this week. Nothing to archive.' }, { status: 200 });
    }

    // 4. Set up aggregators
    let totalTimeSeconds = 0;
    let totalFilesModified = 0;
    const languageMap = new Map<string, number>();

    // 5. Mathematically combine the 7 days of data
    dailyStats.forEach((day) => {
      totalTimeSeconds += day.totalTimeSeconds;
      totalFilesModified += day.filesModified;

      // Group and sum the languages
      day.languages.forEach((lang: any) => {
        const currentLangTime = languageMap.get(lang.name) || 0;
        languageMap.set(lang.name, currentLangTime + lang.timeSeconds);
      });
    });

    // 6. Format the languages map back into an array and sort by most used
    const topLanguages = Array.from(languageMap, ([name, timeSeconds]) => ({
      name,
      timeSeconds,
    })).sort((a, b) => b.timeSeconds - a.timeSeconds); // Sort descending

    // 7. Save the finalized week to the WeeklyArchive collection
    const archive = await WeeklyArchive.create({
      weekStartDate,
      weekEndDate,
      totalTimeSeconds,
      totalFilesModified,
      topLanguages,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Weekly archive finalized!',
      data: archive
    }, { status: 200 });

  } catch (error) {
    console.error('Weekly Rollup Error:', error);
    return NextResponse.json({ error: 'Failed to process weekly rollup' }, { status: 500 });
  }
}