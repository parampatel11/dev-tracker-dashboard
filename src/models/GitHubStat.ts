import mongoose, { Schema, Document } from 'mongoose';

export interface IGitHubStat extends Document {
  date: string; // Format: YYYY-MM-DD
  totalDailyCommits: number;
  repositories: {
    repoName: string;
    commits: number;
  }[];
  lastContributionAt: Date;
}

const GitHubStatSchema = new Schema<IGitHubStat>(
  {
    date: { type: String, required: true, unique: true },
    totalDailyCommits: { type: Number, default: 0 },
    repositories: [
      {
        repoName: { type: String, required: true },
        commits: { type: Number, default: 0 },
      },
    ],
    lastContributionAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const GitHubStat = mongoose.models.GitHubStat || mongoose.model<IGitHubStat>('GitHubStat', GitHubStatSchema);