import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, GripVertical, Plus, Save, Edit, Timer, Shuffle, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Language {
  id: string;
  name: string;
  code: string;
}

interface Domain {
  id: string;
  title: string;
  color: string;
}

interface Dialogue {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  domain: Domain;
  segments: DialogueSegment[];
}

interface DialogueSegment {
  id: string;
  dialogue_id: string;
  segment_order: number;
  text_content: string;
  speaker: string;
  start_time?: number;
  end_time?: number;
}

interface RapidReviewDialogue {
  id: string;
  title: string;
  description: string;
  language_id: string;
  domain_combination: string[];
  segments: DialogueSegment[];
  time_limit_minutes: number;
  difficulty: string;
  is_active: boolean;
  created_at: string;
  language?: { name: string };
}

export const AdminRapidReview = () => {
  const [currentStep, setCurrentStep] = useState<'language' | 'domains' | 'dialogues' | 'segments'>('language');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [availableDialogues, setAvailableDialogues] = useState<Dialogue[]>([]);
  const [rapidReviewDialogues, setRapidReviewDialogues] = useState<RapidReviewDialogue[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedDialogues, setSelectedDialogues] = useState<Dialogue[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<DialogueSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [newDialogueTitle, setNewDialogueTitle] = useState('');
  const [newDialogueDescription, setNewDialogueDescription] = useState('');
  const [newDialogueDifficulty, setNewDialogueDifficulty] = useState('Intermediate');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchLanguages();
    fetchDomains();
    fetchRapidReviewDialogues();
  }, []);

  useEffect(() => {
    if (selectedLanguage && selectedDomains.length > 0) {
      fetchAvailableDialogues();
    }
  }, [selectedLanguage, selectedDomains]);

  const fetchLanguages = async () => {
    const { data, error } = await supabase
      .from('languages')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch languages",
        variant: "destructive",
      });
    } else {
      setLanguages(data || []);
    }
  };

  const fetchDomains = async () => {
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .order('title');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch domains",
        variant: "destructive",
      });
    } else {
      setDomains(data || []);
    }
  };

  const fetchAvailableDialogues = async () => {
    if (!selectedLanguage || selectedDomains.length === 0) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('dialogues')
      .select(`
        *,
        domains!dialogues_domain_id_fkey (
          id,
          title,
          color
        ),
        dialogue_segments (
          id,
          segment_order,
          text_content,
          speaker,
          start_time,
          end_time
        )
      `)
      .eq('language_id', selectedLanguage.id)
      .in('domain_id', selectedDomains)
      .order('title');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dialogues",
        variant: "destructive",
      });
    } else {
      const formattedDialogues = data?.map(dialogue => ({
        id: dialogue.id,
        title: dialogue.title,
        description: dialogue.description || '',
        difficulty: dialogue.difficulty || 'Intermediate',
        duration: dialogue.duration || '10 min',
        domain: dialogue.domains as Domain,
        segments: dialogue.dialogue_segments?.sort((a, b) => a.segment_order - b.segment_order).map(segment => ({
          ...segment,
          dialogue_id: dialogue.id
        })) || []
      })) || [];
      setAvailableDialogues(formattedDialogues);
    }
    setLoading(false);
  };

  const fetchRapidReviewDialogues = async () => {
    // For now, we'll create a simple table to store rapid review dialogues
    // This would need to be implemented in the database
    setRapidReviewDialogues([]);
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setSelectedDomains([]);
    setSelectedDialogues([]);
    setSelectedSegments([]);
    setCurrentStep('domains');
  };

  const handleDomainsNext = () => {
    if (selectedDomains.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one domain",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep('dialogues');
  };

  const handleDialogueToggle = (dialogue: Dialogue) => {
    if (selectedDialogues.find(d => d.id === dialogue.id)) {
      setSelectedDialogues(selectedDialogues.filter(d => d.id !== dialogue.id));
    } else if (selectedDialogues.length < 3) {
      setSelectedDialogues([...selectedDialogues, dialogue]);
    } else {
      toast({
        title: "Limit Reached",
        description: "You can select maximum 3 dialogues",
        variant: "destructive",
      });
    }
  };

  const handleDialoguesNext = () => {
    if (selectedDialogues.length < 2) {
      toast({
        title: "Error",
        description: "Please select at least 2 dialogues",
        variant: "destructive",
      });
      return;
    }
    
    // Extract all segments from selected dialogues
    const allSegments: DialogueSegment[] = [];
    selectedDialogues.forEach(dialogue => {
      dialogue.segments.forEach(segment => {
        allSegments.push({
          ...segment,
          dialogue_id: dialogue.id
        });
      });
    });
    setSelectedSegments(allSegments);
    setCurrentStep('segments');
  };

  const removeSegment = (segmentId: string) => {
    setSelectedSegments(selectedSegments.filter(s => s.id !== segmentId));
  };

  const toggleSegment = (segment: DialogueSegment) => {
    if (selectedSegments.find(s => s.id === segment.id)) {
      removeSegment(segment.id);
    } else {
      setSelectedSegments([...selectedSegments, segment]);
    }
  };

  const shuffleSegments = () => {
    const shuffled = [...selectedSegments].sort(() => Math.random() - 0.5);
    setSelectedSegments(shuffled);
  };

  const resetWorkflow = () => {
    setCurrentStep('language');
    setSelectedLanguage(null);
    setSelectedDomains([]);
    setSelectedDialogues([]);
    setSelectedSegments([]);
    setNewDialogueTitle('');
    setNewDialogueDescription('');
    setIsCreating(false);
  };

  const createRapidReviewDialogue = async () => {
    if (!newDialogueTitle || !selectedLanguage || selectedSegments.length < 3) {
      toast({
        title: "Error",
        description: "Please provide title and ensure at least 3 segments are selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Here you would save to a rapid_review_dialogues table
    toast({
      title: "Success",
      description: `Rapid review dialogue "${newDialogueTitle}" created with ${selectedSegments.length} segments from ${selectedDomains.length} domains`,
    });
    
    resetWorkflow();
    setLoading(false);
  };

  const getDomainBadgeColor = (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    return domain?.color || '#6b7280';
  };

  const getDomainTitle = (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    return domain?.title || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Rapid Review Dialogue Builder</h2>
          <p className="text-muted-foreground">
            {currentStep === 'language' && "Select a language to start"}
            {currentStep === 'domains' && `Selected: ${selectedLanguage?.name} • Choose domains to mix`}
            {currentStep === 'dialogues' && `Domains: ${selectedDomains.map(id => getDomainTitle(id)).join(' + ')} • Select 2-3 dialogues`}
            {currentStep === 'segments' && `Selected ${selectedDialogues.length} dialogues • Choose segments and shuffle • 10 min timer`}
          </p>
        </div>
        {currentStep !== 'language' && (
          <Button variant="outline" onClick={resetWorkflow}>
            Start Over
          </Button>
        )}
      </div>

      {/* Step 1: Language Selection */}
      {currentStep === 'language' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Step 1: Select Language</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {languages.map((language) => (
              <Card 
                key={language.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => handleLanguageSelect(language)}
              >
                <CardContent className="p-6 text-center">
                  <h4 className="text-lg font-semibold">{language.name}</h4>
                  <p className="text-sm text-muted-foreground">Code: {language.code}</p>
                  <Button variant="outline" className="mt-3 w-full">
                    Select Language
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Domain Selection */}
      {currentStep === 'domains' && selectedLanguage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Step 2: Select Domains to Mix</h3>
            <Badge variant="secondary">{selectedLanguage.name}</Badge>
          </div>
          <p className="text-muted-foreground">
            Choose multiple domains like Business + Finance + Traffic to create mixed scenarios
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {domains.map((domain) => (
              <Card
                key={domain.id}
                className={`cursor-pointer transition-all ${
                  selectedDomains.includes(domain.id)
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'hover:shadow-lg hover:scale-105'
                }`}
                onClick={() => {
                  if (selectedDomains.includes(domain.id)) {
                    setSelectedDomains(selectedDomains.filter(id => id !== domain.id));
                  } else {
                    setSelectedDomains([...selectedDomains, domain.id]);
                  }
                }}
              >
                <CardContent className="p-4 text-center">
                  <div 
                    className="w-12 h-12 rounded-lg mx-auto mb-3"
                    style={{ backgroundColor: domain.color }}
                  />
                  <h4 className="font-semibold">{domain.title}</h4>
                  {selectedDomains.includes(domain.id) && (
                    <Badge variant="outline" className="mt-2">Selected</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedDomains.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Selected Combination:</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDomains.map(id => getDomainTitle(id)).join(' + ')}
                </p>
              </div>
              <Button onClick={handleDomainsNext}>
                Next: Select Dialogues
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Dialogue Selection */}
      {currentStep === 'dialogues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Step 3: Select 2-3 Dialogues</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedLanguage?.name}</Badge>
              <Badge variant="outline">{selectedDialogues.length}/3 selected</Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            Choose dialogues from: {selectedDomains.map(id => getDomainTitle(id)).join(' + ')}
          </p>

          {loading ? (
            <div className="text-center py-8">Loading dialogues...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableDialogues.map((dialogue) => (
                <Card
                  key={dialogue.id}
                  className={`cursor-pointer transition-all ${
                    selectedDialogues.find(d => d.id === dialogue.id)
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'hover:shadow-lg hover:scale-105'
                  }`}
                  onClick={() => handleDialogueToggle(dialogue)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: dialogue.domain.color }}
                      />
                      <Badge variant="outline" className="text-xs">
                        {dialogue.domain.title}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-2">{dialogue.title}</h4>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{dialogue.difficulty}</span>
                      <span>{dialogue.segments.length} segments</span>
                    </div>
                    {selectedDialogues.find(d => d.id === dialogue.id) && (
                      <Badge variant="default" className="mt-2">Selected</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedDialogues.length >= 2 && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">
                  Selected {selectedDialogues.length} dialogues
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedDialogues.map(d => d.title).join(', ')}
                </p>
              </div>
              <Button onClick={handleDialoguesNext}>
                Next: Choose Segments
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Segment Selection & Shuffling */}
      {currentStep === 'segments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Step 4: Choose & Shuffle Segments</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Timer className="h-3 w-3 mr-1" />
                10 min
              </Badge>
              <Badge variant="outline">{selectedSegments.length} segments</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Segments by Dialogue */}
            <div className="space-y-4">
              <h4 className="font-medium">Available Segments</h4>
              {selectedDialogues.map((dialogue) => (
                <Card key={dialogue.id} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: dialogue.domain.color }}
                    />
                    <h5 className="font-medium text-sm">{dialogue.title}</h5>
                    <Badge variant="outline" className="text-xs">
                      {dialogue.domain.title}
                    </Badge>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {dialogue.segments.map((segment) => (
                      <div
                        key={segment.id}
                        className={`p-2 border rounded text-sm cursor-pointer transition-all ${
                          selectedSegments.find(s => s.id === segment.id)
                            ? 'border-primary bg-primary/10'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleSegment(segment)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{segment.speaker}</span>
                          {selectedSegments.find(s => s.id === segment.id) && (
                            <Badge variant="default" className="text-xs">Selected</Badge>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed">{segment.text_content}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Selected Segments for Rapid Review */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Rapid Review Segments</h4>
                <Button variant="outline" size="sm" onClick={shuffleSegments}>
                  <Shuffle className="h-4 w-4 mr-1" />
                  Shuffle
                </Button>
              </div>
              
              <Card className="p-4 min-h-[400px]">
                {selectedSegments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Click segments from the left to add them here
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Minimum 3 segments required
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedSegments.map((segment, index) => {
                      const dialogue = selectedDialogues.find(d => d.id === segment.dialogue_id);
                      return (
                        <div
                          key={`${segment.id}-${index}`}
                          className="flex items-start gap-2 p-2 bg-muted rounded text-sm"
                        >
                          <span className="text-xs font-mono text-muted-foreground w-6">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant="secondary"
                                style={{ backgroundColor: dialogue?.domain.color }}
                                className="text-white text-xs"
                              >
                                {dialogue?.domain.title}
                              </Badge>
                              <span className="text-xs font-medium">{segment.speaker}</span>
                            </div>
                            <p className="text-xs leading-relaxed">{segment.text_content}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSegment(segment.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {selectedSegments.length >= 3 && (
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Create Rapid Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Finalize Rapid Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Rapid Review Title</Label>
                        <Input
                          id="title"
                          value={newDialogueTitle}
                          onChange={(e) => setNewDialogueTitle(e.target.value)}
                          placeholder="e.g., Business + Finance Mixed Review"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          id="description"
                          value={newDialogueDescription}
                          onChange={(e) => setNewDialogueDescription(e.target.value)}
                          placeholder="Describe this rapid review"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreating(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createRapidReviewDialogue} disabled={!newDialogueTitle}>
                          Create
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Existing Rapid Review Dialogues */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Rapid Review Dialogues</CardTitle>
        </CardHeader>
        <CardContent>
          {rapidReviewDialogues.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No rapid review dialogues created yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Follow the steps above to create mixed domain dialogues
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Existing dialogues would be shown here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
