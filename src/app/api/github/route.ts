import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const GITHUB_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  const GITHUB_USERNAME = process.env.GITHUB_USERNAME;

  if (!GITHUB_TOKEN || !GITHUB_USERNAME) {
    return NextResponse.json({ error: 'Missing GitHub variables in .env' }, { status: 401 });
  }

  try {
    const graphQLQuery = `
      query($username: String!) {
        user(login: $username) {
          name
          login
          avatarUrl
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    // OPTIMIZATION 1: Fetch GraphQL and Events REST API at the exact same time
    const [graphRes, eventsRes] = await Promise.all([
      fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Dev-Tracker-Dashboard',
        },
        body: JSON.stringify({ query: graphQLQuery, variables: { username: GITHUB_USERNAME } }),
        cache: 'no-store' 
      }),
      fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events`, {
        headers: { 
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'Dev-Tracker-Dashboard'
        },
        cache: 'no-store' 
      })
    ]);

    const graphData = await graphRes.json();
    const eventsData = await eventsRes.json();
    
    if (graphData.errors) throw new Error(graphData.errors[0].message);
    const user = graphData.data?.user;
    if (!user) throw new Error(`User ${GITHUB_USERNAME} not found.`);

    let last90Days = user.contributionsCollection.contributionCalendar.weeks
      .flatMap((week: any) => week.contributionDays)
      .slice(-90);

    let commits: any[] = [];
    
    if (Array.isArray(eventsData)) {
      // OPTIMIZATION 2: Fetch all private commit messages in parallel instead of waiting in a loop
      const commitPromises = eventsData.slice(0, 30).map(async (ev: any) => {
        const repoName = ev.repo?.name?.split('/')[1] || ev.repo?.name || 'Repository';
        const eventIso = ev.created_at;
        const extractedCommits = [];

        if (ev.type === 'PushEvent') {
          const pushCommits = ev.payload?.commits;
          
          if (pushCommits && pushCommits.length > 0) {
            pushCommits.forEach((commit: any) => {
              extractedCommits.push({
                id: commit.sha.substring(0, 7),
                date: eventIso.split('T')[0],
                isoDate: eventIso,
                message: commit.message.split('\n')[0],
                repo: repoName
              });
            });
          } else if (ev.payload?.head) {
            try {
              const headSha = ev.payload.head;
              const commitRes = await fetch(`https://api.github.com/repos/${ev.repo.name}/commits/${headSha}`, {
                headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'Dev-Tracker-Dashboard' }
              });
              
              if (commitRes.ok) {
                const commitData = await commitRes.json();
                const commitIso = commitData.commit?.author?.date || commitData.commit?.committer?.date || eventIso;
                extractedCommits.push({
                  id: headSha.substring(0, 7),
                  date: commitIso.split('T')[0],
                  isoDate: commitIso,
                  message: commitData.commit.message.split('\n')[0],
                  repo: repoName
                });
              } else {
                extractedCommits.push({
                  id: headSha.substring(0, 7),
                  date: eventIso.split('T')[0],
                  isoDate: eventIso,
                  message: `Pushed repository updates`,
                  repo: repoName
                });
              }
            } catch (e) {
              console.error("Failed to fetch private commit:", e);
            }
          }
        } else if (ev.type === 'CreateEvent' && ev.payload?.ref_type === 'repository') {
          extractedCommits.push({
            id: ev.id.substring(0, 7),
            date: eventIso.split('T')[0],
            isoDate: eventIso,
            message: 'Created a new repository',
            repo: repoName
          });
        }
        return extractedCommits;
      });

      // Wait for all parallel fetches to complete instantly, then flatten the array
      const resolvedCommitArrays = await Promise.all(commitPromises);
      commits = resolvedCommitArrays.flat();
    }

    commits.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());
    const uniqueCommits = Array.from(new Map(commits.map(c => [c.id, c])).values());

    const todayUTC = new Date().toISOString().split('T')[0];
    const realTimeTodayCommits = uniqueCommits.filter(c => c.date === todayUTC).length;
    const lastDayInGraph = last90Days[last90Days.length - 1];

    if (lastDayInGraph.date === todayUTC) {
      lastDayInGraph.contributionCount = Math.max(lastDayInGraph.contributionCount, realTimeTodayCommits);
    } else if (realTimeTodayCommits > 0) {
      last90Days.push({ date: todayUTC, contributionCount: realTimeTodayCommits });
      if (last90Days.length > 90) last90Days.shift(); 
    }

    const today = last90Days[last90Days.length - 1]?.contributionCount || 0;
    const weekCount = last90Days.slice(-7).reduce((acc: number, day: any) => acc + day.contributionCount, 0);
    const monthCount = last90Days.slice(-30).reduce((acc: number, day: any) => acc + day.contributionCount, 0);
    const threeMonthCount = last90Days.reduce((acc: number, day: any) => acc + day.contributionCount, 0);

    return NextResponse.json({
      profile: {
        name: user.name || user.login,
        username: user.login,
        avatar: user.avatarUrl,
      },
      stats: { today, week: weekCount, month: monthCount, threeMonths: threeMonthCount },
      contributions: last90Days,
      commits: uniqueCommits
    });

  } catch (error: any) {
    console.error('GitHub API Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to fetch GitHub data' }, { status: 500 });
  }
}