'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGithub } from 'react-icons/fa';
import { 
  VscGitCommit, VscRepo, VscCalendar, VscClose, 
  VscFlame, VscTarget, VscPulse, VscHistory, 
  VscLinkExternal, VscArrowRight 
} from 'react-icons/vsc';

const getContributionStyle = (count: number, isSelected: boolean) => {
  const base = isSelected 
    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#141414] scale-125 z-30 shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
    : 'hover:scale-125 hover:z-30 hover:ring-1 hover:ring-white/80 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-300';
  
  if (count === 0) return `${base} bg-white/[0.03] border-white/5 text-gray-600 hover:text-gray-200`;
  if (count <= 2) return `${base} bg-[#0e4429] border-[#0e4429] text-green-500/70 hover:text-green-300`;
  if (count <= 5) return `${base} bg-[#006d32] border-[#006d32] text-green-400 hover:text-green-200`;
  if (count <= 8) return `${base} bg-[#26a641] border-[#26a641] text-black font-black hover:shadow-[0_0_15px_rgba(38,166,65,0.6)]`;
  return `${base} bg-[#39d353] border-[#39d353] text-black font-black shadow-[0_0_12px_rgba(57,211,83,0.4)] hover:shadow-[0_0_25px_rgba(57,211,83,0.8)]`;
};

const legendColors = [
  'bg-white/[0.03] border-white/5',
  'bg-[#0e4429] border-[#0e4429]',
  'bg-[#006d32] border-[#006d32]',
  'bg-[#26a641] border-[#26a641]',
  'bg-[#39d353] border-[#39d353] shadow-[0_0_8px_rgba(57,211,83,0.4)]'
];

export default function GitHubDashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGitHub() {
      try {
        const res = await fetch('/api/github');
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to connect');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchGitHub();
  }, []);

  const displayCommits = useMemo(() => {
    if (!data?.commits) return [];
    let list = data.commits;
    if (selectedDate) {
      list = list.filter((c: any) => c.date === selectedDate);
    }
    // Strict chronological sort: newest first
    return [...list]
      .sort((a: any, b: any) => new Date(b.isoDate || b.date).getTime() - new Date(a.isoDate || a.date).getTime())
      .slice(0, 15);
  }, [data, selectedDate]);

const groupedMonths = useMemo(() => {
    if (!data?.contributions) return [];
    
    // 1. Calculate the exactly allowed 3 months (Current, -1 month, -2 months)
    const allowedMonths = [2, 1, 0].map(offset => {
      const d = new Date();
      d.setMonth(d.getMonth() - offset);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    });
    
    const monthsMap = new Map();
    
    // 2. Map the data, but skip anything outside of the allowed 3 months
    data.contributions.forEach((day: any) => {
      const dateObj = new Date(day.date + 'T12:00:00'); 
      const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Only push the day if its month matches our allowed list
      if (allowedMonths.includes(monthYear)) {
        if (!monthsMap.has(monthYear)) {
          monthsMap.set(monthYear, { name: monthYear, days: [] });
        }
        monthsMap.get(monthYear).days.push(day);
      }
    });
    
    return Array.from(monthsMap.values());
  }, [data]);
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="h-[32rem] rounded-2xl border border-red-500/20 bg-[#1e1e1e]/50 backdrop-blur-md flex flex-col items-center justify-center text-red-400 p-8 shadow-lg"
      >
        <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
          <FaGithub className="w-12 h-12 mb-4 opacity-50" />
        </motion.div>
        <h3 className="text-xl font-bold mb-2">GitHub Connection Error</h3>
        <p className="text-sm font-medium opacity-80">{error}</p>
      </motion.div>
    );
  }

  if (!data) {
    return (
      <div className="h-[32rem] rounded-2xl border border-white/5 bg-[#1e1e1e]/50 backdrop-blur-md flex items-center justify-center shadow-lg">
        <motion.div 
          animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-[#39d353]/30 border-t-[#39d353] rounded-full" 
        />
      </div>
    );
  }

  return (
    <div id='git' className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left: Profile & Glass Stats */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
          className="xl:col-span-4 rounded-2xl border border-white/10 bg-[#141414]/90 backdrop-blur-md p-6 sm:p-8 relative shadow-2xl overflow-hidden flex flex-col justify-between group/card"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#26a641]/0 via-[#39d353]/15 to-[#26a641]/0 opacity-0 group-hover/card:opacity-100 blur-2xl transition-opacity duration-700 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#26a641] to-[#39d353] opacity-80" />
          
          <div className="flex flex-col sm:flex-row xl:flex-col items-start gap-5 mb-8 relative z-10">
            <div className="relative group/avatar cursor-pointer shrink-0">
              <div className="absolute inset-0 bg-[#39d353] rounded-full blur-md opacity-0 group-hover/avatar:opacity-40 transition-opacity duration-500" />
              <img 
                src={data.profile.avatar} 
                alt={data.profile.name} 
                className="w-20 h-20 rounded-full border-2 border-white/10 object-cover shadow-xl group-hover/avatar:scale-105 transition-transform duration-500 relative z-10"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#141414] group-hover/avatar:bg-[#39d353] rounded-full p-1.5 border border-white/10 shadow-lg transition-colors duration-300 z-20">
                <FaGithub className="w-4 h-4 text-white group-hover/avatar:text-black group-hover/avatar:rotate-[360deg] transition-all duration-700" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl xl:text-3xl font-black text-white tracking-tight leading-none">{data.profile.name}</h3>
              <a href={`https://github.com/${data.profile.username}`} target="_blank" rel="noreferrer" className="text-sm text-gray-400 font-medium hover:text-[#39d353] transition-colors mt-2 inline-flex items-center gap-1.5 group/link">
                @{data.profile.username}
                <VscLinkExternal className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-300" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            {[
              { label: "Today", value: data.stats.today, color: 'text-[#39d353]', Icon: VscFlame },
              { label: 'Week', value: data.stats.week, color: 'text-white', Icon: VscTarget },
              { label: 'Month', value: data.stats.month, color: 'text-white', Icon: VscPulse },
              { label: '90 Days', value: data.stats.threeMonths, color: 'text-white', Icon: VscHistory },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.03 }}
                className="bg-white/[0.02] border border-white/5 hover:border-[#39d353]/30 hover:bg-[#39d353]/5 rounded-xl p-4 flex flex-col justify-center transition-all duration-300 shadow-lg hover:shadow-[0_8px_20px_rgba(57,211,83,0.1)] cursor-default group/stat relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 opacity-20 group-hover/stat:opacity-100 group-hover/stat:rotate-12 transition-all duration-300">
                  <stat.Icon className="w-5 h-5 text-gray-400 group-hover/stat:text-[#39d353]" />
                </div>
                
                <span className={`text-2xl font-black ${stat.color} group-hover/stat:drop-shadow-[0_0_8px_rgba(57,211,83,0.4)] transition-all relative z-10 mt-1`}>
                  {stat.value}
                </span>
                <span className="text-[10px] text-gray-500 group-hover/stat:text-gray-300 uppercase tracking-widest font-bold mt-1 transition-colors relative z-10">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: Chronologically Sorted Commits Feed */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="xl:col-span-8 rounded-2xl border border-white/10 bg-[#141414]/90 backdrop-blur-md p-6 sm:p-8 relative shadow-2xl flex flex-col h-[28rem] group/feed"
        >
          <div className="flex justify-between items-start sm:items-center mb-6 pb-4 border-b border-white/5 shrink-0">
            <div>
              <h4 className="text-lg font-bold text-white flex items-center gap-2.5 group/title">
                <VscGitCommit className="text-[#39d353] w-5 h-5 group-hover/title:rotate-180 transition-transform duration-700" />
                Commit History Feed
              </h4>
              <p className="text-sm text-gray-500 font-medium mt-1">
                {selectedDate 
                  ? <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#39d353]">Showing activity for {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</motion.span>
                  : 'Displaying latest timeline activity'}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-3 mt-2 sm:mt-0">
              <motion.span 
                key={displayCommits.length}
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-xs font-black text-[#39d353] bg-[#39d353]/10 px-3 py-1.5 rounded-lg border border-[#39d353]/20 shadow-sm flex items-center gap-1.5"
              >
                <VscPulse className="w-3.5 h-3.5 animate-pulse" />
                {displayCommits.length} events
              </motion.span>
              
              <AnimatePresence>
                {selectedDate && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDate(null)} 
                    className="text-[10px] text-gray-400 hover:text-white uppercase tracking-wider font-bold transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 group/btn border border-transparent hover:border-white/10"
                  >
                    <VscClose className="w-3.5 h-3.5 group-hover/btn:rotate-90 transition-transform duration-300 text-red-400/70 group-hover/btn:text-red-400" />
                    Clear Date
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-[#39d353]/30 transition-colors flex flex-col gap-4 relative">
            <AnimatePresence>
              {displayCommits.length > 0 ? (
                displayCommits.map((commit: any, index: number) => {
                  const dateObj = new Date(commit.isoDate || commit.date);
                  const commitDateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const commitTimeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <motion.div
                      key={`${commit.id}-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                      className="p-4 border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] transition-all duration-300 rounded-xl group/item relative overflow-hidden flex flex-col shrink-0 min-h-fit"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover/item:bg-[#39d353] transition-colors duration-300" />
                      
                      <VscArrowRight className="absolute right-4 top-4 w-4 h-4 text-[#39d353] opacity-0 -translate-x-4 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300" />
                      
                      <p className="text-[15px] font-medium text-gray-200 group-hover/item:text-white transition-colors leading-relaxed break-words pr-8">
                        {commit.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1.5 group-hover/item:text-gray-300 transition-colors">
                          <VscRepo className="w-3.5 h-3.5 text-[#39d353]" />
                          {commit.repo}
                        </span>
                        
                        <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5 group-hover/item:text-gray-400 transition-colors text-right">
                          <VscCalendar className="w-3 h-3 opacity-70" />
                          {commitDateStr} • {commitTimeStr}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 space-y-4">
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
                    <VscGitCommit className="w-12 h-12 opacity-20" />
                  </motion.div>
                  <p className="text-base font-medium tracking-wide">No commits found for this date.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>

      {/* ================= BOTTOM SECTION: CALENDAR BLOCKS ================= */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        className="rounded-2xl border border-white/10 bg-[#141414]/90 backdrop-blur-md p-8 shadow-2xl overflow-hidden relative group/board"
      >
        <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
          <div>
            <h4 className="text-2xl font-black text-white tracking-wide flex items-center gap-3 group/caltitle">
              <motion.div whileHover={{ rotate: [0, -15, 15, -15, 15, 0] }} transition={{ duration: 0.5 }}>
                <VscCalendar className="text-[#39d353] cursor-pointer" />
              </motion.div>
              90-Day Commit History
            </h4>
            <p className="text-sm text-gray-400 mt-2 font-medium">Select any date box to view specific repository commits</p>
          </div>
          
          <div className="hidden sm:flex items-center gap-2.5 text-xs font-bold text-gray-500 bg-black/40 px-4 py-2 rounded-xl border border-white/5 shadow-inner hover:border-white/10 transition-colors">
            <span className="mr-1">Less</span>
            {legendColors.map((colorClass, i) => (
              <motion.div 
                whileHover={{ scale: 1.5, y: -2 }}
                key={i} 
                className={`w-3.5 h-3.5 rounded-[3px] border cursor-help ${colorClass}`} 
              />
            ))}
            <span className="ml-1">More</span>
          </div>
        </div>

        <div className="flex gap-10 overflow-x-auto pb-6 pt-2 px-2 -mx-2 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-[#39d353]/40 scrollbar-track-black/40 transition-colors">
          {groupedMonths.map((month, mIdx) => {
            const firstDayObj = new Date(month.days[0].date + 'T12:00:00');
            const startOffset = firstDayObj.getDay(); 

            return (
              <motion.div 
                key={month.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: mIdx * 0.15, type: "spring", stiffness: 200, damping: 20 }}
                className="flex flex-col min-w-[320px] bg-black/30 hover:bg-black/50 p-5 rounded-2xl border border-white/5 hover:border-white/10 shadow-inner transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <VscCalendar className="w-4 h-4 text-gray-500" />
                  <h5 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500 tracking-wide">
                    {month.name}
                  </h5>
                </div>
                
                <div className="grid grid-cols-7 gap-2 text-center mb-3">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <span key={d} className="text-[10px] uppercase font-black text-gray-600 tracking-wider">{d}</span>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-10 h-10" />
                  ))}
                  
                  {month.days.map((day: any) => {
                    const dateNum = new Date(day.date + 'T12:00:00').getDate();
                    const isSelected = selectedDate === day.date;
                    
                    return (
                      <div key={day.date} className="relative group/box flex items-center justify-center">
                        <motion.button 
                          whileHover={{ scale: 1.15, zIndex: 30 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedDate(day.date)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs transition-colors duration-300 border shadow-sm ${getContributionStyle(day.contributionCount, isSelected)}`}
                        >
                          {dateNum}
                        </motion.button>
                        
                        <div className="absolute bottom-full mb-3 opacity-0 scale-90 group-hover/box:opacity-100 group-hover/box:scale-100 pointer-events-none transition-all duration-200 ease-out backdrop-blur-xl bg-black/80 border border-white/20 text-xs font-bold text-white px-3 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-1.5">
                          <VscGitCommit className="w-3.5 h-3.5 text-[#39d353]" />
                          <span><span className="text-[#39d353] text-sm">{day.contributionCount}</span> commits</span>
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/80 border-b border-r border-white/20 rotate-45" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}