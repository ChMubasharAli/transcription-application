import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import prepSmartLogo from "@/assets/prep-smart-logo-new.png";
const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden text-foreground py-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(var(--primary) / 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(var(--primary) / 0.08) 0%, transparent 50%)",
            backgroundSize: "400px 400px, 600px 600px",
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-500">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#home"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#practice"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  NAATI Practice
                </a>
              </li>
              <li>
                <a
                  href="#mock-test"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Mock Tests
                </a>
              </li>
              <li>
                <a
                  href="#course"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Courses
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-500">Services</h3>
            <ul className="space-y-2">
              <li className="text-muted-foreground bg-inherit">
                AI-Powered Scoring
              </li>
              <li className="text-muted-foreground">Real-time Feedback</li>
              <li className="text-muted-foreground">Progress Tracking</li>
              <li className="text-muted-foreground">Mock Examinations</li>
              <li className="text-muted-foreground">Expert Coaching</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-lime-500">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">info@prepsmart.au</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">+61 xxx xxx xxx</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Australia</span>
              </div>
            </div>
          </div>

          {/* Premium Logo Section */}
          <div className="space-y-4 text-center md:col-span-2">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                {/* Enhanced Background Glow for better contrast */}
                <div className="absolute -inset-4 bg-white/10 rounded-full blur-2xl opacity-50 group-hover:opacity-70 animate-pulse"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-white/20 via-primary/30 to-white/20 rounded-full animate-spin-slow"></div>

                {/* Main Logo with enhanced styling */}
                <div className="relative">
                  <img
                    src={prepSmartLogo}
                    alt="PREP SMART CCL"
                    className="h-20 w-auto object-contain transition-all duration-500 group-hover:scale-110 animate-float"
                    style={{
                      filter:
                        "brightness(1.3) contrast(1.2) drop-shadow(0 0 20px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 40px rgba(var(--primary), 0.3))",
                    }}
                  />

                  {/* Enhanced Sparkle Effects */}
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-white rounded-full animate-ping opacity-80"></div>
                  <div
                    className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full animate-pulse opacity-90"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                  <div
                    className="absolute top-1/2 -left-3 w-1 h-1 bg-white rounded-full animate-ping opacity-70"
                    style={{ animationDelay: "1s" }}
                  ></div>
                  <div
                    className="absolute top-1/4 -right-3 w-1 h-1 bg-primary/90 rounded-full animate-pulse opacity-80"
                    style={{ animationDelay: "1.5s" }}
                  ></div>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold animate-gradient-x bg-gradient-to-r from-white via-primary to-white bg-clip-text text-transparent">
              PREP SMART CCL
            </h3>
            <p className="text-white/80 text-sm">
              Master your NAATI CCL exam with our AI-powered platform
            </p>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="flex justify-center space-x-6 mt-12 mb-8">
          <Facebook className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
          <Twitter className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
          <Instagram className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
          <Linkedin className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © 2024 PREP SMART CCL. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="#"
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
