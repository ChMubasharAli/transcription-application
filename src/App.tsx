import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
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
import { useAuth } from "./hooks/useAuth";
import { useAdmin } from "./hooks/useAdmin";
import { AdminAccessButton } from "./components/AdminAccessButton";
import { RapidReview } from "./pages/RapidReview";
import { AdminLayout } from "./components/admin/AdminLayout";

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

// AdminPanelWithLayout component using your AdminLayout
const AdminPanelWithLayout = () => {
  const [activeAdminSection, setActiveAdminSection] =
    useState<string>("announcements");

  // Content for different admin sections
  const renderAdminContent = () => {
    switch (activeAdminSection) {
      case "announcements":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Announcements Management</h2>
            <p>Here you can manage announcements for your application.</p>
          </div>
        );
      case "domains":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Domains Management</h2>
            <p>
              Manage different domains and categories for practice questions.
            </p>
          </div>
        );
      case "mock-tests":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Mock Tests Management</h2>
            <p>Create and manage mock tests for users.</p>
          </div>
        );
      case "users":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Users Management</h2>
            <p>View and manage all registered users.</p>
          </div>
        );
      case "vocabulary":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Vocabulary Management</h2>
            <p>Add and manage vocabulary words for learning.</p>
          </div>
        );
      case "rapid-review":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Rapid Review Management</h2>
            <p>Manage rapid review questions and content.</p>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Settings</h2>
            <p>Configure application settings and preferences.</p>
          </div>
        );
      default:
        return (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-4">Welcome to Admin Panel</h2>
            <p className="text-muted-foreground">
              Select a section from the sidebar to get started.
            </p>
          </div>
        );
    }
  };

  return (
    <AdminLayout
      activeSection={activeAdminSection}
      onSectionChange={setActiveAdminSection}
    >
      {renderAdminContent()}
    </AdminLayout>
  );
};

// Main App component that handles all routes
const PrepSmartApp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState<AppSection>("home");
  const { isAuthenticated, user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Set initial section based on URL on first load
  useEffect(() => {
    if (isInitialLoad) {
      const path = location.pathname;
      console.log("Initial load - path:", path);

      if (path === "/admin-page" || path.startsWith("/admin-page/")) {
        setCurrentSection("admin");
      }
      setIsInitialLoad(false);
    }
  }, [location.pathname, isInitialLoad]);

  // Sync URL when section changes
  useEffect(() => {
    if (isInitialLoad) return;

    if (
      currentSection === "admin" &&
      !location.pathname.startsWith("/admin-page")
    ) {
      navigate("/admin-page");
    } else if (currentSection === "home" && location.pathname !== "/") {
      navigate("/");
    }
    // For other sections, we don't change URL to maintain existing behavior
  }, [currentSection, navigate, location.pathname, isInitialLoad]);

  const handleSectionChange = (section: string) => {
    console.log("Changing section to:", section);
    setCurrentSection(section as AppSection);

    // Update URL for specific sections
    if (section === "admin") {
      navigate("/admin-page");
    } else if (section === "home") {
      navigate("/");
    }
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
    console.log(
      "Rendering section:",
      currentSection,
      "Path:",
      location.pathname
    );

    // If URL is /admin-page but currentSection is not admin, force admin
    if (location.pathname === "/admin-page" && currentSection !== "admin") {
      return <AdminPanelWithLayout />;
    }

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
        return <AdminPanelWithLayout />;
      case "exam-demo":
        return <ExamDemo />;
      case "rapid-review":
        return <RapidReview onBack={handleBackToHome} />;
      default:
        return <Home onStartPractice={handleStartPractice} />;
    }
  };

  // Check if we should show main app layout or admin layout
  const isAdminPage =
    currentSection === "admin" || location.pathname === "/admin-page";

  return (
    <div className="min-h-screen bg-background">
      {!isAdminPage ? (
        <>
          <Navigation
            currentSection={currentSection}
            onSectionChange={handleSectionChange}
            onAuthRequired={handleAuthRequired}
            onPracticePreview={handlePracticePreview}
          />
          <main>{renderCurrentSection()}</main>
          <Footer />

          {/* Floating Admin Access Button - Only show for admin users */}
          {isAdmin && (
            <AdminAccessButton
              onAccessAdmin={() => handleSectionChange("admin")}
            />
          )}
        </>
      ) : (
        // Admin page layout (without Navigation and Footer)
        renderCurrentSection()
      )}
    </div>
  );
};

// Root App component with Router
const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router>
          <Routes>
            {/* All routes go through PrepSmartApp */}
            <Route path="/*" element={<PrepSmartApp />} />
            <Route path="/admin-page" element={<PrepSmartApp />} />
            <Route path="/admin-page/*" element={<PrepSmartApp />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
