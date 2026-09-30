import { Octokit } from 'octokit';

if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
  throw new Error('GITHUB_PERSONAL_ACCESS_TOKEN is missing in .env.local');
}

export const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

export const GITHUB_USERNAME = process.env.GITHUB_USERNAME!;