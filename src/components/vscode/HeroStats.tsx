'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function HeroStats() {
  const [githubStreak, setGithubStreak] = useState<number | null>(null);
  const [vscodeStats, setVscodeStats] = useState({
    hours: 0,
    minutes: 0,
    topTech: 'N/A',
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

    // 2. Fetch VS Code Telemetry from your REAL MongoDB backend
    async function fetchTelemetry() {
      try {
        // Cache: 'no-store' forces fresh data every time so it never gets stuck
        const res = await fetch('/api/vscode/stats', { cache: 'no-store' });
        
        if (res.ok) {
          const allData = await res.json();
          
          // Explicitly search for today's date
          const todayStr = new Date().toLocaleDateString('en-CA');
          const todayData = allData.find((d: any) => d.date === todayStr) || (allData.length > 0 ? allData[0] : null);

          if (todayData) {
            // Convert total seconds to hours and minutes
            const totalSeconds = todayData.totalTimeSeconds || 0;
            const displayHours = Math.floor(totalSeconds / 3600);
            const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
            
            // Find the language with the most time
            let topTechName = 'N/A';
            if (todayData.languages && todayData.languages.length > 0) {
              const topLang = todayData.languages.reduce((prev: any, current: any) => 
                (prev.timeSeconds > current.timeSeconds) ? prev : current
              );
              
              // Clean up VS Code's internal language IDs
              const langMap: Record<string, string> = {
                'typescriptreact': 'TypeScript',
                'javascriptreact': 'JavaScript',
                'typescript': 'TypeScript',
                'javascript': 'JavaScript',
                'html': 'HTML',
                'css': 'CSS',
                'json': 'JSON'
              };
              
              const rawName = topLang.name.toLowerCase();
              topTechName = langMap[rawName] || topLang.name;
            }

            setVscodeStats({
              hours: displayHours,
              minutes: displayMinutes,
              topTech: topTechName,
              filesModified: todayData.filesModified || 0,
              isLoading: false
            });
          } else {
            setVscodeStats(prev => ({ ...prev, isLoading: false }));
          }
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
      <motion.div whileHover={{ y: -5, scale: 1.02 }} className="p-5 rounded-2xl border border-white/5 bg-[#1e1e1e]/80 backdrop-blur-xl relative overflow-hidden group shadow-xl hover:shadow-orange-500/20 hover:border-orange-500/40 transition-all duration-300 cursor-default">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-xs text-gray-400 font-semibold tracking-wide relative z-10 uppercase">Today's Time</p>
        <h2 className="text-3xl font-black text-white mt-2 relative z-10 flex items-baseline gap-1">
          {vscodeStats.isLoading ? (
            <span className="w-16 h-8 bg-white/10 animate-pulse rounded-lg" />
          ) : (
            <>
              {vscodeStats.hours}<span className="text-orange-400 text-lg font-bold">h</span> 
              {vscodeStats.minutes}<span className="text-orange-400 text-lg font-bold">m</span>
            </>
          )}
        </h2>
      </motion.div>
      
      {/* Stat 2: Top Tech */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} className="p-5 rounded-2xl border border-white/5 bg-[#1e1e1e]/80 backdrop-blur-xl relative overflow-hidden group shadow-xl hover:shadow-yellow-400/20 hover:border-yellow-400/40 transition-all duration-300 cursor-default">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-xs text-gray-400 font-semibold tracking-wide relative z-10 uppercase">Top Tech For Today</p>
        <h2 className="text-3xl font-black text-white mt-2 relative z-10 flex items-center gap-3">
          {vscodeStats.isLoading ? (
            <span className="w-24 h-8 bg-white/10 animate-pulse rounded-lg" />
          ) : (
            <span className="text-yellow-400">{vscodeStats.topTech}</span>
          )}
        </h2>
      </motion.div>

      {/* Stat 3: Files */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} className="p-5 rounded-2xl border border-white/5 bg-[#1e1e1e]/80 backdrop-blur-xl relative overflow-hidden group shadow-xl hover:shadow-green-500/20 hover:border-green-500/40 transition-all duration-300 cursor-default">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-xs text-gray-400 font-semibold tracking-wide relative z-10 uppercase">Files Modified</p>
        <h2 className="text-3xl font-black text-white mt-2 relative z-10 flex items-baseline gap-1">
          {vscodeStats.isLoading ? (
             <span className="w-12 h-8 bg-white/10 animate-pulse rounded-lg" />
          ) : (
            <>
              {vscodeStats.filesModified} <span className="text-green-400 text-lg font-bold">files</span>
            </>
          )}
        </h2>
      </motion.div>

      {/* Stat 4: Live GitHub Streak */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} className="p-5 rounded-2xl border border-white/5 bg-[#1e1e1e]/80 backdrop-blur-xl relative overflow-hidden group shadow-xl hover:shadow-white/20 hover:border-white/30 transition-all duration-300 cursor-default">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-xs text-gray-400 font-semibold tracking-wide relative z-10 uppercase">Live Streak</p>
        <h2 className="text-3xl font-black text-white mt-2 relative z-10 flex items-baseline gap-1">
          {githubStreak === null ? (
            <span className="w-12 h-8 bg-white/10 animate-pulse rounded-lg" />
          ) : (
            <>
              {githubStreak} <span className="text-gray-300 text-lg font-bold">days</span>
            </>
          )}
        </h2>
      </motion.div>
    </div>
  );
}