import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut } from 'lucide-react';
import prepSmartLogo from '@/assets/prep-smart-logo-new.png';
import { useAuth } from '@/hooks/useAuth';
interface NavigationProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  onAuthRequired?: () => void;
  onPracticePreview?: () => void;
}
const Navigation = ({
  currentSection,
  onSectionChange,
  onAuthRequired,
  onPracticePreview
}: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    user,
    isAuthenticated,
    signOut
  } = useAuth();
  const navItems = [{
    id: 'home',
    label: 'HOME'
  }, {
    id: 'practice',
    label: 'PRACTICE'
  }, {
    id: 'mock-test',
    label: 'MOCK TEST'
  }, {
    id: 'course',
    label: 'NAATI COURSE'
  }, {
    id: 'contact',
    label: 'CONTACT US'
  }, {
    id: 'admin',
    label: '🔧 ADMIN'
  }];
  const handleNavClick = (sectionId: string) => {
    // Handle practice section specially - show preview first
    if (sectionId === 'practice') {
      if (isAuthenticated) {
        onSectionChange('practice');
      } else {
        onPracticePreview?.();
      }
      setIsMobileMenuOpen(false);
      return;
    }

    // Allow access to mock-test page for SEO content
    onSectionChange(sectionId);
    setIsMobileMenuOpen(false);
  };
  const handleSignOut = async () => {
    await signOut();
    onSectionChange('home');
  };
  
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border shadow-soft">
      <div className="container mx-auto pl-2 pr-4">
        <div className="flex items-center justify-between h-20 my-0">
          {/* Logo */}
          <div className="flex items-center animate-slide-up px-4">
            <img 
              src={prepSmartLogo} 
              alt="PREP SMART CCL" 
              className="h-14 w-auto object-contain cursor-pointer drop-shadow-lg transition-transform duration-200 hover:scale-105 sm:h-12 md:h-14" 
              onClick={() => handleNavClick('home')}
              onLoad={() => console.log('✅ Logo loaded successfully:', prepSmartLogo)}
              onError={(e) => console.error('❌ Logo failed to load:', e, prepSmartLogo)}
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => <button key={item.id} onClick={() => handleNavClick(item.id)} className={`text-sm font-medium transition-all duration-300 hover:text-primary hover:scale-105 animate-slide-up ${currentSection === item.id || item.id === 'practice' && currentSection === 'practice-preview' ? 'text-primary font-semibold' : 'text-muted-foreground'}`} style={{
            animationDelay: `${index * 0.1}s`
          }}>
                {item.label}
              </button>)}
            
            {/* Auth Buttons */}
            <div className="flex items-center space-x-4 ml-4">
              {isAuthenticated ? <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    {user?.email}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="bg-card/80 border-border/50 hover:bg-card hover:border-border transition-smooth">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div> : <Button variant="outline" size="sm" onClick={() => onAuthRequired?.()} className="bg-card/80 border-border/50 hover:bg-card hover:border-border transition-smooth">
                  Login / Sign Up
                </Button>}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" className="hover:bg-primary/10 transition-colors animate-scale-in" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col space-y-3">
              {navItems.map((item, index) => <button key={item.id} onClick={() => handleNavClick(item.id)} className={`text-left py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 animate-scale-in ${currentSection === item.id || item.id === 'practice' && currentSection === 'practice-preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary hover:bg-secondary'}`} style={{
            animationDelay: `${index * 0.1}s`
          }}>
                  {item.label}
                </button>)}
              
              {/* Mobile Auth Button */}
              <div className="border-t border-border pt-3 mt-3">
                {isAuthenticated ? <div className="space-y-2">
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      {user?.email}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full bg-card/80 border-border/50 hover:bg-card hover:border-border">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div> : <Button variant="outline" size="sm" onClick={() => onAuthRequired?.()} className="w-full bg-card/80 border-border/50 hover:bg-card hover:border-border">
                    Login / Sign Up
                  </Button>}
              </div>
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navigation;