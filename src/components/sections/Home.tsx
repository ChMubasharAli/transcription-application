import Hero3D from '../Hero3D';
import PerformanceChart from '../PerformanceChart';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star, Users, Brain, Clock, Award, BarChart3, Zap, Shield } from 'lucide-react';

interface HomeProps {
  onStartPractice: () => void;
  onNavigateToSection?: (section: string) => void;
}
const Home = ({
  onStartPractice,
  onNavigateToSection
}: HomeProps) => {
  const features = [{
    icon: Brain,
    title: "AI-Powered Scoring",
    description: "Get instant feedback with our advanced AI scoring engine that evaluates your performance accurately."
  }, {
    icon: Clock,
    title: "Real-Time Practice",
    description: "Practice with authentic NAATI CCL scenarios in a simulated exam environment."
  }, {
    icon: Award,
    title: "Guaranteed Results",
    description: "Our proven methodology helps 95% of students achieve their target scores."
  }];
  const benefits = ["Unlimited practice sessions", "Instant AI feedback and scoring", "Real NAATI CCL exam scenarios", "Progress tracking and analytics", "Mobile-friendly platform", "Expert-designed curriculum"];
  return <div>
      {/* Hero Section */}
      <Hero3D onStartPractice={onStartPractice} />

      {/* Features Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose <span className="text-primary animate-gradient-x bg-gradient-primary bg-clip-text text-transparent">PREP SMART CCL</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're committed to your success — our coaching continues until you achieve your desired NAATI score.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => <Card key={index} className="p-8 text-center hover:shadow-3d hover:scale-105 transition-all duration-300 animate-scale-in" style={{
            animationDelay: `${index * 0.2}s`
          }}>
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-4">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>)}
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <h3 className="text-3xl font-bold text-foreground mb-6 animate-slide-up">
                Everything You Need to Pass NAATI CCL
              </h3>
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => <div key={index} className="flex items-center space-x-3 animate-slide-up" style={{
                animationDelay: `${index * 0.1}s`
              }}>
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 animate-pulse" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>)}
              </div>
              <Button size="lg" className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 animate-pulse-glow" onClick={onStartPractice}>
                Get Started Today
              </Button>

              {/* Guaranteed Results Card */}
              <Card className="p-8 bg-gradient-secondary mt-8 hover:shadow-3d transition-all duration-300 animate-scale-in">
                <div className="text-center">
                  <Star className="w-12 h-12 text-primary mx-auto mb-4 animate-float" />
                  <h4 className="text-2xl font-bold text-card-foreground mb-4">Guaranteed Results</h4>
                  <p className="text-muted-foreground mb-6">
                    We're committed to your success — our coaching continues until you achieve your desired NAATI score. 
                    Backed by proven templates, tested strategies, and unlimited access to learning resources, 
                    we help you score smart and stress-free.
                  </p>
                  <div className="flex justify-center items-center space-x-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary animate-pulse">95%</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary animate-pulse" style={{
                      animationDelay: '0.5s'
                    }}>100K+</div>
                      <div className="text-sm text-muted-foreground">Students</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Performance Chart */}
            <div className="animate-scale-in" style={{
            animationDelay: '0.4s'
          }}>
              <PerformanceChart />
            </div>
          </div>

          {/* Advanced Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <Card className="p-6 text-center hover:shadow-3d hover:scale-105 transition-all duration-300 animate-scale-in">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-bold text-card-foreground mb-2">Real-Time Analytics</h4>
              <p className="text-sm text-muted-foreground">Track your progress with detailed performance analytics and insights.</p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-3d hover:scale-105 transition-all duration-300 animate-scale-in" style={{
            animationDelay: '0.2s'
          }}>
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-bold text-card-foreground mb-2">Instant Feedback</h4>
              <p className="text-sm text-muted-foreground">Get immediate AI-powered feedback on your performance and areas for improvement.</p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-3d hover:scale-105 transition-all duration-300 animate-scale-in" style={{
            animationDelay: '0.4s'
          }}>
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-bold text-card-foreground mb-2">Secure Platform</h4>
              <p className="text-sm text-muted-foreground">Your data is protected with enterprise-grade security and privacy measures.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Course Overview Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Course <span className="text-primary animate-gradient-x bg-gradient-primary bg-clip-text text-transparent">Overview</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover how our structured approach prepares you for NAATI CCL success
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Video Section */}
            <div className="animate-slide-up">
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl hover:shadow-3d transition-all duration-300">
                <iframe
                  src="https://www.youtube.com/embed/CvK2AanVS4Q?autoplay=1&mute=1"
                  title="NAATI CCL Course Overview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>

            {/* Description Section */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-3xl font-bold text-foreground mb-6">
                Structured Learning for Guaranteed Success
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Our comprehensive NAATI CCL course is meticulously designed to cover all essential domains with a structured approach that ensures your success.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Complete Domain Coverage</h4>
                    <p className="text-muted-foreground">Practice across all NAATI CCL domains including social services, healthcare, legal, and community settings.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">AI-Powered Scoring System</h4>
                    <p className="text-muted-foreground">Get instant, accurate feedback with our advanced AI technology that evaluates your performance just like the real exam.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Proven Methodology</h4>
                    <p className="text-muted-foreground">Follow our time-tested strategies and templates that have helped thousands of students achieve their target scores.</p>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300" 
                onClick={() => onNavigateToSection?.('course')}
              >
                Explore Our Course
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-dark relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '60px 60px'
        }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 animate-slide-up">
            <span className="text-white">Ready to Ace Your </span>
            <span className="bg-gradient-primary bg-clip-text text-transparent animate-gradient-x">NAATI CCL Exam?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-slide-up" style={{
          animationDelay: '0.2s'
        }}>
            Join thousands of successful students who have passed their NAATI CCL exam with our AI-powered practice platform.
          </p>
          <Button size="lg" className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 text-lg px-12 py-6 animate-pulse-glow" onClick={onStartPractice}>
            Start Your Free Practice
          </Button>
        </div>
      </section>
    </div>;
};
export default Home;