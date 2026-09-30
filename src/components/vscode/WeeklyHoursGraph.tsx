'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { VscCalendar, VscClose, VscChevronLeft, VscChevronRight } from 'react-icons/vsc';

const formatTooltipTime = (decimalHours: number) => {
  const totalMinutes = Math.round(decimalHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const generateDateRange = (timeframe: '7D' | '30D' | '90D') => {
  const dates = [];
  const today = new Date();

  if (timeframe === '7D') {
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
  } else {
    const days = timeframe === '30D' ? 30 : 90;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
  }
  return dates;
};

export default function WeeklyHoursGraph() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D'>('7D');
  
  // Date Search State
  const [dailyMap, setDailyMap] = useState<Record<string, number>>({});
  const [searchDate, setSearchDate] = useState<string>('');
  
  // Custom Calendar Popover State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch('/api/vscode/stats');
        const data = await res.json();

        const dateRange = generateDateRange(timeframe);
        const totals: Record<string, number> = {};

        data.forEach((doc: any) => {
          if (doc.date) {
            totals[doc.date] = (totals[doc.date] || 0) + (doc.totalTimeSeconds || 0);
          }
        });

        setDailyMap(totals);

        const todayStr = new Date().toISOString().split('T')[0];

        const formattedData = dateRange.map((dateStr) => {
          const seconds = totals[dateStr] || 0;
          const dateObj = new Date(dateStr);
          
          const label = timeframe === '7D' 
            ? dateObj.toLocaleDateString('en-US', { weekday: 'short' })
            : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return {
            date: dateStr,
            label,
            hours: Number((seconds / 3600).toFixed(2)),
            isFuture: dateStr > todayStr
          };
        });

        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [timeframe]);

  // Calendar Math
  const currentYear = calendarViewDate.getFullYear();
  const currentMonthIndex = calendarViewDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => setCalendarViewDate(new Date(currentYear, currentMonthIndex - 1, 1));
  const handleNextMonth = () => setCalendarViewDate(new Date(currentYear, currentMonthIndex + 1, 1));

  const handleDateSelect = (day: number) => {
    const m = String(currentMonthIndex + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setSearchDate(`${currentYear}-${m}-${d}`);
    setIsCalendarOpen(false);
  };

  const formattedSearchDate = searchDate 
    ? new Date(searchDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const timeframes = [
    { id: '7D', label: 'This Week' },
    { id: '30D', label: '30 Days' },
    { id: '90D', label: '90 Days' }
  ] as const;

  const chartMinWidth = timeframe === '90D' ? '2400px' : timeframe === '30D' ? '900px' : '100%';

  return (
    <div className="h-[32rem] rounded-2xl border border-white/10 bg-[#141414]/90 backdrop-blur-md p-6 sm:p-8 flex flex-col relative shadow-2xl overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-yellow-400 to-green-500 opacity-80" />
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center z-10 mb-6 gap-6 border-b border-white/5 pb-6">
        <div>
          <h4 className="text-xl font-bold text-white tracking-wide">Activity History</h4>
          <p className="text-sm text-gray-500 font-medium mt-1">Scroll horizontally to view past dates</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto relative">
          
          {/* Custom Date Search Trigger */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center bg-black/50 border border-white/10 hover:border-white/20 focus:border-yellow-500/50 rounded-xl px-4 py-2 transition-all duration-300 w-full sm:w-44 shadow-inner group"
            >
              <VscCalendar className={`w-4 h-4 mr-2 transition-colors ${isCalendarOpen || searchDate ? 'text-yellow-400' : 'text-gray-400 group-hover:text-gray-200'}`} />
              <span className={`text-xs font-medium ${searchDate ? 'text-white' : 'text-gray-500'}`}>
                {searchDate ? formattedSearchDate : 'Select a date...'}
              </span>
            </button>

            <AnimatePresence>
              {searchDate && (
                <motion.div 
                  initial={{ opacity: 0, x: -10, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -10, width: 0 }}
                  className="flex items-center overflow-hidden whitespace-nowrap"
                >
                  <div className="bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-lg flex items-center shadow-sm">
                    <span className="text-xs font-black text-yellow-400">
                      {formatTooltipTime((dailyMap[searchDate] || 0) / 3600)}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSearchDate('')}
                    className="ml-2 p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                    title="Clear search"
                  >
                    <VscClose className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Custom Calendar Popover */}
          <AnimatePresence>
            {isCalendarOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-12 left-0 sm:left-auto sm:right-auto z-50 bg-[#1c1c1c] border border-white/10 rounded-2xl shadow-2xl p-4 w-72 backdrop-blur-xl"
                >
                  {/* Calendar Header */}
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                      <VscChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-white tracking-wide">
                      {monthNames[currentMonthIndex]} {currentYear}
                    </span>
                    <button onClick={handleNextMonth} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                      <VscChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <span key={day} className="text-[10px] font-bold text-gray-500 uppercase">{day}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty slots for first day offset */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {/* Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const hasData = dailyMap[dateStr] > 0;
                      const isSelected = searchDate === dateStr;

                      return (
                        <button
                          key={day}
                          onClick={() => handleDateSelect(day)}
                          className={`relative h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-yellow-400 text-black shadow-md' 
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {day}
                          {/* Data Indicator Dot */}
                          {hasData && !isSelected && (
                            <span className="absolute bottom-1 w-1 h-1 bg-green-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="w-px h-6 bg-white/10 hidden sm:block" />

          {/* Timeframe Selector */}
          <div className="flex bg-black/50 p-1 rounded-xl border border-white/5 w-full sm:w-auto shadow-inner">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`flex-1 sm:flex-none relative px-4 py-1.5 text-xs font-bold rounded-lg transition-colors z-10 ${
                  timeframe === tf.id ? 'text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {timeframe === tf.id && (
                  <motion.div
                    layoutId="activeTimeframe"
                    className="absolute inset-0 bg-yellow-400 rounded-lg -z-10 shadow-[0_0_10px_rgba(250,204,21,0.4)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
        </div>
      ) : (
        /* Scrollable Chart Container */
        <div className="w-full flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-black/40 rounded-xl relative">
          <div style={{ minWidth: chartMinWidth }} className="h-full pr-4 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                  interval={0} 
                  angle={timeframe === '7D' ? 0 : -35} 
                  textAnchor={timeframe === '7D' ? 'middle' : 'end'}
                  dy={15}
                  dx={timeframe === '7D' ? 0 : -5}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(value) => `${value}h`}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      if (data.isFuture) return null; 

                      return (
                        <div className="bg-[#1e1e1e]/95 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
                          <p className="text-gray-400 font-semibold text-xs mb-1 uppercase tracking-wider">{data.date}</p>
                          <p className="text-yellow-400 text-2xl font-black flex items-baseline gap-1">
                            {formatTooltipTime(data.hours)}
                            <span className="text-sm text-gray-500 font-medium">logged</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="hours" 
                  radius={[4, 4, 4, 4]}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  maxBarSize={timeframe === '90D' ? 20 : timeframe === '30D' ? 24 : 40}
                >
                  {chartData.map((entry, index) => {
                    if (entry.isFuture) {
                      return <Cell key={`cell-${index}`} fill="rgba(255,255,255,0.02)" />;
                    }
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={activeIndex === index ? '#facc15' : 'url(#colorHours)'} 
                        className="transition-all duration-300 cursor-pointer"
                      />
                    );
                  })}
                </Bar>

                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#eab308" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}