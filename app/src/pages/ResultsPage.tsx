import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, Home, RotateCcw, Share2, Download, TrendingUp,
  CheckCircle, AlertTriangle, Lightbulb, XCircle,
  Moon, Sun, Clock, Eye, User, Activity
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
  const location = useLocation();
  const [showShareModal, setShowShareModal] = useState(false);

  // Get analysis data from navigation state (from both backends)
  const verbalAnalysis = location.state?.verbalAnalysis || location.state?.analysisData;
  const nonVerbalAnalysis = location.state?.nonVerbalAnalysis;

  // Extract verbal metrics
  const hasVerbalData = verbalAnalysis && verbalAnalysis.metrics;
  const verbalMetrics = hasVerbalData ? verbalAnalysis.metrics : {
    avg_wpm: 145,
    filler_rate: 0.08,
    pause_ratio: 0.15,
    pitch_variation: 0.12,
    duration: 1500
  };
  const verbalConfidence = hasVerbalData ? verbalAnalysis.confidence_score : 0.82;

  // Extract non-verbal metrics
  const hasNonVerbalData = nonVerbalAnalysis && nonVerbalAnalysis.non_verbal_scores;
  const nonVerbalScores = hasNonVerbalData ? nonVerbalAnalysis.non_verbal_scores : {
    eye_contact: 85,
    facial_expression: 72,
    posture: 78,
    stability: 80,
    final_non_verbal_score: 78
  };
  const nonVerbalPassStatus = nonVerbalAnalysis?.pass_status || 'pass';

  // Calculate derived scores
  const verbalScore = Math.round(verbalConfidence * 100);
  const nonVerbalScore = nonVerbalScores.final_non_verbal_score ?? 78;

  // Combined overall score: 40% verbal, 60% non-verbal
  const overallScore = Math.round(0.4 * verbalScore + 0.6 * nonVerbalScore);
  const overallPassStatus = overallScore >= 60 ? 'pass' : 'fail';

  // Voice-specific scores
  const wpmScore = Math.min(100, Math.round(verbalMetrics.avg_wpm / 1.6));
  const clarityScore = Math.round((1 - verbalMetrics.pause_ratio) * 100);
  const fillerScore = Math.round((1 - verbalMetrics.filler_rate) * 100);

  // Performance data for radar chart
  const categoryScores = [
    { category: 'Voice', score: verbalScore, fullMark: 100 },
    { category: 'Eye Contact', score: Math.round(nonVerbalScores.eye_contact ?? 0), fullMark: 100 },
    { category: 'Posture', score: Math.round(nonVerbalScores.posture ?? 0), fullMark: 100 },
    { category: 'Expression', score: Math.round(nonVerbalScores.facial_expression ?? 0), fullMark: 100 },
    { category: 'Clarity', score: clarityScore, fullMark: 100 },
    { category: 'Stability', score: Math.round(nonVerbalScores.stability ?? 0), fullMark: 100 },
  ];

  const breakdownData = [
    { name: 'Verbal', score: verbalScore, fill: '#3B82F6' },
    { name: 'Non-Verbal', score: Math.round(nonVerbalScore), fill: '#8B5CF6' },
    { name: 'Clarity', score: clarityScore, fill: '#10B981' },
    { name: 'WPM', score: wpmScore, fill: '#F59E0B' },
  ];

  // Generate improvement tips based on actual scores
  const improvementTips = [];

  // Verbal tips
  if (verbalMetrics.avg_wpm > 120 && verbalMetrics.avg_wpm < 180) {
    improvementTips.push({
      icon: CheckCircle,
      title: 'Great Speaking Pace',
      description: `Your pace of ${Math.round(verbalMetrics.avg_wpm)} WPM is excellent for interviews.`,
      type: 'success' as const,
    });
  } else {
    improvementTips.push({
      icon: AlertTriangle,
      title: 'Adjust Speaking Pace',
      description: `Your pace was ${Math.round(verbalMetrics.avg_wpm)} WPM. Aim for 120-180 WPM.`,
      type: 'warning' as const,
    });
  }

  if (verbalMetrics.filler_rate < 0.1) {
    improvementTips.push({
      icon: CheckCircle,
      title: 'Minimal Filler Words',
      description: `Only ${Math.round(verbalMetrics.filler_rate * 100)}% filler words. Great job!`,
      type: 'success' as const,
    });
  } else {
    improvementTips.push({
      icon: AlertTriangle,
      title: 'Reduce Filler Words',
      description: `${Math.round(verbalMetrics.filler_rate * 100)}% filler rate. Try to reduce "um" and "uh".`,
      type: 'warning' as const,
    });
  }

  // Non-verbal tips
  if ((nonVerbalScores.eye_contact ?? 0) < 60) {
    improvementTips.push({
      icon: Lightbulb,
      title: 'Improve Eye Contact',
      description: 'Try to maintain more consistent eye contact with the camera.',
      type: 'tip' as const,
    });
  }

  if ((nonVerbalScores.posture ?? 0) < 60) {
    improvementTips.push({
      icon: Lightbulb,
      title: 'Work on Posture',
      description: 'Sit up straight and keep your shoulders relaxed.',
      type: 'tip' as const,
    });
  }

  const sessionStats = {
    duration: `${Math.round(verbalMetrics.duration / 60)} min`,
    questions: 5,
    answered: 5,
    wordsSpoken: Math.round(verbalMetrics.avg_wpm * (verbalMetrics.duration / 60)),
  };

  return (
    <div className="min-h-screen bg-background">
      <ResultsNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${overallPassStatus === 'pass'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}>
            {overallPassStatus === 'pass' ? (
              <><CheckCircle className="w-4 h-4" /><span>Interview Passed!</span></>
            ) : (
              <><XCircle className="w-4 h-4" /><span>Needs Improvement</span></>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold mb-2">
            {overallPassStatus === 'pass' ? 'Great Job!' : 'Keep Practicing!'}
          </h1>
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
              <h2 className="text-2xl font-semibold mb-2">
                {overallScore >= 80 ? 'Excellent Performance!' : overallScore >= 60 ? 'Good Performance!' : 'Room for Improvement'}
              </h2>
              <p className="text-white/80 mb-4">
                {overallScore >= 80
                  ? 'You scored in the top 15% of all candidates. Your communication skills are impressive.'
                  : overallScore >= 60
                    ? 'You passed! Keep practicing to improve your score further.'
                    : 'Focus on the improvement tips below to boost your performance.'}
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                  <span className="text-sm">Verbal: {verbalScore}%</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                  <span className="text-sm">Non-Verbal: {Math.round(nonVerbalScore)}%</span>
                </div>
              </div>
            </div>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ScoreCircle score={verbalScore} label="Verbal" color="#3B82F6" />
          <ScoreCircle score={Math.round(nonVerbalScore)} label="Non-Verbal" color="#8B5CF6" />
          <ScoreCircle score={Math.round(nonVerbalScores.eye_contact ?? 0)} label="Eye Contact" color="#10B981" />
          <ScoreCircle score={Math.round(nonVerbalScores.posture ?? 0)} label="Posture" color="#F59E0B" />
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
      </main >

      {/* Share Modal */}
      {
        showShareModal && (
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
        )
      }
    </div >
  );
}
