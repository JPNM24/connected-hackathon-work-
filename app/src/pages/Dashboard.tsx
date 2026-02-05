import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Play, Settings, LogOut,
  User, BarChart3, ChevronRight, Clock, TrendingUp, Award,
  Code, Palette, Database, LineChart, Megaphone, Briefcase,
  Moon, Sun, Bell, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeContext, AuthContext } from '@/App';
import { supabase } from '@/lib/supabase';

// Role types
interface Role {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  color: string;
  questions: number;
}

// Session type
interface Session {
  id: string;
  role: string;
  date: string;
  score: number;
  duration: string;
  status: 'completed' | 'in-progress';
}

// Navigation Component
interface DashboardNavProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function DashboardNav({ searchQuery, setSearchQuery }: DashboardNavProps) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userAvatar, setUserAvatar] = useState('/images/testimonial-1.jpg');

  const notifications = [
    { id: 1, text: "New interview practice available", time: "2m ago", unread: true },
    { id: 2, text: "Your profile was updated successfully", time: "1h ago", unread: false },
    { id: 3, text: "Welcome to InterviewAI!", time: "1d ago", unread: false },
  ];

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (profile.full_name) setUserName(profile.full_name);
          if (profile.avatar_url) setUserAvatar(profile.avatar_url);
        } else if (session.user.user_metadata?.full_name) {
          setUserName(session.user.user_metadata.full_name);
        }
      }
    };
    getProfile();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">InterviewAI</span>
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search roles, questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-xl border border-border shadow-lg py-2 overflow-hidden">
                  <div className="px-4 py-2 border-b border-border">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className={`px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50 last:border-0 ${notif.unread ? 'bg-purple-500/5' : ''}`}>
                        <p className="text-sm font-medium mb-1">{notif.text}</p>
                        <p className="text-xs text-muted-foreground">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-border bg-muted/20 text-center">
                    <button className="text-xs text-purple-500 hover:text-purple-600 font-medium">Mark all as read</button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <img
                  src={userAvatar}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <span className="hidden sm:block font-medium">{userName}</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-lg py-2">
                  <button
                    onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => { navigate('/statistics'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Statistics</span>
                  </button>
                  <button
                    onClick={() => { navigate('/dashboard'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </button>
                  <div className="border-t border-border my-2" />
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted text-red-500 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Stats Card Component
function StatCard({ title, value, change, icon: Icon, color }: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {change}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Role Card Component
function RoleCard({ role, onSelect }: { role: Role; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="group relative bg-card rounded-2xl p-6 border border-border hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-soft-lg text-left"
    >
      <div className={`w-14 h-14 rounded-2xl ${role.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <role.icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="font-semibold text-lg mb-1">{role.name}</h3>
      <p className="text-muted-foreground text-sm mb-3">{role.category}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{role.questions} questions</span>
        <ChevronRight className="w-5 h-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

// Session Card Component
function SessionCard({ session }: { session: Session }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-purple-500/30 transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${session.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
        }`}>
        {session.status === 'completed' ? (
          <Award className="w-6 h-6 text-green-600" />
        ) : (
          <Play className="w-6 h-6 text-purple-600" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{session.role}</h4>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {session.date}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {session.duration}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-purple-500">{session.score}%</div>
        <div className="text-xs text-muted-foreground">Score</div>
      </div>
      {session.status === 'in-progress' && (
        <Button
          size="sm"
          className="bg-purple-500 hover:bg-purple-600"
          onClick={() => navigate('/interview')}
        >
          Continue
        </Button>
      )}
    </div>
  );
}

// Main Dashboard
export function Dashboard() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();

        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else if (session.user.user_metadata?.full_name) {
          setUserName(session.user.user_metadata.full_name);
        }
      }
    };
    getProfile();
  }, []);

  const roles: Role[] = [
    { id: '1', name: 'Software Engineer', category: 'Engineering', icon: Code, color: 'bg-blue-500', questions: 150 },
    { id: '2', name: 'Product Designer', category: 'Design', icon: Palette, color: 'bg-pink-500', questions: 80 },
    { id: '3', name: 'Backend Developer', category: 'Engineering', icon: Database, color: 'bg-green-500', questions: 120 },
    { id: '4', name: 'Data Analyst', category: 'Data', icon: LineChart, color: 'bg-yellow-500', questions: 90 },
    { id: '5', name: 'Marketing Manager', category: 'Marketing', icon: Megaphone, color: 'bg-orange-500', questions: 70 },
    { id: '6', name: 'Product Manager', category: 'Product', icon: Briefcase, color: 'bg-purple-500', questions: 100 },
  ];

  const categories = ['all', 'Engineering', 'Design', 'Data', 'Marketing', 'Product'];

  const filteredRoles = roles.filter(role => {
    const matchesCategory = selectedCategory === 'all' || role.category === selectedCategory;
    const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const recentSessions: Session[] = [
    { id: '1', role: 'Software Engineer', date: 'Today', score: 85, duration: '25 min', status: 'completed' },
    { id: '2', role: 'Product Designer', date: 'Yesterday', score: 78, duration: '30 min', status: 'completed' },
    { id: '3', role: 'Backend Developer', date: '2 days ago', score: 0, duration: '15 min', status: 'in-progress' },
  ];

  const stats = [
    { title: 'Total Sessions', value: '24', change: '+12%', icon: Play, color: 'bg-blue-500' },
    { title: 'Average Score', value: '82%', change: '+5%', icon: TrendingUp, color: 'bg-green-500' },
    { title: 'Practice Time', value: '12h', change: '+2.5h', icon: Clock, color: 'bg-purple-500' },
    { title: 'Best Score', value: '94%', change: '+3%', icon: Award, color: 'bg-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Welcome back, {userName}! 👋</h1>
          <p className="text-muted-foreground">Ready to practice and improve your interview skills?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-3xl p-8 mb-10 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Continue Your Practice</h2>
              <p className="text-white/80">You have an ongoing session for Backend Developer role.</p>
            </div>
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-white/90"
              onClick={() => navigate('/interview')}
            >
              <Play className="w-5 h-5 mr-2" />
              Resume Session
            </Button>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold">Choose a Role to Practice</h2>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat
                    ? 'bg-purple-500 text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onSelect={() => navigate('/interview')}
              />
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Recent Sessions</h2>
            <button
              onClick={() => navigate('/statistics')}
              className="text-purple-500 hover:text-purple-600 flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {recentSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
