import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { GitHubStat } from '@/models/GitHubStat';
import { octokit, GITHUB_USERNAME } from '@/lib/github-client';

export const dynamic = 'force-dynamic';

// Define the payload structure for PushEvent so TypeScript knows 'commits' exists
interface PushEventPayload {
  commits?: Array<{
    sha: string;
    message: string;
    distinct: boolean;
    url: string;
  }>;
}

export async function GET() {
  try {
    await connectDB();

    // 1. Fetch recent events
    const { data: events } = await octokit.rest.activity.listEventsForAuthenticatedUser({
      username: GITHUB_USERNAME,
      per_page: 50,
    });

    const today = new Date().toISOString().split('T')[0];

    // 2. Filter for PushEvents that occurred today
    const todaysCommits = events.filter((event) => {
      if (event.type !== 'PushEvent') return false;
      const eventDate = new Date(event.created_at!).toISOString().split('T')[0];
      return eventDate === today;
    });

    let totalDailyCommits = 0;
    const repoMap = new Map<string, number>();
    let lastContributionAt = new Date();

    if (todaysCommits.length > 0) {
      lastContributionAt = new Date(todaysCommits[0].created_at!);
    }

    todaysCommits.forEach((event) => {
      // Safely cast payload to PushEventPayload to satisfy TypeScript
      const payload = event.payload as PushEventPayload;
      const commitCount = payload.commits?.length || 0;

      totalDailyCommits += commitCount;

      const repoName = event.repo.name;
      const existingCount = repoMap.get(repoName) || 0;
      repoMap.set(repoName, existingCount + commitCount);
    });

    // 3. Format into an array for Mongoose
    const repositories = Array.from(repoMap, ([repoName, commits]) => ({
      repoName,
      commits,
    }));

    // 4. Update or create today's record in MongoDB
    const stat = await GitHubStat.findOneAndUpdate(
      { date: today },
      {
        totalDailyCommits,
        repositories,
        lastContributionAt,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'GitHub data synced successfully!',
      data: stat,
    }, { status: 200 });

  } catch (error) {
    console.error('GitHub Sync Error:', error);
    return NextResponse.json({ error: 'Failed to sync GitHub data' }, { status: 500 });
  }
}