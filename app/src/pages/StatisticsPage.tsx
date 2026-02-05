import { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ChevronLeft, TrendingUp, Award, Clock,
  BarChart3, ChevronDown, Moon, Sun, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeContext } from '@/App';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Navigation Component
function StatisticsNav() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useContext(ThemeContext);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Statistics</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
}) {
  const changeColors = {
    positive: 'text-green-500',
    negative: 'text-red-500',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Icon className="w-6 h-6 text-purple-500" />
        </div>
        <span className={`text-sm font-medium ${changeColors[changeType]}`}>
          {change}
        </span>
      </div>
      <p className="text-muted-foreground text-sm">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

// Main Statistics Page
export function StatisticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const statsRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!statsRef.current) return;

    setIsExporting(true);
    try {
      const element = statsRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('interview-statistics.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Performance over time data
  const performanceData = [
    { date: 'Mon', score: 65, sessions: 2 },
    { date: 'Tue', score: 72, sessions: 3 },
    { date: 'Wed', score: 68, sessions: 1 },
    { date: 'Thu', score: 78, sessions: 2 },
    { date: 'Fri', score: 82, sessions: 3 },
    { date: 'Sat', score: 85, sessions: 2 },
    { date: 'Sun', score: 88, sessions: 1 },
  ];

  // Category performance data
  const categoryData = [
    { name: 'Technical', score: 82, fullMark: 100 },
    { name: 'Behavioral', score: 75, fullMark: 100 },
    { name: 'System Design', score: 68, fullMark: 100 },
    { name: 'Communication', score: 88, fullMark: 100 },
    { name: 'Problem Solving', score: 79, fullMark: 100 },
  ];

  // Session distribution data
  const sessionDistribution = [
    { name: 'Completed', value: 18, color: '#7F56D9' },
    { name: 'In Progress', value: 4, color: '#3B82F6' },
    { name: 'Abandoned', value: 2, color: '#EF4444' },
  ];

  // Weekly activity data
  const weeklyActivity = [
    { day: 'Mon', hours: 1.5 },
    { day: 'Tue', hours: 2.0 },
    { day: 'Wed', hours: 0.5 },
    { day: 'Thu', hours: 1.0 },
    { day: 'Fri', hours: 2.5 },
    { day: 'Sat', hours: 1.5 },
    { day: 'Sun', hours: 0.5 },
  ];

  // Recent achievements
  const achievements = [
    { title: '7-Day Streak', description: 'Practiced for 7 consecutive days', date: '2 days ago', icon: '🔥' },
    { title: 'Perfect Score', description: 'Achieved 100% on a technical question', date: '5 days ago', icon: '⭐' },
    { title: 'First Interview', description: 'Completed your first mock interview', date: '2 weeks ago', icon: '🎯' },
    { title: 'Voice Master', description: 'Maintained 90%+ clarity for 5 sessions', date: '3 weeks ago', icon: '🎤' },
  ];

  const timeRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '1y', label: 'Last Year' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <StatisticsNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-1">Your Progress</h1>
            <p className="text-muted-foreground">Track your interview preparation journey</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none bg-card border border-border rounded-xl px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
              >
                {timeRanges.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>

        <div ref={statsRef}>
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Sessions"
              value="24"
              change="+12%"
              changeType="positive"
              icon={BarChart3}
            />
            <StatCard
              title="Average Score"
              value="82%"
              change="+5%"
              changeType="positive"
              icon={TrendingUp}
            />
            <StatCard
              title="Practice Time"
              value="12.5h"
              change="+2.5h"
              changeType="positive"
              icon={Clock}
            />
            <StatCard
              title="Current Streak"
              value="7 days"
              change="Personal best!"
              changeType="positive"
              icon={Award}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Performance Trend */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Performance Trend</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>+15% improvement</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7F56D9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7F56D9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#7F56D9"
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Weekly Activity</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>9.5 hours total</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                    />
                    <Bar dataKey="hours" fill="#7F56D9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Second Row of Charts */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Category Performance */}
            <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-semibold mb-6">Performance by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                    />
                    <Bar dataKey="score" fill="#7F56D9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Session Distribution */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-semibold mb-6">Session Distribution</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sessionDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sessionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {sessionDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Recent Achievements</h3>
              <Button variant="outline" size="sm">
                <Award className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="p-4 bg-muted rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h4 className="font-medium mb-1">{achievement.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                  <p className="text-xs text-muted-foreground">{achievement.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
