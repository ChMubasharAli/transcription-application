import { Button } from "@/components/ui/button";
import { Play, Star, Users, Trophy } from "lucide-react";
import { useFluctuatingNumber } from "@/hooks/useAnimatedCounter";
interface Hero3DProps {
  onStartPractice: () => void;
}
const Hero3D = ({ onStartPractice }: Hero3DProps) => {
  // Live fluctuating numbers
  const studentsCount = useFluctuatingNumber(100000, 2000);
  const successRate = useFluctuatingNumber(95, 2);
  const practiceProgress = useFluctuatingNumber(85, 3);
  return (
    <section className="relative min-h-screen bg-gradient-dark overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div
          className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float"
          style={{
            animationDelay: "0s",
          }}
        ></div>
        <div
          className="absolute bottom-32 right-20 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-float"
          style={{
            animationDelay: "2s",
          }}
        ></div>
        <div
          className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary/30 rounded-full blur-2xl animate-float"
          style={{
            animationDelay: "4s",
          }}
        ></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Content */}
          <div className="space-y-8 z-10 relative">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium animate-pulse-glow">
                <Star
                  className="w-4 h-4 mr-2 animate-spin"
                  style={{
                    animationDuration: "3s",
                  }}
                />
                <span>AI-Powered NAATI CCL Practice</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-tight animate-slide-up">
                <span className="text-white">
                  Practice Smarter, Not Harder —
                </span>
                <br />
                <span
                  className="text-yellow-400 animate-pulse drop-shadow-glow "
                  style={{ textShadow: "0 0 20px #facc15, 0 0 40px #facc15" }}
                >
                  for NAATI CCL
                </span>
              </h1>

              <p className="text-xl text-gray-300 max-w-lg">
                AI evaluates your responses in real time, shows where you can
                improve, and helps you get exam-ready. Join thousands of
                successful candidates.
              </p>
            </div>

            <div
              className="flex flex-col sm:flex-row gap-4 animate-slide-up"
              style={{
                animationDelay: "0.4s",
              }}
            >
              <Button
                size="lg"
                className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 text-lg px-8 py-4 animate-pulse-glow"
                onClick={onStartPractice}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Practice Now
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 border-gray-600 hover:border-primary hover:scale-105 transition-all duration-300 text-slate-950"
                onClick={() => {
                  const video =
                    document.querySelector("video") ||
                    document.querySelector("[data-video]");
                  if (video) {
                    video.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: "smooth",
                    });
                  }
                }}
              >
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div
              className="flex flex-wrap gap-8 pt-8 animate-slide-up"
              style={{
                animationDelay: "0.6s",
              }}
            >
              <div className="flex items-center space-x-2 hover:scale-105 transition-transform">
                <Users className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-sm text-gray-400">100,000+ Students</span>
              </div>
              <div className="flex items-center space-x-2 hover:scale-105 transition-transform">
                <Trophy
                  className="w-5 h-5 text-primary animate-pulse"
                  style={{
                    animationDelay: "0.5s",
                  }}
                />
                <span className="text-sm text-gray-400">95% Success Rate</span>
              </div>
              <div className="flex items-center space-x-2 hover:scale-105 transition-transform">
                <Star
                  className="w-5 h-5 text-primary animate-pulse"
                  style={{
                    animationDelay: "1s",
                  }}
                />
                <span className="text-sm text-gray-400">
                  AI-Powered Feedback
                </span>
              </div>
            </div>
          </div>

          {/* Right 3D Elements */}
          <div
            className="relative animate-scale-in"
            style={{
              animationDelay: "0.8s",
            }}
          >
            {/* 3D Card Stack */}
            <div className="relative w-full max-w-md mx-auto">
              {/* Background Cards */}
              <div
                className="absolute top-8 left-8 w-64 h-80 bg-gradient-dark rounded-2xl shadow-3d transform rotate-6 opacity-60 animate-float"
                style={{
                  animationDelay: "1s",
                }}
              ></div>
              <div
                className="absolute top-4 left-4 w-64 h-80 bg-gradient-dark rounded-2xl shadow-3d transform rotate-3 opacity-80 animate-float"
                style={{
                  animationDelay: "1.5s",
                }}
              ></div>

              {/* Main Card */}
              <div className="relative w-64 h-80 bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-glow border border-gray-700 p-6 transform hover:scale-105 transition-all duration-300 animate-pulse-glow mx-[45px] px-[24px] my-0">
                <div className="h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 animate-pulse">
                      <Play className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      NAATI CCL Practice
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Real exam simulation with AI-powered scoring and instant
                      feedback.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-primary font-medium">85%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-primary h-2 rounded-full w-[85%] transition-all duration-1000 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center shadow-glow animate-bounce">
              <span className="text-white font-bold text-sm">NEW</span>
            </div>

            <div
              style={{
                animationDelay: "2s",
              }}
              className="absolute bottom-4 -left-8 w-20 h-20 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow transform rotate-12 animate-float mx-[22px]"
            >
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>

            {/* Circuit Board Pattern */}
            <div className="absolute top-1/2 right-1/4 w-32 h-32 opacity-20">
              <svg
                className="w-full h-full animate-pulse"
                viewBox="0 0 100 100"
              >
                <path
                  d="M20,20 L80,20 L80,40 L60,40 L60,60 L40,60 L40,80 L20,80 Z"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                  className="text-primary"
                />
                <circle cx="20" cy="20" r="3" className="fill-primary" />
                <circle cx="80" cy="40" r="3" className="fill-primary" />
                <circle cx="40" cy="80" r="3" className="fill-primary" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero3D;
