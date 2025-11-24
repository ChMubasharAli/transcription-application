import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Home from "./components/sections/Home";
import Practice from "./components/sections/Practice";
import PracticePreview from "./components/sections/PracticePreview";
import MockTest from "./components/sections/MockTest";
import Course from "./components/sections/Course";
import Contact from "./components/sections/Contact";
import Auth from "./components/sections/Auth";
import { AdminPanel } from "./components/sections/AdminPanel";
import ExamDemo from "./pages/ExamDemo";
import RapidReview from "./pages/RapidReview";
import { useAuth } from "./hooks/useAuth";
import { useAdmin } from "./hooks/useAdmin";
import { AdminAccessButton } from "./components/AdminAccessButton";

const queryClient = new QueryClient();

type AppSection =
  | "home"
  | "practice-preview"
  | "practice"
  | "mock-test"
  | "course"
  | "contact"
  | "auth"
  | "admin"
  | "exam-demo"
  | "rapid-review";

const PrepSmartApp = () => {
  const [currentSection, setCurrentSection] = useState<AppSection>("home");
  const { isAuthenticated, user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Add debug logging
  useEffect(() => {
    console.log("Admin status check:", {
      isAuthenticated,
      user: user?.email,
      isAdmin,
      adminLoading,
      currentSection,
    });
  }, [isAuthenticated, user, isAdmin, adminLoading, currentSection]);

  // TEMPORARY: Disable auto-redirects for admin panel testing
  // Redirect admin users to admin panel after auth
  // useEffect(() => {
  //   if (isAuthenticated && user && !adminLoading && isAdmin && currentSection === 'auth') {
  //     console.log('Redirecting admin user to admin panel');
  //     setCurrentSection('admin');
  //   }
  // }, [isAuthenticated, user, isAdmin, adminLoading, currentSection]);

  // Redirect logged-in non-admin users to practice section from home
  // useEffect(() => {
  //   if (isAuthenticated && !adminLoading && !isAdmin && currentSection === 'home') {
  //     console.log('Redirecting logged-in user to practice section');
  //     setCurrentSection('practice');
  //   }
  // }, [isAuthenticated, isAdmin, adminLoading, currentSection]);

  const handleSectionChange = (section: string) => {
    setCurrentSection(section as AppSection);
  };

  const handleStartPractice = () => {
    if (isAuthenticated) {
      setCurrentSection("practice");
    } else {
      setCurrentSection("auth");
    }
  };

  const handlePracticePreview = () => {
    setCurrentSection("practice-preview");
  };

  const handleAuthRequired = () => {
    setCurrentSection("auth");
  };

  const handleAuthSuccess = () => {
    setCurrentSection("practice");
  };

  const handleBackToHome = () => {
    setCurrentSection("home");
  };

  // Listen for navigation to rapid review
  useEffect(() => {
    const handleNavigateToSection = (e: CustomEvent) => {
      if (e.detail === "rapid-review") {
        setCurrentSection("rapid-review");
      }
    };

    window.addEventListener(
      "navigate-to-section",
      handleNavigateToSection as EventListener
    );
    return () => {
      window.removeEventListener(
        "navigate-to-section",
        handleNavigateToSection as EventListener
      );
    };
  }, []);

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "home":
        return (
          <Home
            onStartPractice={handleStartPractice}
            onNavigateToSection={handleSectionChange}
          />
        );
      case "practice-preview":
        return <PracticePreview onStartPractice={handleStartPractice} />;
      case "practice":
        return isAuthenticated ? (
          <Practice />
        ) : (
          <Auth
            onBackToHome={handleBackToHome}
            onAuthSuccess={handleAuthSuccess}
          />
        );
      case "mock-test":
        return <MockTest onNavigateToAuth={handleAuthRequired} />;
      case "course":
        return <Course />;
      case "contact":
        return <Contact />;
      case "auth":
        return (
          <Auth
            onBackToHome={handleBackToHome}
            onAuthSuccess={handleAuthSuccess}
          />
        );
      case "admin":
        // TEMPORARY: Admin panel accessible without authentication for testing
        return <AdminPanel />;
      case "exam-demo":
        return <ExamDemo />;
      case "rapid-review":
        return <RapidReview onBack={handleBackToHome} />;
      default:
        return <Home onStartPractice={handleStartPractice} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        onAuthRequired={handleAuthRequired}
        onPracticePreview={handlePracticePreview}
      />
      <main>{renderCurrentSection()}</main>
      <Footer />

      {/* Floating Admin Access Button - Always visible for dev */}
      <AdminAccessButton onAccessAdmin={() => setCurrentSection("admin")} />
    </div>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PrepSmartApp />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
