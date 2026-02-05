import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Mic, Eye, MessageSquare, TrendingUp, BarChart3,
  ChevronRight, Star, Quote, Menu, X, Moon, Sun,
  Twitter, Linkedin, Facebook, Instagram,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeContext } from '@/App';
import { useContext } from 'react';

// Navigation Component
function Navigation() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-dark-200/80 backdrop-blur-lg shadow-soft' : 'bg-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">InterviewAI</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-muted-foreground hover:text-foreground transition-colors">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-muted-foreground hover:text-foreground transition-colors">How It Works</button>
            <button onClick={() => scrollToSection('testimonials')} className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</button>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Button
              variant="ghost"
              className="hidden sm:flex"
              onClick={() => navigate('/login')}
            >
              Log In
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600 text-white hidden sm:flex"
              onClick={() => navigate('/login')}
            >
              Get Started
            </Button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollToSection('features')} className="text-left text-muted-foreground hover:text-foreground transition-colors">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-left text-muted-foreground hover:text-foreground transition-colors">How It Works</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-left text-muted-foreground hover:text-foreground transition-colors">Testimonials</button>
              <Button
                className="bg-purple-500 hover:bg-purple-600 text-white w-full"
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-4s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-500/5 to-transparent rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Interview Practice</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-tight">
              <span className="block">Practice Interviews</span>
              <span className="block text-gradient">with AI</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground max-w-xl">
              Master your interview skills with AI-powered practice sessions. Get instant feedback, improve your responses, and land your dream job.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-purple-500 hover:bg-purple-600 text-white text-lg px-8 py-6 rounded-xl animate-pulse-glow"
                onClick={() => navigate('/login')}
              >
                Get Started
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 rounded-xl"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-foreground">50K+</div>
                <div className="text-sm text-muted-foreground">Users Practicing</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Interview Questions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">95%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="relative">
              {/* Background Circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[90%] aspect-square rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-800/10 animate-spin-slow" />
              </div>

              {/* Hero Image */}
              <img
                src="/images/hero-person.jpg"
                alt="Interview Practice"
                className="relative z-10 w-full max-w-lg mx-auto animate-float rounded-3xl shadow-2xl"
              />

              {/* Floating Cards */}
              <div className="absolute top-10 -left-4 glass-card p-4 animate-float" style={{ animationDelay: '-2s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Confidence Score</div>
                    <div className="text-lg font-bold text-green-600">+47%</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 -right-4 glass-card p-4 animate-float" style={{ animationDelay: '-4s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Rating</div>
                    <div className="text-lg font-bold text-purple-600">4.9/5</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Client Logos Section
function ClientLogos() {
  const logos = [
    { name: 'Google', icon: 'G' },
    { name: 'Microsoft', icon: 'M' },
    { name: 'Amazon', icon: 'A' },
    { name: 'Meta', icon: 'F' },
    { name: 'Apple', icon: '' },
    { name: 'Netflix', icon: 'N' },
    { name: 'Spotify', icon: 'S' },
    { name: 'Airbnb', icon: 'A' },
  ];

  return (
    <section className="py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <p className="text-center text-muted-foreground text-sm uppercase tracking-wider">
          Top companies trust us with their interview prep
        </p>
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

        {/* Marquee */}
        <div className="flex animate-marquee">
          {[...logos, ...logos].map((logo, i) => (
            <div
              key={i}
              className="flex items-center justify-center mx-12 min-w-[120px] h-16 grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300"
            >
              <span className="text-2xl font-bold text-foreground">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: 'AI Question Generator',
      description: 'Get unlimited AI-generated interview questions tailored to your target role and experience level.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Mic,
      title: 'Voice Analysis',
      description: 'Receive detailed feedback on your tone, pace, clarity, and filler words to sound more confident.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Eye,
      title: 'Body Language Feedback',
      description: 'Our AI analyzes your posture, eye contact, and gestures to help you make a great impression.',
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <section id="features" ref={sectionRef} className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">Powerful Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to ace your next interview, powered by cutting-edge AI technology.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative bg-card rounded-3xl p-8 border border-border hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-soft-lg ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      icon: MessageSquare,
      title: 'Choose Your Role',
      description: 'Select from 50+ job roles across tech, marketing, sales, and more. Our AI adapts to your specific industry.',
    },
    {
      icon: Mic,
      title: 'Practice with AI',
      description: 'Answer questions in a realistic interview setting. Speak naturally while our AI analyzes your responses.',
    },
    {
      icon: TrendingUp,
      title: 'Get Detailed Feedback',
      description: 'Receive comprehensive analysis of your performance with actionable suggestions for improvement.',
    },
    {
      icon: BarChart3,
      title: 'Track Your Progress',
      description: 'Monitor your improvement over time with detailed analytics and performance trends.',
    },
  ];

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start practicing in minutes with our simple four-step process.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${activeStep === index
                    ? 'bg-purple-500/10 border-2 border-purple-500/30'
                    : 'bg-card border-2 border-transparent hover:bg-muted'
                  } ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeStep === index
                      ? 'bg-purple-500 text-white'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-purple-500">Step {index + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Image */}
          <div className={`relative transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
              <img
                src="/images/how-it-works-person.jpg"
                alt="How It Works"
                className="relative rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer at Google',
      image: '/images/testimonial-1.jpg',
      quote: 'InterviewAI helped me land my dream job. The AI feedback was incredibly detailed and helped me improve my technical communication.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager at Meta',
      image: '/images/testimonial-2.jpg',
      quote: 'I practiced for 2 weeks using this platform and went from nervous to confident. The voice analysis feature is a game-changer.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Marketing Director',
      image: '/images/testimonial-3.jpg',
      quote: 'The body language feedback was eye-opening. I never realized how much my posture was affecting my interviews.',
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" ref={sectionRef} className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">What Our Users Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of job seekers who have transformed their interview skills.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className={`relative bg-card rounded-3xl p-8 border border-border hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-soft-lg ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-purple-500/20" />

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-muted-foreground">{testimonial.quote}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who have transformed their interview skills with InterviewAI. Start practicing for free today.
          </p>
          <Button
            size="lg"
            className="bg-purple-500 hover:bg-purple-600 text-white text-lg px-10 py-6 rounded-xl animate-pulse-glow"
            onClick={() => navigate('/login')}
          >
            Get Started for Free
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="py-16 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">InterviewAI</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Master your interview skills with AI-powered practice.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><button onClick={() => scrollToSection('features')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">Features</button></li>
              <li><button onClick={() => scrollToSection('how-it-works')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">How It Works</button></li>
              <li><button onClick={() => scrollToSection('testimonials')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">Testimonials</button></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><span className="text-muted-foreground text-sm">Blog</span></li>
              <li><span className="text-muted-foreground text-sm">Help Center</span></li>
              <li><span className="text-muted-foreground text-sm">Contact Us</span></li>
              <li><span className="text-muted-foreground text-sm">FAQ</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><span className="text-muted-foreground text-sm">Privacy Policy</span></li>
              <li><span className="text-muted-foreground text-sm">Terms of Service</span></li>
              <li><span className="text-muted-foreground text-sm">Cookie Policy</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 InterviewAI. All rights reserved.
          </p>
          <div className="flex gap-4">
            {[
              { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
              { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
              { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
              { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' }
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-purple-500 hover:text-white transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <ClientLogos />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
