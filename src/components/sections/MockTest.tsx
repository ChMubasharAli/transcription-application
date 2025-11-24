import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Users, Star, Award, BarChart3, Zap, Target, Brain } from 'lucide-react';
import { DialoguePracticeInterface } from '../DialoguePracticeInterface';
import { supabase } from '@/integrations/supabase/client';
interface MockTestProps {
  onNavigateToAuth?: () => void;
  onNavigateToSignup?: () => void;
}
const MockTest = ({
  onNavigateToAuth,
  onNavigateToSignup
}: MockTestProps = {}) => {
  const [selectedMockTest, setSelectedMockTest] = useState<any>(null);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  useEffect(() => {
    fetchDomains();
    fetchMockTests();
  }, []);
  const fetchDomains = async () => {
    const {
      data
    } = await supabase.from('domains').select('title').limit(10);
    if (data) {
      setDomains(data);
    }
  };
  const fetchMockTests = async () => {
    const {
      data
    } = await supabase.from('mock_tests').select(`
        id,
        title,
        difficulty,
        time_limit_minutes,
        dialogue1_id,
        dialogue2_id,
        dialogues:dialogue1_id(title, domains:domain_id(title))
      `).eq('is_active', true);
    if (data) {
      const testsWithTopics = data.map(test => ({
        ...test,
        description: "Complete practice test with real exam conditions",
        duration: `${test.time_limit_minutes} minutes`,
        topics: domains.slice(0, 2).map(d => d.title)
      }));
      setMockTests(testsWithTopics);
    }
  };
  const handleStartMockTest = (test: any) => {
    setSelectedMockTest(test);
  };
  const handleMockTestComplete = () => {
    setSelectedMockTest(null);
  };
  const handleBackToMockTests = () => {
    setSelectedMockTest(null);
  };

  // JSON-LD Schema for FAQ
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": "Is the mock test format similar to the official NAATI CCL exam?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Our mock tests simulate segment-based dialogues, timing, and scoring dimensions used in NAATI CCL."
      }
    }, {
      "@type": "Question",
      "name": "Do I get instant results?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. AI scoring generates your result and feedback immediately after submission."
      }
    }, {
      "@type": "Question",
      "name": "Is this really free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. You can take a free mock test after logging in. Unlimited practice and advanced analytics are available on paid plans."
      }
    }, {
      "@type": "Question",
      "name": "Which languages are supported?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We support multiple language pairs common in NAATI CCL. New packs are added regularly."
      }
    }, {
      "@type": "Question",
      "name": "Can I retake the same mock?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely. Retake as many times as you like and track improvement over time."
      }
    }]
  };

  // JSON-LD Schema for Software Application
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "PREP SMART CCL",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "url": "/naati-mock-test",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "AUD"
    }
  };
  if (selectedMockTest) {
    return <DialoguePracticeInterface config={{
      type: 'mock',
      totalSegments: 24,
      timeLimit: 20 * 60,
      title: selectedMockTest.title,
      language: 'Punjabi'
    }} onComplete={handleMockTestComplete} onBack={handleBackToMockTests} />;
  }
  return <>
      <Helmet>
        <title>NAATI CCL Mock Test — Free AI-Scored Practice | PREP SMART CCL</title>
        <meta name="description" content="Take a free NAATI CCL mock test with instant AI scoring and detailed feedback. Practice real exam dialogues, track your progress, and get exam-ready with PREP SMART CCL." />
        <link rel="canonical" href="/naati-mock-test" />
        <meta property="og:title" content="NAATI CCL Mock Test — Free AI-Scored Practice" />
        <meta property="og:description" content="Practice NAATI CCL with AI scoring, realistic dialogues, and performance analytics. Start free." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/naati-mock-test" />
        <meta property="og:image" content="/images/og-naati-mock-test.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(appSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-purple-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 animate-pulse" style={{
            backgroundImage: `
                  linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)
                `,
            backgroundSize: '60px 60px'
          }} />
          </div>
        </div>

        <main className="relative z-10 py-20">
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <section className="text-center mb-20">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 bg-clip-text text-transparent mb-6 animate-gradient-x py-[77px]">
                NAATI CCL Mock Test — Free AI-Scored Practice
              </h1>
              <p className="text-xl text-cyan-300 max-w-4xl mx-auto mb-8 leading-relaxed">
                Get exam-ready with realistic NAATI CCL mock tests, instant AI scoring, and actionable feedback. 
                Practice dialogues, improve accuracy, and pass with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <button onClick={() => onNavigateToAuth?.()} className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] text-lg">
                  Take a Free Mock Test
                </button>
                <button onClick={() => onNavigateToAuth?.()} className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-300 font-semibold rounded-xl transition-all duration-300 text-lg">
                  Create a Free Account
                </button>
              </div>
            </section>

            {/* Features Section */}
            <section className="mb-20">
              <h2 className="text-4xl font-bold text-center text-cyan-300 mb-12">
                Why practice NAATI CCL mock tests on PREP SMART?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                <div className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-6 hover:border-cyan-400/40 transition-all duration-300">
                  <Brain className="w-12 h-12 text-cyan-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">AI-Powered Scoring</h3>
                  <p className="text-cyan-300/80">Instant evaluation of content, accuracy, and delivery with clear band-style feedback.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-6 hover:border-cyan-400/40 transition-all duration-300">
                  <FileText className="w-12 h-12 text-cyan-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Real Exam Dialogues</h3>
                  <p className="text-cyan-300/80">High-quality roleplays that mirror official NAATI CCL formats.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-6 hover:border-cyan-400/40 transition-all duration-300">
                  <BarChart3 className="w-12 h-12 text-cyan-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Detailed Analytics</h3>
                  <p className="text-cyan-300/80">Track strengths, mistakes, and time management—see exactly what to fix next.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-6 hover:border-cyan-400/40 transition-all duration-300">
                  <Zap className="w-12 h-12 text-cyan-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Unlimited Practice</h3>
                  <p className="text-cyan-300/80">Repeat any mock test and compare attempts for consistent improvement.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-6 hover:border-cyan-400/40 transition-all duration-300">
                  <Target className="w-12 h-12 text-cyan-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Anytime, Anywhere</h3>
                  <p className="text-cyan-300/80">Works on desktop and mobile—practice on your schedule.</p>
                </div>
              </div>
              <div className="text-center">
                <button onClick={() => onNavigateToAuth?.()} className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] text-lg">
                  Start Your Free Mock Now
                </button>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="mb-20">
              <h2 className="text-4xl font-bold text-center text-cyan-300 mb-12">
                How the NAATI CCL Mock Test Works
              </h2>
              <div className="max-w-4xl mx-auto">
                <ol className="space-y-6">
                  {[{
                  step: 1,
                  title: "Log in or Sign up",
                  description: "to PREP SMART CCL."
                }, {
                  step: 2,
                  title: "Choose a mock test",
                  description: "in your language pair and start the dialogue."
                }, {
                  step: 3,
                  title: "Record your responses",
                  description: "for each segment just like the real exam."
                }, {
                  step: 4,
                  title: "Get instant AI feedback",
                  description: "with scoring and suggestions to improve."
                }, {
                  step: 5,
                  title: "Review your report",
                  description: "and retake to beat your previous score."
                }].map(item => <li key={item.step} className="flex items-start gap-4 bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <span className="text-xl font-bold text-white">{item.title}</span>
                        <span className="text-cyan-300 ml-2">{item.description}</span>
                      </div>
                    </li>)}
                </ol>
                <p className="text-center text-cyan-300 mt-8">
                  New to NAATI CCL? Explore <a href="/naati-practice" className="text-cyan-400 hover:text-cyan-300 underline">practice materials</a> or 
                  see our <a href="/naati-course" className="text-cyan-400 hover:text-cyan-300 underline">NAATI course</a>.
                </p>
              </div>
            </section>

            {/* What's Included Section */}
            <section className="mb-20">
              <h2 className="text-4xl font-bold text-center text-cyan-300 mb-12">
                What's included in each mock test?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Authentic Dialogues</h3>
                  <p className="text-cyan-300/80">Topic-balanced scenarios: healthcare, education, community services, finance, and more.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Segmented Timing</h3>
                  <p className="text-cyan-300/80">Simulated segment delivery and realistic exam pacing.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Objective Scoring</h3>
                  <p className="text-cyan-300/80">AI measures accuracy, penalties for errors, omissions, and delivery.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Actionable Feedback</h3>
                  <p className="text-cyan-300/80">Clear comments and targeted drills for fast improvement.</p>
                </div>
              </div>
            </section>

            {/* Mock Tests List */}
            {mockTests.length > 0 && <section className="mb-20">
                <h2 className="text-4xl font-bold text-center text-cyan-300 mb-12">
                  Available Mock Tests
                </h2>
                <div className="flex flex-col gap-6">
                  {mockTests.map(test => <Card key={test.id} className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 p-6 hover:border-cyan-400/40 hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all duration-300">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <h3 className="text-xl font-bold text-white">{test.title}</h3>
                          <span className={`px-3 py-1 text-sm rounded-full ${test.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : test.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {test.difficulty}
                          </span>
                        </div>
                        
                        <p className="text-cyan-300/80">{test.description}</p>
                        
                        <div className="flex items-center text-cyan-300/80">
                          <Clock className="w-4 h-4 mr-2" />
                          Duration: {test.duration}
                        </div>

                        {test.topics.length > 0 && <div className="space-y-2">
                            <p className="text-sm font-medium text-white">Topics covered:</p>
                            <div className="flex flex-wrap gap-2">
                              {test.topics.map((topic, index) => <span key={index} className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-full border border-cyan-500/30">
                                  {topic}
                                </span>)}
                            </div>
                          </div>}

                        <Button className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]" onClick={() => handleStartMockTest(test)}>
                          Start Mock Test
                        </Button>
                      </div>
                    </Card>)}
                </div>
              </section>}

            {/* Micro CTA */}
            <section className="text-center mb-20">
              <button onClick={() => onNavigateToAuth?.()} className="inline-flex items-center justify-center px-12 py-6 bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,255,0.8)] text-xl">
                Take a Free NAATI CCL Mock Test
              </button>
              <p className="text-cyan-300/60 mt-4">No credit card required. Start practicing in under one minute.</p>
            </section>

            {/* FAQ Section */}
            <section className="mb-20">
              <h2 className="text-4xl font-bold text-center text-cyan-300 mb-12">
                NAATI CCL Mock Test — FAQs
              </h2>
              <div className="max-w-4xl mx-auto space-y-4">
                {[{
                question: "Is the mock test format similar to the official NAATI CCL exam?",
                answer: "Yes. Our mock tests simulate segment-based dialogues, timing, and scoring dimensions used in NAATI CCL."
              }, {
                question: "Do I get instant results?",
                answer: "Yes. AI scoring generates your result and feedback immediately after submission."
              }, {
                question: "Is this really free?",
                answer: "Yes. You can take a free mock test after logging in. Unlimited practice and advanced analytics are available on paid plans."
              }, {
                question: "Which languages are supported?",
                answer: "We support multiple language pairs common in NAATI CCL. New packs are added regularly."
              }, {
                question: "Can I retake the same mock?",
                answer: "Absolutely. Retake as many times as you like and track improvement over time."
              }].map((faq, index) => <details key={index} className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-6 hover:border-cyan-400/40 transition-all duration-300">
                    <summary className="text-lg font-semibold text-white cursor-pointer hover:text-cyan-300 transition-colors">
                      {faq.question}
                    </summary>
                    <p className="mt-4 text-cyan-300/80 leading-relaxed">{faq.answer}</p>
                  </details>)}
              </div>
            </section>

            {/* Trust Section */}
            <section className="text-center">
              <h2 className="text-4xl font-bold text-cyan-300 mb-6">
                Built by teachers. Powered by AI.
              </h2>
              <p className="text-xl text-cyan-300/80 max-w-3xl mx-auto mb-8">
                PREP SMART CCL combines expert-designed dialogues with cutting-edge AI scoring to help you pass NAATI CCL faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => onNavigateToAuth?.()} className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] text-lg">
                  Start Free
                </button>
                <a href="/contact" className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-300 font-semibold rounded-xl transition-all duration-300 text-lg">
                  Talk to our team
                </a>
              </div>
            </section>

            {/* Footer Links - Breadcrumbs */}
            <nav className="mt-20 pt-8 border-t border-cyan-400/20" aria-label="Breadcrumb">
              <div className="flex flex-wrap items-center gap-2 text-cyan-300/60">
                <a href="/" className="hover:text-cyan-300 transition-colors">Home</a>
                <span>→</span>
                <a href="/naati-practice" className="hover:text-cyan-300 transition-colors">NAATI Practice</a>
                <span>→</span>
                <span className="text-cyan-300">Mock Test</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-6">
                <a href="/naati-practice" className="text-cyan-400 hover:text-cyan-300 transition-colors">NAATI Practice</a>
                <a href="/naati-course" className="text-cyan-400 hover:text-cyan-300 transition-colors">NAATI Course</a>
                <a href="/contact" className="text-cyan-400 hover:text-cyan-300 transition-colors">Contact</a>
              </div>
            </nav>
          </div>
        </main>
      </div>
    </>;
};
export default MockTest;