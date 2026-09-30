'use client';

import { motion } from 'framer-motion';
import FileActivityList from '@/components/vscode/FileActivityList';
import LanguageDonutChart from '@/components/vscode/LanguageDonutChart';
import WeeklyHoursGraph from '@/components/vscode/WeeklyHoursGraph';
import GitHubDashboard from '@/components/vscode/GitHubDashboard';
import HeroStats from '@/components/vscode/HeroStats';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" as const } 
  }
};

export default function Home() {
  return (
    <main className="w-full min-h-screen pt-32 pb-20 px-4 sm:px-8 max-w-7xl mx-auto relative overflow-hidden selection:bg-[#39d353] selection:text-black">
      
      {/* Enhanced Multi-Color Ambient Glow */}
      <div className="absolute top-[-10%] left-1/4 w-[600px] h-[500px] bg-orange-500/10 blur-[150px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-[20%] right-1/4 w-[500px] h-[400px] bg-[#39d353]/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-14"
      >
        
        {/* Hero Section */}
        <motion.header variants={itemVariants} className="flex flex-col gap-5">
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400 drop-shadow-lg">Param</span>.
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl leading-relaxed">
            Your live VS Code telemetry is active. Monitoring your daily productivity, tech stack preferences, and repository commits.
          </p>
          
          {/* Dynamic 4-Column Stats Component */}
          <HeroStats />
        </motion.header>

        {/* Section: Today's Work & Tech Breakdown */}
        <motion.section variants={itemVariants} id="today" className="scroll-mt-32 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white tracking-wide">Today's Overview</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="w-full flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Activity Log</h4>
              <FileActivityList />
            </div>

            <div className="w-full flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Language Breakdown</h4>
              <LanguageDonutChart />
            </div>
          </div>
        </motion.section>

        {/* Section: Weekly Graph */}
        <motion.section variants={itemVariants} id="weekly" className="scroll-mt-32 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white tracking-wide">Activity History</h3>
          </div>
          
          <div className="w-full">
            <WeeklyHoursGraph />
          </div>
        </motion.section>

        {/* Section: GitHub Activity */}
        <motion.section variants={itemVariants} id="github" className="scroll-mt-32 pt-4">
          <div className="w-full">
            <GitHubDashboard />
          </div>
        </motion.section>

      </motion.div>
    </main>
  );
}