import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFluctuatingNumber } from '@/hooks/useAnimatedCounter';
import { 
  Mic, 
  PenTool, 
  BookOpen, 
  Headphones, 
  BarChart3, 
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Star,
  ChevronRight
} from 'lucide-react';

interface DashboardPreviewProps {
  onStartPractice: () => void;
}

const DashboardPreview = ({ onStartPractice }: DashboardPreviewProps) => {
  // Live fluctuating numbers
  const successRate = useFluctuatingNumber(95, 2);
  const studyHours = useFluctuatingNumber(2.5, 0.2);
  const practiceProgress = useFluctuatingNumber(10, 3);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = parseInt(entry.target.getAttribute('data-card-index') || '0');
            setVisibleCards(prev => [...new Set([...prev, cardIndex])]);
          }
        });
      },
      { threshold: 0.2, rootMargin: '50px' }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const skillModules = [
    {
      icon: Mic,
      title: "Speaking",
      color: "bg-blue-500",
      progress: 75,
      description: "Real-time pronunciation analysis"
    },
    {
      icon: PenTool,
      title: "Writing",
      color: "bg-yellow-500",
      progress: 68,
      description: "Grammar and vocabulary scoring"
    },
    {
      icon: BookOpen,
      title: "Reading",
      color: "bg-green-500",
      progress: 82,
      description: "Comprehension and speed tracking"
    },
    {
      icon: Headphones,
      title: "Listening",
      color: "bg-red-500",
      progress: 71,
      description: "Audio clarity and understanding"
    }
  ];

  const stats = [
    { label: "Mock Tests", value: "50M+", icon: Trophy },
    { label: "Success Rate", value: "95%", icon: TrendingUp },
    { label: "Avg. Score Improvement", value: "+23", icon: Target },
    { label: "Study Hours", value: "2.5K", icon: Clock }
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-foreground">Experience Your Future </span>
            <span className="bg-gradient-primary bg-clip-text text-transparent">NAATI Practice Dashboard</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Get a preview of our comprehensive AI-powered platform. See exactly what you'll have access to 
            when you start your NAATI CCL preparation journey with real exam parameters and real-time vocabulary analysis.
          </p>
          
          {/* Main CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 text-lg px-8 py-6"
              onClick={onStartPractice}
            >
              Start Practice Now <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 text-lg px-8 py-6"
              onClick={onStartPractice}
            >
              Get Your 5 Points for PR
            </Button>
          </div>
        </div>

        {/* Dashboard Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Test Progress Card */}
          <div 
            ref={el => cardRefs.current[0] = el}
            data-card-index="0"
            className={`lg:col-span-4 transform transition-all duration-700 ${
              visibleCards.includes(0) 
                ? 'translate-y-0 opacity-100 rotate-0' 
                : 'translate-y-12 opacity-0 -rotate-2'
            }`}
          >
            <Card className="p-6 h-full bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-card-foreground">Test Progress</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Live</Badge>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">Test - 1</div>
                  <div className="text-sm text-muted-foreground mb-4">Duration: 02:23:00</div>
                  <div className="w-full bg-muted rounded-full h-3 mb-2">
                    <div 
                      className="bg-red-500 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.round(practiceProgress)}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-red-600 font-medium">Progress: {Math.round(practiceProgress)}%</div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Start Test
                </Button>
              </div>
            </Card>
          </div>

          {/* Skills Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 gap-4">
            {skillModules.map((skill, index) => (
              <div
                key={skill.title}
                ref={el => cardRefs.current[index + 1] = el}
                data-card-index={index + 1}
                className={`transform transition-all duration-700 ${
                  visibleCards.includes(index + 1)
                    ? 'translate-y-0 opacity-100 rotate-0'
                    : 'translate-y-12 opacity-0 rotate-1'
                }`}
                style={{ 
                  transitionDelay: `${index * 200}ms`,
                  transformOrigin: index % 2 === 0 ? 'left center' : 'right center'
                }}
              >
                <Card className="p-6 h-full bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-primary/10">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${skill.color} rounded-xl flex items-center justify-center mr-4`}>
                      <skill.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-card-foreground">{skill.title}</h3>
                      <p className="text-xs text-muted-foreground">{skill.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{skill.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${skill.color}`}
                        style={{ 
                          width: visibleCards.includes(index + 1) ? `${skill.progress}%` : '0%',
                          transitionDelay: `${(index * 200) + 500}ms`
                        }}
                      ></div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics Row */}
        <div 
          ref={el => cardRefs.current[5] = el}
          data-card-index="5"
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 transform transition-all duration-700 ${
            visibleCards.includes(5) 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-12 opacity-0 scale-95'
          }`}
        >
          {stats.map((stat, index) => (
            <Card key={stat.label} className="p-6 text-center bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-primary/10">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* AI Scoring Section */}
        <div 
          ref={el => cardRefs.current[6] = el}
          data-card-index="6"
          className={`transform transition-all duration-700 ${
            visibleCards.includes(6) 
              ? 'translate-y-0 opacity-100 rotate-0' 
              : 'translate-y-12 opacity-0 rotate-1'
          }`}
        >
          <Card className="p-8 bg-gradient-to-r from-primary/5 to-purple-500/5 border-2 border-primary/20 shadow-xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">AI-Powered Real Exam Scoring</h3>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Our advanced AI evaluates your performance based on the exact parameters used in real NAATI CCL exams. 
                Get instant feedback on pronunciation, grammar, vocabulary usage, and comprehension with the same 
                standards as official examiners.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-card-foreground mb-2">Real-Time Analysis</h4>
                <p className="text-sm text-muted-foreground">Instant scoring as you practice</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-card-foreground mb-2">Exam Parameters</h4>
                <p className="text-sm text-muted-foreground">Based on official NAATI criteria</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-card-foreground mb-2">Vocabulary Builder</h4>
                <p className="text-sm text-muted-foreground">Real-time vocabulary enhancement</p>
              </div>
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 text-lg px-12 py-6 mr-4"
                onClick={onStartPractice}
              >
                Experience AI Scoring Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 text-lg px-8 py-6"
                onClick={onStartPractice}
              >
                Get 5 PR Points
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;