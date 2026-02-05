import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoice } from '@/hooks/useVoice';
import {
  Sparkles, Mic, MicOff, Video, VideoOff, PhoneOff, SkipForward,
  Clock, Volume2, AlertCircle, ChevronLeft, Pause, Play,
  Moon, Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ThemeContext } from '@/App';

// Navigation Component
function InterviewNav({ onExit }: { onExit?: () => void }) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useContext(ThemeContext);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (onExit) onExit();
                navigate('/dashboard');
              }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">InterviewAI</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono">12:45</span>
            </div>
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

// Voice Stats Component
function VoiceStats({ pace, clarity, confidence }: { pace: number; clarity: number; confidence: number }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-4 bg-muted rounded-xl">
        <div className="text-2xl font-bold text-blue-500">{pace}</div>
        <div className="text-xs text-muted-foreground mt-1">Words/min</div>
      </div>
      <div className="text-center p-4 bg-muted rounded-xl">
        <div className="text-2xl font-bold text-green-500">{clarity}%</div>
        <div className="text-xs text-muted-foreground mt-1">Clarity</div>
      </div>
      <div className="text-center p-4 bg-muted rounded-xl">
        <div className="text-2xl font-bold text-purple-500">{confidence}%</div>
        <div className="text-xs text-muted-foreground mt-1">Confidence</div>
      </div>
    </div>
  );
}



// Main Interview Practice Page
export function InterviewPractice() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Create a unique session ID for this interaction
  const sessionId = useMemo(() => `session_${Math.random().toString(36).substr(2, 9)}`, []);

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize Voice hook
  const {
    start: startVoice,
    stop: stopVoice,
    liveText,
    finalText,
    isRecording: isListening,
    setFinalText
  } = useVoice(sessionId, `q${currentQuestion}`);

  // Sample questions
  const questions = [
    "Tell me about yourself and your background in software development.",
    "What is your greatest strength and how does it help you in your work?",
    "Describe a challenging project you worked on and how you overcame obstacles.",
    "Why do you want to work at our company?",
    "Where do you see yourself in five years?",
  ];

  // Cleanup and stop all media
  const stopAllMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    stopVoice();
  };

  // Initialize camera
  useEffect(() => {
    let isMounted = true;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      stopAllMedia();
    };
  }, []);

  // Re-attach stream when video element is remounted
  useEffect(() => {
    if (isVideoOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isVideoOn]);

  // Toggle video
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  // Toggle microphone and start/stop transcription
  const toggleMic = () => {
    const newMicState = !isMicOn;
    setIsMicOn(newMicState);

    // Update stream audio tracks
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newMicState;
      });
    }

    if (newMicState) {
      startVoice();
    } else {
      stopVoice();
    }
  };

  // Next question
  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      stopVoice(); // Stop current recording
      setCurrentQuestion(currentQuestion + 1);
      setFinalText('');
      setIsMicOn(false);
    } else {
      // End interview
      stopAllMedia();
      navigate('/results');
    }
  };

  // End interview
  const endInterview = () => {
    setShowExitConfirm(true);
  };

  const confirmEnd = () => {
    stopAllMedia();
    navigate('/results');
  };

  return (
    <div className="min-h-screen bg-background">
      <InterviewNav onExit={stopAllMedia} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Side - Camera */}
          <div className="space-y-4">
            {/* Camera Preview */}
            <div className="relative aspect-video bg-dark rounded-3xl overflow-hidden">
              {isVideoOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark to-dark-50">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <VideoOff className="w-10 h-10 text-muted-foreground" />
                  </div>
                </div>
              )}

              {/* Overlay Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoOn ? 'bg-muted/80 hover:bg-muted' : 'bg-red-500 hover:bg-red-600'
                    }`}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-white" />}
                </button>
                <button
                  onClick={toggleMic}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-purple-500 hover:bg-purple-600' : 'bg-muted/80 hover:bg-muted'
                    }`}
                >
                  {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={endInterview}
                  className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
                >
                  <PhoneOff className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Recording Indicator */}
              {isListening && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 rounded-full">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-xs text-white font-medium">Recording</span>
                </div>
              )}
            </div>

            {/* Voice Stats */}
            <VoiceStats pace={145} clarity={87} confidence={82} />
          </div>

          {/* Right Side - Question & Transcription */}
          <div className="space-y-4">
            {/* Question Card */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <Progress value={(currentQuestion + 1) / questions.length * 100} className="w-24" />
              </div>
              <h2 className="text-xl font-semibold leading-relaxed">
                {questions[currentQuestion]}
              </h2>
            </div>

            {/* Transcription */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-purple-500" />
                  Live Transcription
                </h3>
                {isListening && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-muted-foreground">Listening...</span>
                  </div>
                )}
              </div>
              <div className="min-h-[120px] max-h-[200px] overflow-y-auto">
                {finalText || liveText ? (
                  <div className="space-y-2">
                    {finalText && <p className="text-foreground leading-relaxed">{finalText}</p>}
                    {liveText && <p className="text-orange-500 leading-relaxed italic">{liveText}</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    {isListening ? 'Start speaking...' : 'Click the microphone to start'}
                  </p>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Pro Tip</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Speak clearly and at a moderate pace. Use the STAR method (Situation, Task, Action, Result) for behavioral questions.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                className="flex-1 h-12 bg-purple-500 hover:bg-purple-600"
                onClick={nextQuestion}
              >
                <SkipForward className="w-5 h-5 mr-2" />
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 max-w-md mx-4 border border-border">
            <h3 className="text-xl font-semibold mb-2">End Interview?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to end this interview? Your progress will be saved.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowExitConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={confirmEnd}
              >
                End Interview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
