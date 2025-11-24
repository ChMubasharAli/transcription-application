import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Clock, Users, Star, Brain, ArrowUpDown, Bookmark, RotateCcw } from 'lucide-react';
import { DialoguePracticeInterface } from './DialoguePracticeInterface';
import DialoguePracticeFlow from './DialoguePracticeFlow';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Domain {
  id: string;
  title: string;
  topics: number;
  difficulty: string;
  color: string;
  description?: string;
}

interface Dialogue {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  participants: string;
  language_id?: string;
}

interface DialogueSegment {
  id: string;
  segment_order: number;
  text_content: string;
  translation?: string;
  audio_url?: string;
  speaker?: string;
}

interface DialogueWithSegments {
  id: string;
  title: string;
  description: string;
  segments: DialogueSegment[];
}

interface DomainDialoguesProps {
  domain: Domain;
  onBack: () => void;
}

function DomainDialogues({ domain, onBack }: DomainDialoguesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDialogue, setSelectedDialogue] = useState<Dialogue | null>(null);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLanguage, setUserLanguage] = useState<string | null>(null);
  const [currentFlow, setCurrentFlow] = useState<'original' | 'ai-scoring' | null>(null);
  const [selectedDialogueForAI, setSelectedDialogueForAI] = useState<DialogueWithSegments | null>(null);
  const [sortBy, setSortBy] = useState<'title' | 'difficulty' | 'duration'>('title');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'pending'>('all');
  const [bookmarkedDialogues, setBookmarkedDialogues] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchUserLanguageAndDialogues();
    }
  }, [user, domain]);

  const fetchUserLanguageAndDialogues = async () => {
    try {
      setLoading(true);
      
      // First, get user's language
      const { data: profile } = await supabase
        .from('profiles')
        .select('language_id, languages(name)')
        .eq('id', user!.id)
        .maybeSingle();

      if (!profile?.language_id) {
        setUserLanguage(null);
        setDialogues([]);
        setLoading(false);
        return;
      }

      setUserLanguage(profile.languages?.name || null);

      // Then fetch dialogues for this domain and user's language
      const { data: domainData } = await supabase
        .from('domains')
        .select('id')
        .eq('title', domain.title)
        .maybeSingle();

      if (!domainData) {
        setDialogues([]);
        setLoading(false);
        return;
      }

      const { data: dialogueData, error } = await supabase
        .from('dialogues')
        .select('*')
        .eq('domain_id', domainData.id)
        .eq('language_id', profile.language_id);

      if (error) {
        console.error('Error fetching dialogues:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dialogues"
        });
        setDialogues([]);
      } else {
        setDialogues(dialogueData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setDialogues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDialogue = (dialogue: Dialogue) => {
    setSelectedDialogue(dialogue);
    setCurrentFlow('original');
  };

  const handleStartAIScoring = async (dialogue: Dialogue) => {
    try {
      // Fetch dialogue with segments for AI scoring
      const { data: dialogueSegments, error } = await supabase
        .from('dialogue_segments')
        .select('*')
        .eq('dialogue_id', dialogue.id)
        .order('segment_order');

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load dialogue segments",
          variant: "destructive"
        });
        return;
      }

      const dialogueWithSegments: DialogueWithSegments = {
        id: dialogue.id,
        title: dialogue.title,
        description: dialogue.description,
        segments: dialogueSegments || []
      };

      setSelectedDialogueForAI(dialogueWithSegments);
      setCurrentFlow('ai-scoring');
    } catch (error) {
      console.error('Error fetching dialogue segments:', error);
      toast({
        title: "Error",
        description: "Failed to prepare AI scoring session",
        variant: "destructive"
      });
    }
  };

  const handleDialogueComplete = () => {
    setSelectedDialogue(null);
    setCurrentFlow(null);
  };

  const handleBackToDialogues = () => {
    setSelectedDialogue(null);
    setSelectedDialogueForAI(null);
    setCurrentFlow(null);
  };

  const handleAIScoringComplete = (results: any[]) => {
    console.log('AI Scoring Results:', results);
    toast({
      title: "Practice Complete!",
      description: `Completed ${results.length} segments with AI scoring`,
    });
    setSelectedDialogueForAI(null);
    setCurrentFlow(null);
  };

  const getSortedAndFilteredDialogues = () => {
    let filtered = [...dialogues];
    
    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(d => d.difficulty === difficultyFilter);
    }
    
    // Filter by tab (all/completed/pending)
    // Note: You would need to track completion status in your database
    // For now, this is a placeholder for the UI structure
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'difficulty') {
        const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
        return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
               (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0);
      } else if (sortBy === 'duration') {
        const getDurationMinutes = (duration: string) => {
          const match = duration.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        return getDurationMinutes(a.duration) - getDurationMinutes(b.duration);
      }
      return 0;
    });
    
    return filtered;
  };

  const toggleBookmark = (dialogueId: string) => {
    setBookmarkedDialogues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dialogueId)) {
        newSet.delete(dialogueId);
      } else {
        newSet.add(dialogueId);
      }
      return newSet;
    });
  };

  const resetFilters = () => {
    setSortBy('title');
    setDifficultyFilter('all');
    setActiveTab('all');
  };

  if (selectedDialogue && currentFlow === 'original') {
    return (
      <DialoguePracticeInterface
        config={{
          type: 'domain',
          totalSegments: 12,
          timeLimit: 10 * 60, // 10 minutes
          title: selectedDialogue.title,
          language: userLanguage || 'Unknown'
        }}
        onComplete={handleDialogueComplete}
        onBack={handleBackToDialogues}
      />
    );
  }

  if (selectedDialogueForAI && currentFlow === 'ai-scoring') {
    return (
      <DialoguePracticeFlow
        dialogue={selectedDialogueForAI}
        onComplete={handleAIScoringComplete}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Domains</span>
          </Button>
          <div>
            <h3 className="text-2xl font-bold text-foreground">{domain.title} Dialogues</h3>
            <p className="text-muted-foreground">Loading dialogues...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!userLanguage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Domains</span>
          </Button>
          <div>
            <h3 className="text-2xl font-bold text-foreground">{domain.title} Dialogues</h3>
            <p className="text-muted-foreground">Language selection required</p>
          </div>
        </div>
        <Card className="p-8 text-center">
          <p className="text-foreground font-medium mb-4">
            No language selected for your account
          </p>
          <p className="text-muted-foreground mb-4">
            Please contact an administrator to set your practice language before accessing dialogues.
          </p>
          <p className="text-sm text-muted-foreground">
            Available languages: Hindi, Punjabi, Nepali, English, Mandarin, Arabic, Spanish
          </p>
        </Card>
      </div>
    );
  }

  if (dialogues.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Domains</span>
          </Button>
          <div>
            <h3 className="text-2xl font-bold text-foreground">{domain.title} Dialogues</h3>
            <p className="text-muted-foreground">Practice dialogues for {domain.title.toLowerCase()} domain in {userLanguage}</p>
          </div>
        </div>
        <Card className="p-8 text-center">
          <p className="text-foreground font-medium mb-4">
            No dialogues available for {domain.title} domain in {userLanguage}
          </p>
          <p className="text-muted-foreground mb-4">
            The administrator needs to add dialogue content for this domain in your selected language.
          </p>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>What's needed:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Create dialogues for {domain.title} domain</li>
              <li>Set dialogue language to {userLanguage}</li>
              <li>Add dialogue segments with audio files</li>
            </ul>
          </div>
        </Card>
      </div>
    );
  }

  const sortedDialogues = getSortedAndFilteredDialogues();
  const completedCount = 0; // Placeholder - would come from database

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-2xl font-bold text-foreground">{domain.title}</h3>
            <p className="text-sm text-muted-foreground">Practice dialogues in {userLanguage}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSortBy(sortBy === 'title' ? 'difficulty' : 'title')}
          className="gap-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          New
        </Button>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="difficulty">Difficulty</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Done {completedCount}, Found {sortedDialogues.length} Dialogues
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={resetFilters}
            className="text-primary hover:text-primary/80"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Dialogues List */}
      <div className="space-y-2">
        {sortedDialogues.map((dialogue, index) => (
          <div 
            key={dialogue.id} 
            className="flex items-center gap-3 p-4 bg-card hover:bg-accent/50 border border-border rounded-lg transition-all duration-200"
          >
            {/* Number and Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-sm font-semibold text-muted-foreground w-8">
                #{index + 1}
              </span>
              <span className="text-base font-medium text-foreground truncate">
                {dialogue.title}
              </span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                {dialogue.duration}
              </Badge>
              
              <Badge 
                variant="outline" 
                className={`${
                  dialogue.difficulty === 'Beginner' ? 'border-green-500 text-green-600 bg-green-50' :
                  dialogue.difficulty === 'Intermediate' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                  'border-red-500 text-red-600 bg-red-50'
                }`}
              >
                {dialogue.difficulty}
              </Badge>

              <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">
                {dialogue.participants}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                size="sm"
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleStartDialogue(dialogue)}
              >
                Practice
              </Button>
              
              <Button 
                size="sm"
                variant="outline"
                onClick={() => handleStartAIScoring(dialogue)}
              >
                <Brain className="h-4 w-4 mr-1" />
                AI
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => toggleBookmark(dialogue.id)}
                className="h-9 w-9"
              >
                <Bookmark 
                  className={`h-4 w-4 ${bookmarkedDialogues.has(dialogue.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} 
                />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Practice Tips */}
      <Card className="p-6 bg-gradient-card">
        <h4 className="text-lg font-semibold text-card-foreground mb-3">Practice Tips for {domain.title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <p>• Listen carefully to the tone and context</p>
            <p>• Focus on domain-specific terminology</p>
            <p>• Practice pronunciation of technical terms</p>
          </div>
          <div>
            <p>• Take notes during interpretation</p>
            <p>• Maintain professional language register</p>
            <p>• Review and retry for improvement</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export { DomainDialogues, type Domain };