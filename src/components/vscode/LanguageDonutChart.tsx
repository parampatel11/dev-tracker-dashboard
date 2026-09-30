'use client';

import { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3b82f6',
  JavaScript: '#eab308',
  React: '#06b6d4',
  JSON: '#9ca3af',
  HTML: '#f97316',
  CSS: '#6366f1',
  Markdown: '#ffffff',
  Other: '#71717a'
};

export default function LanguageDonutChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/vscode/stats');
        const data = await res.json();
        
        const aggregated: Record<string, number> = {};
        let totalTime = 0;

        data.forEach((doc: any) => {
          if (doc.languages) {
            doc.languages.forEach((langObj: any) => {
              const rawLang = langObj.name || 'Other';
              let lang = 'Other';

              const normalized = rawLang.toLowerCase();
              if (normalized.includes('typescriptreact') || normalized.includes('jsx') || normalized.includes('tsx')) lang = 'React';
              else if (normalized.includes('typescript') || normalized.includes('ts')) lang = 'TypeScript';
              else if (normalized.includes('javascript') || normalized.includes('js')) lang = 'JavaScript';
              else if (normalized.includes('json') || normalized.includes('jsonc')) lang = 'JSON';
              else if (normalized.includes('markdown') || normalized.includes('md')) lang = 'Markdown';
              else if (normalized.includes('html')) lang = 'HTML';
              else if (normalized.includes('css')) lang = 'CSS';

              const time = langObj.timeSeconds || 0;
              aggregated[lang] = (aggregated[lang] || 0) + time;
              totalTime += time;
            });
          }
        });

        const formatted = Object.keys(aggregated).map((lang) => ({
          name: lang,
          value: aggregated[lang],
          percentage: totalTime > 0 ? Math.round((aggregated[lang] / totalTime) * 100) : 0
        })).sort((a, b) => b.value - a.value);

        setChartData(formatted);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-96 rounded-2xl border border-white/5 bg-[#1e1e1e]/50 backdrop-blur-md flex items-center justify-center shadow-lg">
        <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (chartData.length === 0 || chartData.every(item => item.value === 0)) {
    return (
      <div className="h-96 rounded-2xl border border-white/5 bg-[#1e1e1e]/50 backdrop-blur-md flex flex-col items-center justify-center text-gray-500 shadow-lg">
        <p>No telemetry data available for language split yet.</p>
      </div>
    );
  }

  return (
    <div className="h-96 rounded-2xl border border-white/10 bg-[#141414]/80 backdrop-blur-md p-6 flex flex-col justify-between relative shadow-2xl overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-blue-500 opacity-80" />
      
      <div className="flex justify-between items-center z-10">
        <h4 className="text-lg font-bold text-white tracking-wide">Language Breakdown</h4>
        <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">Overall Usage</span>
      </div>

      <div className="w-full h-64 flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={6}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell 
                  key={`cell-${entry.name}`} 
                  fill={LANGUAGE_COLORS[entry.name] || '#71717a'} 
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-zinc-900/95 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md">
                      <p className="text-white font-bold text-sm">{data.name}</p>
                      <p className="text-yellow-400 text-xs font-semibold mt-1">{data.percentage}% of total coding time</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-center gap-4 z-10 pt-2 border-t border-white/5">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full shadow-sm" 
              style={{ backgroundColor: LANGUAGE_COLORS[entry.name] || '#71717a' }} 
            />
            <span className="text-xs font-medium text-gray-300">{entry.name}</span>
            <span className="text-[10px] text-gray-500 font-bold">{entry.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}