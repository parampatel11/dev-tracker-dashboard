'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SiTypescript, SiJavascript, SiReact, SiHtml5, SiCss, SiJson, SiMarkdown } from 'react-icons/si';
import { VscFileCode } from 'react-icons/vsc';

const formatTime = (totalSeconds: number) => {
  if (!totalSeconds || totalSeconds < 60) return '< 1m';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const getLanguageStyle = (lang: string) => {
  const normalized = (lang || '').toLowerCase();
  if (normalized.includes('typescriptreact') || normalized.includes('jsx') || normalized.includes('tsx')) 
    return { name: 'React', icon: <SiReact className="w-5 h-5" />, color: 'text-cyan-400', bg: 'bg-cyan-400/10' };
  if (normalized.includes('typescript') || normalized.includes('ts')) 
    return { name: 'TypeScript', icon: <SiTypescript className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-400/10' };
  if (normalized.includes('javascript') || normalized.includes('js')) 
    return { name: 'JavaScript', icon: <SiJavascript className="w-5 h-5" />, color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
  if (normalized.includes('json') || normalized.includes('jsonc')) 
    return { name: 'JSON', icon: <SiJson className="w-5 h-5" />, color: 'text-gray-300', bg: 'bg-gray-400/10' };
  if (normalized.includes('markdown') || normalized.includes('md')) 
    return { name: 'Markdown', icon: <SiMarkdown className="w-5 h-5" />, color: 'text-white', bg: 'bg-white/10' };
  if (normalized.includes('css')) 
    return { name: 'CSS', icon: <SiCss className="w-5 h-5" />, color: 'text-indigo-400', bg: 'bg-indigo-400/10' };
  if (normalized.includes('html')) 
    return { name: 'HTML', icon: <SiHtml5 className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-500/10' };
  
  return { name: lang === 'Unknown' || lang === 'plaintext' ? 'Other' : lang, icon: <VscFileCode className="w-5 h-5" />, color: 'text-gray-400', bg: 'bg-white/5' };
};

export default function FileActivityList() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/vscode/stats');
        const data = await res.json();
        
        const todayStr = new Date().toISOString().split('T')[0];
        const aggregated: Record<string, any> = {};

        data.forEach((doc: any) => {
          // Verify date matches and languages array exists
          if (doc.date === todayStr && Array.isArray(doc.languages)) {
            const totalFilesForSession = Number(doc.filesModified) || 0;
            const totalTimeForSession = doc.languages.reduce((acc: number, l: any) => acc + (Number(l.timeSeconds) || 0), 0);

            doc.languages.forEach((langObj: any) => {
              const langName = langObj.name || 'Unknown';
              const timeSec = Number(langObj.timeSeconds) || 0;

              if (!aggregated[langName]) {
                aggregated[langName] = { language: langName, timeSeconds: 0, filesModified: 0 };
              }
              
              aggregated[langName].timeSeconds += timeSec;
              
              // Proportionally distribute the files based on time spent
              if (totalTimeForSession > 0) {
                const proportion = timeSec / totalTimeForSession;
                // Guarantee at least 1 file shows up if time was spent
                const calculatedFiles = Math.max(1, Math.round(totalFilesForSession * proportion));
                aggregated[langName].filesModified += calculatedFiles;
              } else {
                aggregated[langName].filesModified += 1;
              }
            });
          }
        });

        const sortedArray = Object.values(aggregated).sort((a, b) => b.timeSeconds - a.timeSeconds);
        setActivities(sortedArray);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-[24rem] rounded-2xl border border-white/5 bg-[#1e1e1e]/50 backdrop-blur-md flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="h-[24rem] rounded-2xl border border-white/5 bg-[#1e1e1e]/50 backdrop-blur-md flex flex-col items-center justify-center text-gray-500 text-sm">
        <VscFileCode className="w-10 h-10 mb-2 opacity-20" />
        <p>No coding activity today.</p>
      </div>
    );
  }

  return (
    <div className="h-[24rem] rounded-2xl border border-white/10 bg-[#141414]/90 backdrop-blur-md overflow-hidden flex flex-col relative shadow-xl">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-yellow-400" />
      
      <div className="px-5 py-3 border-b border-white/5 bg-black/40 flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        <span>Language</span>
        <span>Stats</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-white/10 flex flex-col gap-2">
        {activities.map((activity, index) => {
          const style = getLanguageStyle(activity.language);
          
          return (
            <motion.div
              key={activity.language}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)' }}
              className="px-4 py-3 items-center rounded-xl border border-white/5 bg-white/[0.02] flex justify-between transition-all duration-200 cursor-default group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${style.bg} ${style.color} shadow-inner`}>
                  {style.icon}
                </div>
                <div className="flex flex-col">
                  <h4 className="text-white font-semibold text-sm tracking-wide capitalize">{style.name}</h4>
                  
                  {/* Visually Distinct File Count Badge */}
                  <div className="flex items-center mt-1">
                    <span className="text-[10px] font-bold text-gray-400 bg-black/30 px-2 py-0.5 rounded border border-white/5 group-hover:border-white/10 transition-colors">
                      {activity.filesModified} {activity.filesModified === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end justify-center">
                <span className="text-sm font-bold text-gray-200">{formatTime(activity.timeSeconds)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}