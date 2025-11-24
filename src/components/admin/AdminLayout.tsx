import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Settings, Megaphone, FileText, BookOpen, Zap, Menu, X, LogOut, TestTube } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}
export const AdminLayout = ({
  children,
  activeSection,
  onSectionChange
}: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    signOut
  } = useAuth();
  const menuItems = [{
    id: 'announcements',
    label: 'Announcements',
    icon: Megaphone
  }, {
    id: 'domains',
    label: 'Domains',
    icon: FileText
  }, {
    id: 'mock-tests',
    label: 'Mock Tests',
    icon: TestTube
  }, {
    id: 'users',
    label: 'Users',
    icon: Users
  }, {
    id: 'vocabulary',
    label: 'Vocabulary',
    icon: BookOpen
  }, {
    id: 'rapid-review',
    label: 'Rapid Review',
    icon: Zap
  }, {
    id: 'settings',
    label: 'Settings',
    icon: Settings
  }];
  const handleSignOut = async () => {
    await signOut();
  };
  return <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => {
          const Icon = item.icon;
          return <Button key={item.id} variant={activeSection === item.id ? "secondary" : "ghost"} className={`w-full justify-start ${!sidebarOpen ? 'px-2' : ''}`} onClick={() => onSectionChange(item.id)}>
                <Icon className="h-4 w-4" />
                {sidebarOpen && <span className="ml-2">{item.label}</span>}
              </Button>;
        })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className={`w-full justify-start text-destructive hover:text-destructive ${!sidebarOpen ? 'px-2' : ''}`} onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 my-[88px]">
          {children}
        </div>
      </div>
    </div>;
};