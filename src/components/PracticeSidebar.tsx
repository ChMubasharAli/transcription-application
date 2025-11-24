import { useState } from "react";
import {
  BookOpen,
  BookOpenCheck,
  FileText,
  Zap,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BarChart3,
  Brain,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
interface PracticeSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}
const sidebarItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
  },
  {
    id: "domain",
    label: "Dialogue",
    icon: BookOpen,
  },
  {
    id: "vocabulary",
    label: "Vocabulary",
    icon: BookOpenCheck,
  },
  {
    id: "prediction-files",
    label: "Prediction Files",
    icon: FileText,
  },
  {
    id: "rapid-review",
    label: "Rapid Review",
    icon: Zap,
  },
  {
    id: "user-profile",
    label: "User Profile",
    icon: User,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  },
];
export function PracticeSidebar({
  activeSection,
  onSectionChange,
}: PracticeSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };
  return (
    <div
      className={cn(
        "h-full bg-card border-r border-border transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-accent"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Header */}
      <div className="p-4 border-b border-border">
        <div
          className={cn(
            "flex items-center space-x-2",
            isCollapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold text-sm text-card-foreground">
                NAATI Practice
              </h2>
              <p className="text-xs text-muted-foreground">Study Tools</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="p-2 space-y-1 mx-0 py-[30px]">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full justify-start h-10 transition-all duration-200",
                isCollapsed && "justify-center px-2",
                isActive && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  !isCollapsed && "mr-3",
                  isActive && "text-primary"
                )}
              />
              {!isCollapsed && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive && "text-primary"
                  )}
                >
                  {item.label}
                </span>
              )}
            </Button>
          );
        })}

        {/* Sign Out Button */}
        <div className="pt-2 mt-2 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              "w-full justify-start h-10 transition-all duration-200 text-destructive hover:text-destructive hover:bg-destructive/10",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && (
              <span className="text-sm font-medium">Sign Out</span>
            )}
          </Button>
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 bg-gradient-primary rounded-lg text-white">
            <p className="text-xs font-medium">Pro Tip</p>
            <p className="text-xs opacity-90 mt-1">
              Practice regularly to improve your CCL scores
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
