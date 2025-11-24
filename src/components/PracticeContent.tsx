import { useState, useEffect } from 'react';
import LanguageFilteredVocabulary from './LanguageFilteredVocabulary';
import { DomainDialogues, type Domain } from './DomainDialogues';
import { AllDialoguesList } from './AllDialoguesList';
import Dashboard from './Dashboard';
import UserProfile from './UserProfile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, BookOpenCheck, FileText, Zap, User, Settings, Play, Download, Star, TrendingUp, Building2, GraduationCap, DollarSign, Heart, Laptop, Plane } from 'lucide-react';

interface PracticeContentProps {
  activeSection: string;
}

export function PracticeContent({
  activeSection
}: PracticeContentProps) {
  const { user } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLanguageId, setUserLanguageId] = useState<string | null>(null);
  
  // Get user's language
  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('language_id')
        .eq('id', user.id)
        .single();
      
      setUserLanguageId(data?.language_id || null);
    };

    fetchUserLanguage();
  }, [user?.id]);

  // Fetch domains from database
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('domains')
          .select(`
            id,
            title,
            description,
            difficulty,
            color
          `)
          .order('title');

        if (error) {
          console.error('Error fetching domains:', error);
          setDomains([]);
        } else {
          // Get dialogue counts for each domain, optionally filtered by user's language
          const domainsWithCounts = await Promise.all(
            (data || []).map(async (domain) => {
              let query = supabase
                .from('dialogues')
                .select('*', { count: 'exact', head: true })
                .eq('domain_id', domain.id);
              
              // Only filter by language if user has selected one
              if (userLanguageId) {
                query = query.eq('language_id', userLanguageId);
              }
              
              const { count } = await query;

              return {
                id: domain.id,
                title: domain.title,
                topics: count || 0,
                difficulty: domain.difficulty || 'Intermediate',
                color: domain.color || 'bg-primary',
                description: domain.description || ''
              };
            })
          );
          
          setDomains(domainsWithCounts);
        }
      } catch (error) {
        console.error('Error:', error);
        setDomains([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, [userLanguageId]);
  
  const handleDomainSelect = (domain: Domain) => {
    setSelectedDomain(domain);
  };
  
  const handleBackToDomains = () => {
    setSelectedDomain(null);
  };

  const getDomainIcon = (title: string) => {
    const iconClass = "h-5 w-5 text-white";
    switch (title.toLowerCase()) {
      case 'business':
        return <Building2 className={iconClass} />;
      case 'education':
        return <GraduationCap className={iconClass} />;
      case 'finance':
        return <DollarSign className={iconClass} />;
      case 'healthcare':
        return <Heart className={iconClass} />;
      case 'technology':
        return <Laptop className={iconClass} />;
      case 'travel':
        return <Plane className={iconClass} />;
      default:
        return <BookOpen className={iconClass} />;
    }
  };
  
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'domain':
        return <AllDialoguesList />;
      case 'vocabulary':
        return <LanguageFilteredVocabulary />;
      case 'prediction-files':
        return <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Prediction Files</h2>
                <p className="text-muted-foreground">Access exam predictions and practice materials</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{
              title: '2024 CCL Predictions - Set 1',
              date: '2024-09-15',
              downloads: 1247
            }, {
              title: '2024 CCL Predictions - Set 2',
              date: '2024-09-10',
              downloads: 892
            }, {
              title: 'Healthcare Domain Predictions',
              date: '2024-09-05',
              downloads: 634
            }, {
              title: 'Legal Domain Predictions',
              date: '2024-08-28',
              downloads: 523
            }].map(file => <Card key={file.title} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <Badge variant="secondary">{file.downloads} downloads</Badge>
                  </div>
                  <h3 className="font-semibold text-card-foreground mb-1">{file.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">Updated: {file.date}</p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </Card>)}
            </div>
          </div>;
      case 'rapid-review':
        // Navigate to dedicated Rapid Review page
        window.dispatchEvent(new CustomEvent('navigate-rapid-review'));
        return <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Rapid Review</h2>
                <p className="text-muted-foreground">Quick review sessions for last-minute preparation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[{
              title: '#1 BUSINESS + LEGAL',
              duration: '8 min',
              segments: 12,
              description: 'Mixed dialogue segments from Business and Legal domains with complex terminology and formal language structures',
              domains: ['Business', 'Legal']
            }, {
              title: '#2 HEALTH + IMMIGRATION',
              duration: '10 min',
              segments: 15,
              description: 'Healthcare and Immigration dialogues featuring medical consultations and visa application scenarios',
              domains: ['Health', 'Immigration']
            }, {
              title: '#3 EMPLOYMENT + CONSUMER',
              duration: '7 min',
              segments: 10,
              description: 'Employment and Consumer Affairs conversations including job interviews and complaint handling',
              domains: ['Employment', 'Consumer']
            }, {
              title: '#4 COMMUNITY + EDUCATION',
              duration: '12 min',
              segments: 18,
              description: 'Community Services and Education dialogues with social worker interactions and academic discussions',
              domains: ['Community', 'Education']
            }, {
              title: '#5 FINANCIAL + INSURANCE',
              duration: '9 min',
              segments: 14,
              description: 'Financial and Insurance conversations covering banking services and policy discussions',
              domains: ['Financial', 'Insurance']
            }, {
              title: '#6 HOUSING + SOCIAL SERVICES',
              duration: '11 min',
              segments: 16,
              description: 'Housing and Social Services dialogues featuring rental agreements and welfare consultations',
              domains: ['Housing', 'Social Services']
            }].map(review => <Card key={review.title} className="p-4 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <Zap className="h-6 w-6 text-primary" />
                    <Badge variant="outline">{review.duration}</Badge>
                  </div>
                  <h3 className="font-semibold text-card-foreground mb-2">{review.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{review.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{review.segments} segments</span>
                    <div className="flex flex-wrap gap-1">
                      {review.domains.map(domain => <Badge key={domain} variant="secondary" className="text-xs">{domain}</Badge>)}
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Review
                  </Button>
                </Card>)}
            </div>
          </div>;
      case 'user-profile':
        return <UserProfile />;
      case 'settings':
        return <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Settings</h2>
                <p className="text-muted-foreground">Customize your learning experience</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Study Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-card-foreground">Audio Playback Speed</span>
                    <select className="px-3 py-1 border border-border rounded-md bg-background">
                      <option>1x</option>
                      <option>1.25x</option>
                      <option>1.5x</option>
                      <option>2x</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-card-foreground">Default Study Time</span>
                    <select className="px-3 py-1 border border-border rounded-md bg-background">
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>45 minutes</option>
                      <option>60 minutes</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-card-foreground">Difficulty Level</span>
                    <select className="px-3 py-1 border border-border rounded-md bg-background">
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                      <option>Expert</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-card-foreground">Daily Reminders</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-card-foreground">Progress Updates</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-card-foreground">New Content Alerts</span>
                    <input type="checkbox" className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-card-foreground">Achievement Notifications</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </div>
                <Button className="w-full mt-4">Save Settings</Button>
              </Card>
            </div>
          </div>;
      default:
        return <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Select a section from the sidebar to get started</p>
          </div>;
    }
  };
  
  return <div className="p-6 py-0 px-[29px] mx-0 my-[99px]">
      {renderContent()}
    </div>;
}