'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function HeroStats() {
  const [githubStreak, setGithubStreak] = useState<number | null>(null);
  const [vscodeStats, setVscodeStats] = useState({
    hours: 0,
    minutes: 0,
    topTech: 'JS',
    techPercent: 0,
    filesModified: 0,
    isLoading: true
  });

  useEffect(() => {
    // 1. Calculate Live Streak from GitHub
    async function fetchStreak() {
      try {
        const res = await fetch('/api/github');
        if (res.ok) {
          const data = await res.json();
          const days = data.contributions || [];
          
          let currentStreak = 0;
          let todayIndex = days.length - 1;
          
          // Check if today has commits
          if (days[todayIndex]?.contributionCount > 0) {
            for (let i = todayIndex; i >= 0; i--) {
              if (days[i].contributionCount > 0) currentStreak++;
              else break;
            }
          } else {
            // If today is 0, check if the streak was alive yesterday
            for (let i = todayIndex - 1; i >= 0; i--) {
              if (days[i].contributionCount > 0) currentStreak++;
              else break;
            }
          }
          setGithubStreak(currentStreak);
        }
      } catch (e) {
        console.error("Failed to fetch streak", e);
        setGithubStreak(0);
      }
    }

    // 2. Fetch VS Code Telemetry from your MongoDB backend
    async function fetchTelemetry() {
      try {
        // REPLACE THIS URL with your actual backend endpoint when ready
        const res = await fetch('/api/vscode-telemetry');
        if (res.ok) {
          const data = await res.json();
          setVscodeStats({
            hours: data.hours || 0,
            minutes: data.minutes || 0,
            topTech: data.topTech || 'N/A',
            techPercent: data.techPercent || 0,
            filesModified: data.filesModified || 0,
            isLoading: false
          });
        } else {
          setVscodeStats(prev => ({ ...prev, isLoading: false }));
        }
      } catch (e) {
        setVscodeStats(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchStreak();
    fetchTelemetry();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      
      {/* Stat 1: Time */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} className="p-6 rounded-2xl border border-white/5 bg-[#1e1e1e]/80 backdrop-blur-xl relative overflow-hidden group shadow-xl hover:shadow-orange-500/20 hover:border-orange-500/40 transition-all duration-300 cursor-default">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-sm text-gray-400 font-semibold tracking-wide relative z-10 uppercase">Today's Time</p>
        <h2 className="text-4xl font-black text-white mt-3 relative z-10 flex items-baseline gap-1">
          {vscodeStats.isLoading ? (
            <span className="w-16 h-10 bg-white/10 animate-pulse rounded-lg" />
          ) : (
            <>
              {vscodeStats.hours}<span className="text-orange-400 text-2xl font-bold">h</span> 
              {vscodeStats.minutes}<span className="text-orange-400 text-2xl font-bold">m</span>
            </>
          )}
        </h2>
      </motion.div>
      
      {/* Stat 2: Top Tech */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} className="p-6 rounded-2xl border border-white/5 bg-[#1e1e1e]/80 backdrop-blur-xl relative overflow-hidden group shadow-xl hover:shadow-yellow-400/20 hover:border-yellow-400/40 transition-all duration-300 cursor-default">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-sm text-gray-400 font-semibold tracking-wide relative z-10 uppercase">Top Tech</p>
        <h2 className="text-4xl font-black text-white mt-3 relative z-10 flex items-center gap-3">
          {vscodeStats.isLoading ? (
            <span className="w-24 h-10 bg-white/10 animate-pulse rounded-lg" />
          ) : (
            <>
              <span className="text-yellow-400">{vscodeStats.topTech}</span>
              {vscodeStats.techPercent > 0 && (
                <span className="text-lg text-gray-400 font-medium tracking-normal bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  {vscodeStats.techPercent}%
                </span>
              )}
            </>
          )}
        </h2>
      </motion.div>

      {/* Stat 3: Files */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} className="p-6 rounded-2xl border border-white/5 bg-[#1e1e1e]/80 backdrop-blur-xl relative overflow-hidden group shadow-xl hover:shadow-green-500/20 hover:border-green-500/40 transition-all duration-300 cursor-default">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-sm text-gray-400 font-semibold tracking-wide relative z-10 uppercase">Files Modified</p>
        <h2 className="text-4xl font-black text-white mt-3 relative z-10 flex items-baseline gap-2">
          {vscodeStats.isLoading ? (
             <span className="w-12 h-10 bg-white/10 animate-pulse rounded-lg" />
          ) : (
            <>
              {vscodeStats.filesModified} <span className="text-green-400 text-xl font-bold">files</span>
            </>
          )}
        </h2>
      </motion.div>

      {/* Stat 4: Live GitHub Streak */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} className="p-6 rounded-2xl border border-white/5 bg-[#1e1e1e]/80 backdrop-blur-xl relative overflow-hidden group shadow-xl hover:shadow-white/20 hover:border-white/30 transition-all duration-300 cursor-default">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-sm text-gray-400 font-semibold tracking-wide relative z-10 uppercase">Live Streak</p>
        <h2 className="text-4xl font-black text-white mt-3 relative z-10 flex items-baseline gap-2">
          {githubStreak === null ? (
            <span className="w-12 h-10 bg-white/10 animate-pulse rounded-lg" />
          ) : (
            <>
              {githubStreak} <span className="text-gray-300 text-xl font-bold">days</span>
            </>
          )}
        </h2>
      </motion.div>
    </div>
  );
}