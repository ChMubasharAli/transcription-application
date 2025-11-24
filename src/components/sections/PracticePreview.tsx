import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, PenTool, BookOpen, Headphones, BarChart3, Trophy, Clock, Target, TrendingUp, Star, ChevronRight, Brain, Zap, Award, CheckCircle, Globe, Volume2, Play, ArrowRight, Sparkles } from 'lucide-react';
interface PracticePreviewProps {
  onStartPractice: () => void;
}
const PracticePreview = ({
  onStartPractice
}: PracticePreviewProps) => {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cardIndex = parseInt(entry.target.getAttribute('data-card-index') || '0');
          setVisibleCards(prev => [...new Set([...prev, cardIndex])]);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '100px'
    });
    cardRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, []);

  // Auto-rotate tabs for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animated counters and fluctuating data
  const [animatedValues, setAnimatedValues] = useState({
    examCountdown: 85,
    performanceScore: 83,
    totalTime: 145,
    questions: 87,
    avgScore: 84,
    bestScore: 92
  });

  // Live fluctuating performance bars
  const [weeklyProgress, setWeeklyProgress] = useState([{
    day: 'Mon',
    progress: 75
  }, {
    day: 'Tue',
    progress: 82
  }, {
    day: 'Wed',
    progress: 78
  }, {
    day: 'Thu',
    progress: 85
  }, {
    day: 'Fri',
    progress: 88
  }, {
    day: 'Sat',
    progress: 84
  }, {
    day: 'Sun',
    progress: 91
  }]);

  // Fluctuate performance bars every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWeeklyProgress(prev => prev.map(item => ({
        ...item,
        progress: Math.max(70, Math.min(95, item.progress + (Math.random() - 0.5) * 8))
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animate numbers when visible
  useEffect(() => {
    if (visibleCards.includes(6)) {
      const targets = {
        examCountdown: 85,
        performanceScore: 83,
        totalTime: 145,
        questions: 87,
        avgScore: 84,
        bestScore: 92
      };
      Object.keys(targets).forEach(key => {
        let current = 0;
        const target = targets[key as keyof typeof targets];
        const increment = target / 50;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          setAnimatedValues(prev => ({
            ...prev,
            [key]: Math.floor(current)
          }));
        }, 30);
      });
    }
  }, [visibleCards]);
  const rapidReviewModules = [{
    id: 1,
    title: "BUSINESS + LEGAL",
    description: "Mixed dialogue segments from Business and Legal domains with complex terminology and formal...",
    duration: "8 min",
    segments: 12,
    categories: ["Business", "Legal"],
    color: "from-emerald-400 to-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200"
  }, {
    id: 2,
    title: "HEALTH + IMMIGRATION",
    description: "Healthcare and Immigration dialogues featuring medical consultations and visa application...",
    duration: "10 min",
    segments: 15,
    categories: ["Health", "Immigration"],
    color: "from-emerald-400 to-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200"
  }, {
    id: 3,
    title: "EMPLOYMENT + CONSUMER",
    description: "Employment and Consumer Affairs conversations including job interviews and complaint handling",
    duration: "7 min",
    segments: 10,
    categories: ["Employment", "Consumer"],
    color: "from-emerald-400 to-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200"
  }, {
    id: 4,
    title: "FINANCIAL + INSURANCE",
    description: "Financial services and Insurance dialogues covering banking procedures and policy discussions",
    duration: "9 min",
    segments: 13,
    categories: ["Financial", "Insurance"],
    color: "from-emerald-400 to-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200"
  }];
  const dashboardStats = [{
    title: "Exam Countdown",
    value: animatedValues.examCountdown,
    unit: "days",
    description: "until your NAATI CCL exam",
    detail: "Exam Date: Monday 15 December 2025",
    icon: Clock,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50"
  }, {
    title: "Performance Score",
    value: animatedValues.performanceScore,
    unit: "%",
    description: "Based on consistency (78%) and practice metrics",
    badge: "Excellent",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50"
  }, {
    title: "Total Time",
    value: animatedValues.totalTime,
    unit: "m",
    description: "Practice session duration",
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  }, {
    title: "Questions",
    value: animatedValues.questions,
    unit: "",
    description: "Completed successfully",
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-50"
  }, {
    title: "Avg Score",
    value: animatedValues.avgScore,
    unit: "%",
    description: "Overall performance",
    icon: TrendingUp,
    color: "text-orange-500",
    bgColor: "bg-orange-50"
  }, {
    title: "Best Score",
    value: animatedValues.bestScore,
    unit: "%",
    description: "Personal record",
    icon: Trophy,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50"
  }];
  const recentPractice = [{
    title: "Business + Legal",
    date: "2025-09-20",
    duration: "8min",
    score: "88%"
  }, {
    title: "Health + Immigration",
    date: "2025-09-19",
    duration: "10min",
    score: "82%"
  }, {
    title: "Employment + Consumer",
    date: "2025-09-18",
    duration: "7min",
    score: "91%"
  }, {
    title: "Financial + Insurance",
    date: "2025-09-17",
    duration: "9min",
    score: "79%"
  }];
  const vocabularyWords = [{
    english: "Government",
    translation: "सरकार",
    level: "Intermediate",
    domain: "Politics"
  }, {
    english: "Healthcare",
    translation: "स्वास्थ्य सेवा",
    level: "Advanced",
    domain: "Medical"
  }, {
    english: "Education",
    translation: "शिक्षा",
    level: "Beginner",
    domain: "Academic"
  }, {
    english: "Employment",
    translation: "रोजगार",
    level: "Intermediate",
    domain: "Business"
  }, {
    english: "Immigration",
    translation: "आप्रवासन",
    level: "Advanced",
    domain: "Legal"
  }];
  const stats = [{
    label: "Success Rate",
    value: "95%",
    icon: Trophy,
    description: "Students pass NAATI CCL"
  }, {
    label: "AI Accuracy",
    value: "98%",
    icon: Brain,
    description: "Real exam correlation"
  }, {
    label: "Practice Hours",
    value: "2.5K+",
    icon: Clock,
    description: "Average study time"
  }, {
    label: "PR Points",
    value: "5",
    icon: Target,
    description: "Guaranteed points"
  }];
  return <div className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 py-[77px]">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              NAATI CCL Practice Platform
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              <span className="text-foreground">Master Your </span>
              <span className="bg-gradient-primary bg-clip-text text-transparent">NAATI CCL</span>
              <br />
              <span className="text-foreground">with </span>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">AI Precision</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-12">
              Experience the most comprehensive NAATI CCL preparation platform. Our AI-powered system 
              evaluates your performance using the exact parameters of real exams, ensuring you're 
              fully prepared to secure your <strong className="text-primary">5 PR points</strong>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 text-lg px-12 py-6 animate-pulse-glow" onClick={onStartPractice}>
                <Sparkles className="mr-2 w-5 h-5" />
                Start Practice Now
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-primary/10 text-lg px-12 py-6 hover:scale-105 transition-all duration-300" onClick={onStartPractice}>
                <Award className="mr-2 w-5 h-5" />
                Get Your 5 PR Points
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* NAATI Domain Cards Section */}
      <section ref={sectionRef} className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-foreground">Multiple </span>
              <span className="bg-gradient-primary bg-clip-text text-transparent">NAATI Domains</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Access comprehensive dialogue practice across all NAATI CCL syllabus domains with 
              AI-powered scoring that mirrors real exam parameters.
            </p>
          </div>

          {/* Domain Cards Layout - Cards on Left, Explanation on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Domain Cards - Left Side */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground mb-8 text-center lg:text-left">DOMAINS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rapidReviewModules.map((module, index) => <div key={module.title} ref={el => cardRefs.current[index] = el} data-card-index={index} className={`transform transition-all duration-1000 ${visibleCards.includes(index) ? 'translate-y-0 opacity-100 rotate-0' : index % 2 === 0 ? 'translate-x-[-50px] opacity-0 -rotate-3' : 'translate-x-[50px] opacity-0 rotate-3'}`} style={{
                transitionDelay: `${index * 200}ms`
              }}>
                    <Card className={`p-4 h-full ${module.bgColor} ${module.borderColor} border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group cursor-pointer`}>
                      {/* Header with icon and duration */}
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center shadow-md`}>
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-foreground">{module.duration}</div>
                        </div>
                      </div>
                      
                      <h4 className="text-lg font-bold text-card-foreground mb-2">#{module.id} {module.title}</h4>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{module.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{module.segments} segments</span>
                        <div className="flex gap-1">
                          {module.categories.slice(0, 2).map(category => <Badge key={category} variant="secondary" className="text-xs px-2 py-0">
                              {category}
                            </Badge>)}
                        </div>
                      </div>

                      <Button size="sm" className={`w-full mt-3 bg-gradient-to-r ${module.color} hover:shadow-md transition-all duration-300 text-white font-medium text-xs`} onClick={onStartPractice}>
                        PLAY
                      </Button>
                    </Card>
                  </div>)}
              </div>
            </div>

            {/* Explanation Content - Right Side */}
            <div ref={el => cardRefs.current[10] = el} data-card-index="10" className={`transform transition-all duration-1000 ${visibleCards.includes(10) ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
              <div className="space-y-8">
                <div className="text-center lg:text-left">
                  <h3 className="text-3xl font-bold text-foreground mb-4">
                    GET ACCESS TO MULTIPLE DIALOGUES
                    <br />
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      AND SO MUCH MORE
                    </span>
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Feature 1 */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">Complete NAATI Syllabus Coverage</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Practice across all official NAATI CCL domains including Business, Health, Legal, Immigration, 
                        Employment, Consumer Affairs, Financial Services, and Insurance with authentic dialogue scenarios.
                      </p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">AI-Powered Real Exam Scoring</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Our advanced AI evaluates your performance using the exact same parameters as real NAATI CCL exams, 
                        providing accurate feedback on fluency, accuracy, and completeness.
                      </p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">Guaranteed 5 PR Points</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Our proven methodology has helped thousands of students pass NAATI CCL and secure their 5 PR points. 
                        Join our 95% success rate community.
                      </p>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button size="lg" className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 flex-1" onClick={onStartPractice}>
                      <Play className="mr-2 w-5 h-5" />
                      Start Practice Now
                    </Button>
                    <Button size="lg" variant="outline" className="border-2 border-primary text-green-400 hover:bg-primary/10 flex-1 hover:scale-105 transition-all duration-300" onClick={onStartPractice}>
                      <Award className="mr-2 w-5 h-5" />
                      Get 5 PR Points
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Dashboard Analytics Section */}
          <div ref={el => cardRefs.current[4] = el} data-card-index="4" className={`transform transition-all duration-1000 ${visibleCards.includes(4) ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'} mb-20`}>
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-foreground mb-4">
                <BarChart3 className="inline-block w-8 h-8 mr-3 text-primary" />
                Live Dashboard Analytics
              </h3>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Experience real-time performance tracking with AI-powered insights and exam countdown features.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Dashboard Preview Cards - Left Side */}
              <div className="space-y-6">
                {/* Mini Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {dashboardStats.slice(0, 4).map((stat, index) => <Card key={stat.title} className={`p-4 ${stat.bgColor} border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 group relative overflow-hidden`} style={{
                  animationDelay: `${index * 100}ms`
                }}>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <stat.icon className={`w-6 h-6 ${stat.color} group-hover:scale-110 transition-transform duration-300`} />
                          {stat.badge && <Badge className="bg-emerald-500 text-white text-xs">{stat.badge}</Badge>}
                        </div>
                        
                        <div className="mb-2">
                          <div className="text-2xl font-bold text-foreground">
                            {stat.value}
                            <span className="text-sm text-muted-foreground ml-1">{stat.unit}</span>
                          </div>
                          <div className="text-xs font-medium text-muted-foreground">{stat.title}</div>
                        </div>
                      </div>
                      
                      {/* Hover effect background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Card>)}
                </div>

                {/* Weekly Progress Mini */}
                <Card className="p-4 bg-white border-2 border-gray-200 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-foreground">Weekly Progress</h4>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-600">+12%</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {weeklyProgress.slice(0, 4).map((day, index) => <div key={day.day} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{day.day}</span>
                          <span className="font-bold text-emerald-600">{Math.round(day.progress)}%</span>
                        </div>
                        <div className="relative">
                          <Progress value={day.progress} className="h-2 bg-gray-100" />
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full opacity-20 animate-pulse"></div>
                        </div>
                      </div>)}
                  </div>
                </Card>

                {/* Recent Practice Mini */}
                <Card className="p-4 bg-white border-2 border-gray-200 shadow-lg">
                  <h4 className="text-lg font-bold text-foreground mb-4">Recent Practice</h4>
                  
                  <div className="space-y-3">
                    {recentPractice.slice(0, 3).map((practice, index) => <div key={practice.title} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-sm">{practice.title}</div>
                          <div className="text-xs text-muted-foreground">{practice.duration}</div>
                        </div>
                        <Badge className="bg-emerald-500 text-white font-bold text-xs">
                          {practice.score}
                        </Badge>
                      </div>)}
                  </div>
                </Card>
              </div>

              {/* Explanation Content - Right Side */}
              <div ref={el => cardRefs.current[11] = el} data-card-index="11" className={`transform transition-all duration-1000 ${visibleCards.includes(11) ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
                <div className="space-y-8">
                  <div className="text-center lg:text-left">
                    <h3 className="text-3xl font-bold text-foreground mb-4">
                      GET LIVE PERFORMANCE SCORES
                      <br />
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        WITH AI SCORING & FEEDBACK
                      </span>
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {/* Feature 1 */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">Live Performance Tracking</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Real-time AI scoring system that evaluates your performance instantly, tracking your 
                          progress with live metrics and exam countdown to keep you motivated and on track.
                        </p>
                      </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">Smart Weekly Analytics</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Monitor if you're practicing enough according to your exam days left. Our system analyzes 
                          your weekly performance patterns and provides personalized recommendations.
                        </p>
                      </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">Complete Practice History</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Access detailed history of all dialogues you've practiced with scores, timing, and improvement 
                          trends to help you identify strengths and areas for focused practice.
                        </p>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button size="lg" className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 flex-1" onClick={onStartPractice}>
                        <BarChart3 className="mr-2 w-5 h-5" />
                        View Live Dashboard
                      </Button>
                      <Button size="lg" variant="outline" className="border-2 border-primary text-green-400 hover:bg-primary/10 flex-1 hover:scale-105 transition-all duration-300" onClick={onStartPractice}>
                        <Target className="mr-2 w-5 h-5" />
                        Track Progress
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vocabulary Section */}
          <div ref={el => cardRefs.current[5] = el} data-card-index="5" className={`transform transition-all duration-1000 ${visibleCards.includes(5) ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'} mb-20`}>
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-foreground mb-4">
                <Globe className="inline-block w-8 h-8 mr-3 text-primary" />
                Multi-Language Vocabulary Builder
              </h3>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Practice vocabulary across multiple languages with AI-powered progress tracking and domain-specific terms.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Vocabulary Preview Cards - Left Side */}
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-foreground mb-6 text-center lg:text-left">VOCABULARY PREVIEW</h4>
                
                {/* Vocabulary Cards */}
                <div className="space-y-4">
                  {vocabularyWords.map((word, index) => <div key={word.english} className={`p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 rounded-lg border-2 border-primary/20 hover:shadow-lg transition-all duration-300 hover:scale-102 ${visibleCards.includes(5) ? 'animate-slide-up' : ''}`} style={{
                  animationDelay: `${index * 100}ms`
                }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-foreground">{word.english}</span>
                            <Button size="sm" variant="ghost" className="p-1 h-auto">
                              <Volume2 className="w-4 h-4 text-primary" />
                            </Button>
                          </div>
                          <div className="text-lg font-medium text-primary mb-1">{word.translation}</div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">{word.level}</Badge>
                            <Badge variant="secondary" className="text-xs">{word.domain}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>)}
                </div>

                {/* Mini Progress Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 text-center bg-white border-2 border-gray-200 shadow-lg">
                    <div className="text-2xl font-bold text-primary">247</div>
                    <div className="text-sm text-muted-foreground">Words Mastered</div>
                  </Card>
                  <Card className="p-4 text-center bg-white border-2 border-gray-200 shadow-lg">
                    <div className="text-2xl font-bold text-green-600">89%</div>
                    <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                  </Card>
                </div>
              </div>

              {/* Explanation Content - Right Side */}
              <div ref={el => cardRefs.current[12] = el} data-card-index="12" className={`transform transition-all duration-1000 ${visibleCards.includes(12) ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
                <div className="space-y-8">
                  <div className="text-center lg:text-left">
                    <h3 className="text-3xl font-bold text-foreground mb-4">
                      PRACTICE ALL LANGUAGES
                      <br />
                      <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        VOCABULARY MASTERY
                      </span>
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {/* Feature 1 */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-green-50 border border-green-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">Multiple Language Support</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Practice vocabulary in <strong>Punjabi, Nepali, Spanish, Hindi, Mandarin, Arabic, Vietnamese, 
                          Korean, Indonesian</strong> and many more languages with native pronunciation guides.
                        </p>
                      </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">Domain-Specific Vocabulary</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Access comprehensive vocabulary sets covering Medical, Legal, Business, Immigration, and 
                          Consumer Affairs domains with contextual usage examples and pronunciation.
                        </p>
                      </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">AI-Powered Learning</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Intelligent spaced repetition system that adapts to your learning pace, identifies weak areas, 
                          and provides personalized vocabulary recommendations for maximum retention.
                        </p>
                      </div>
                    </div>

                    {/* Language Tags */}
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                      <h5 className="text-sm font-semibold text-foreground mb-3">Supported Languages:</h5>
                      <div className="flex flex-wrap gap-2">
                        {['Punjabi', 'Nepali', 'Spanish', 'Hindi', 'Mandarin', 'Arabic', 'Vietnamese', 'Korean', 'Indonesian', 'Tamil', 'Bengali', 'Urdu'].map(lang => <Badge key={lang} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                            {lang}
                          </Badge>)}
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button size="lg" className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 flex-1" onClick={onStartPractice}>
                        <BookOpen className="mr-2 w-5 h-5" />
                        Practice Vocabulary
                      </Button>
                      <Button size="lg" variant="outline" className="border-2 border-primary text-green-400 hover:bg-primary/10 flex-1 hover:scale-105 transition-all duration-300" onClick={onStartPractice}>
                        <Volume2 className="mr-2 w-5 h-5" />
                        Learn Pronunciation
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Scoring Features */}
          <div ref={el => cardRefs.current[6] = el} data-card-index="6" className={`transform transition-all duration-1000 ${visibleCards.includes(6) ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-20 opacity-0 rotate-1'} mb-20`}>
            <Card className="p-10 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-2 border-primary/20 shadow-2xl">
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-4xl font-bold text-foreground mb-4">AI-Powered Real Exam Scoring</h3>
                <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
                  Our advanced AI system evaluates your performance using the exact same parameters 
                  as real NAATI CCL examiners. Get instant, accurate feedback that helps you improve faster.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="text-center group cursor-pointer relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-blue-600 transition-colors">Real-Time Analysis</h4>
                  <p className="text-muted-foreground">Instant scoring and feedback as you practice, just like the real exam environment.</p>
                  
                  {/* Hover popup */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20">
                    <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-blue-200 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-600 mb-2">Live Features:</div>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>• Instant pronunciation scoring</li>
                        <li>• Real-time grammar feedback</li>
                        <li>• Live fluency analysis</li>
                      </ul>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center group cursor-pointer relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-green-600 transition-colors">Exam Parameters</h4>
                  <p className="text-muted-foreground">Scoring based on official NAATI criteria including accuracy, fluency, and comprehension.</p>
                  
                  {/* Hover popup */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20">
                    <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-green-200 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600 mb-2">Exam Criteria:</div>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>• Accuracy: 85% minimum</li>
                        <li>• Fluency: Natural flow</li>
                        <li>• Comprehension: Context understanding</li>
                      </ul>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center group cursor-pointer relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-purple-600 transition-colors">Progress Tracking</h4>
                  <p className="text-muted-foreground">Detailed analytics showing your improvement areas and strengths over time.</p>
                  
                  {/* Hover popup */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20">
                    <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-purple-200 whitespace-nowrap">
                      <div className="text-sm font-semibold text-purple-600 mb-2">Track Progress:</div>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>• Weekly improvement metrics</li>
                        <li>• Skill-based analytics</li>
                        <li>• Personalized recommendations</li>
                      </ul>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 text-lg px-12 py-6" onClick={onStartPractice}>
                    <Brain className="mr-2 w-5 h-5" />
                    Experience AI Scoring
                  </Button>
                  <Button size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-primary/10 text-lg px-12 py-6 hover:scale-105 transition-all duration-300" onClick={onStartPractice}>
                    <Award className="mr-2 w-5 h-5" />
                    Secure 5 PR Points
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Statistics Section */}
          <div ref={el => cardRefs.current[6] = el} data-card-index="6" className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transform transition-all duration-1000 ${visibleCards.includes(6) ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'}`}>
            {stats.map((stat, index) => <Card key={stat.label} className="p-6 text-center bg-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-gray-100" style={{
            animationDelay: `${index * 100}ms`
          }}>
                <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-lg font-medium text-card-foreground mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Ready to Master NAATI CCL?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
            Join thousands of successful students who have secured their PR points. 
            Start your journey today with our AI-powered practice platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 hover:scale-105 transition-all duration-300 text-xl px-16 py-8 font-bold shadow-2xl" onClick={onStartPractice}>
              <Play className="mr-3 w-6 h-6" />
              Start Practice Now
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-green-400 hover:bg-white/10 text-xl px-16 py-8 font-bold hover:scale-105 transition-all duration-300" onClick={onStartPractice}>
              <Trophy className="mr-3 w-6 h-6" />
              Get 5 PR Points
            </Button>
          </div>
          
          <div className="mt-12 text-white/80">
            <p className="text-lg">✓ No credit card required  ✓ Start immediately  ✓ 95% success rate</p>
          </div>
        </div>
      </section>
    </div>;
};
export default PracticePreview;