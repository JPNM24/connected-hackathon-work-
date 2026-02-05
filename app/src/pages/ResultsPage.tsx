import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Home, RotateCcw, Share2, Download, TrendingUp, 
  CheckCircle, AlertTriangle, Lightbulb,
  Moon, Sun, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// Progress component not used
import { ThemeContext } from '@/App';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';

// Navigation Component
function ResultsNav() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useContext(ThemeContext);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">InterviewAI</span>
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

// Score Circle Component
function ScoreCircle({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx="56"
            cy="56"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground mt-2">{label}</span>
    </div>
  );
}

// Improvement Tip Component
function ImprovementTip({ icon: Icon, title, description, type }: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  type: 'success' | 'warning' | 'tip';
}) {
  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    tip: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  const iconColors = {
    success: 'text-green-500',
    warning: 'text-yellow-500',
    tip: 'text-blue-500',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[type]}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${iconColors[type]}`} />
        <div>
          <h4 className="font-medium mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Main Results Page
export function ResultsPage() {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);

  // Performance data
  const overallScore = 82;
  
  const categoryScores = [
    { category: 'Voice', score: 85, fullMark: 100 },
    { category: 'Knowledge', score: 78, fullMark: 100 },
    { category: 'Body Language', score: 88, fullMark: 100 },
    { category: 'Confidence', score: 82, fullMark: 100 },
    { category: 'Clarity', score: 90, fullMark: 100 },
    { category: 'Structure', score: 75, fullMark: 100 },
  ];

  const breakdownData = [
    { name: 'Voice', score: 85, fill: '#3B82F6' },
    { name: 'Knowledge', score: 78, fill: '#8B5CF6' },
    { name: 'Body Lang', score: 88, fill: '#10B981' },
  ];

  const improvementTips = [
    {
      icon: CheckCircle,
      title: 'Great Voice Clarity',
      description: 'Your speech was clear and well-paced. Keep maintaining this level of articulation.',
      type: 'success' as const,
    },
    {
      icon: AlertTriangle,
      title: 'Filler Words Detected',
      description: 'Try to reduce "um" and "uh" usage. Take brief pauses instead to gather your thoughts.',
      type: 'warning' as const,
    },
    {
      icon: Lightbulb,
      title: 'Use More Examples',
      description: 'Support your answers with specific examples from your experience using the STAR method.',
      type: 'tip' as const,
    },
    {
      icon: Lightbulb,
      title: 'Maintain Eye Contact',
      description: 'Your body language was good, but try to look at the camera more consistently.',
      type: 'tip' as const,
    },
  ];

  const sessionStats = {
    duration: '25 min',
    questions: 5,
    answered: 5,
    wordsSpoken: 1245,
  };

  return (
    <div className="min-h-screen bg-background">
      <ResultsNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium mb-4">
            <CheckCircle className="w-4 h-4" />
            <span>Interview Completed</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold mb-2">Great Job, Sarah!</h1>
          <p className="text-muted-foreground">Here's your performance breakdown</p>
        </div>

        {/* Overall Score */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start">
              <div className="relative w-40 h-40 mb-4">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="white"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 70}
                    strokeDashoffset={2 * Math.PI * 70 * (1 - overallScore / 100)}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold">{overallScore}</span>
                  <span className="text-white/70 text-sm">Overall</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-semibold mb-2">Excellent Performance!</h2>
              <p className="text-white/80 mb-4">
                You scored in the top 15% of all candidates. Your communication skills and technical knowledge are impressive.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{sessionStats.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>{sessionStats.answered}/{sessionStats.questions} Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>{sessionStats.wordsSpoken} Words</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="font-semibold mb-6">Performance Overview</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={categoryScores}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Performance"
                    dataKey="score"
                    stroke="#7F56D9"
                    fill="#7F56D9"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="font-semibold mb-6">Category Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <ScoreCircle score={85} label="Voice" color="#3B82F6" />
          <ScoreCircle score={78} label="Knowledge" color="#8B5CF6" />
          <ScoreCircle score={88} label="Body Language" color="#10B981" />
        </div>

        {/* Improvement Tips */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Improvement Tips</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {improvementTips.map((tip, index) => (
              <ImprovementTip key={index} {...tip} />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            className="flex-1 h-12"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-12"
            onClick={() => navigate('/interview')}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Practice Again
          </Button>
          <Button 
            className="flex-1 h-12 bg-purple-500 hover:bg-purple-600"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Results
          </Button>
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 max-w-md mx-4 border border-border">
            <h3 className="text-xl font-semibold mb-4">Share Your Results</h3>
            <p className="text-muted-foreground mb-6">
              Share your interview performance with friends or mentors.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {['LinkedIn', 'Twitter', 'Email'].map((platform) => (
                <button 
                  key={platform}
                  className="p-4 rounded-xl bg-muted hover:bg-purple-500 hover:text-white transition-colors"
                >
                  <span className="text-sm font-medium">{platform}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-purple-500 hover:bg-purple-600"
                onClick={() => setShowShareModal(false)}
              >
                <Download className="w-5 h-5 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
