import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Plus, Edit, Trash2, Upload, Play, Pause, MoreVertical, ChevronDown, ChevronUp, X, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Language {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

interface Domain {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  color: string;
  created_at: string;
}

interface Dialogue {
  id: string;
  domain_id: string;
  language_id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  created_at: string;
}

interface DialogueSegment {
  id?: string;
  dialogue_id?: string;
  segment_order: number;
  text_content: string;
  translation?: string;
  audio_url?: string;
  audio_file?: File;
  start_time?: number;
  end_time?: number;
}

export const AdminDomains = () => {
  // View states
  const [currentView, setCurrentView] = useState<'languages' | 'domains' | 'dialogues'>('languages');
  
  // Data states
  const [languages, setLanguages] = useState<Language[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  
  // Selected items
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [showLanguageForm, setShowLanguageForm] = useState(false);
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [showDialogueCreator, setShowDialogueCreator] = useState(false);
  const [editingDialogue, setEditingDialogue] = useState<Dialogue | null>(null);
  const [showDialogueEditor, setShowDialogueEditor] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  
  // Form states
  const [languageForm, setLanguageForm] = useState({
    name: '',
    code: ''
  });
  
  const [domainForm, setDomainForm] = useState({
    title: '',
    description: '',
    difficulty: 'Beginner',
    color: '#3B82F6'
  });
  
  const [dialogueForm, setDialogueForm] = useState({
    title: '',
    description: '',
    duration: '',
    difficulty: 'Beginner'
  });
  
  const [segments, setSegments] = useState<DialogueSegment[]>([
    { segment_order: 1, text_content: '' },
    { segment_order: 2, text_content: '' },
    { segment_order: 3, text_content: '' },
    { segment_order: 4, text_content: '' },
    { segment_order: 5, text_content: '' },
    { segment_order: 6, text_content: '' },
    { segment_order: 7, text_content: '' },
    { segment_order: 8, text_content: '' },
    { segment_order: 9, text_content: '' },
    { segment_order: 10, text_content: '' }
  ]);
  
  const { toast } = useToast();
  
  useEffect(() => {
    fetchLanguages();
  }, []);
  
  useEffect(() => {
    if (currentView === 'domains' && selectedLanguage) {
      fetchDomains();
    }
  }, [currentView, selectedLanguage]);
  
  useEffect(() => {
    if (selectedDomain && selectedLanguage && currentView === 'dialogues') {
      fetchDialogues(selectedDomain.id, selectedLanguage.id);
    }
  }, [selectedDomain, selectedLanguage, currentView]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);

  // Fetch functions
  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Error fetching languages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch languages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    if (!selectedLanguage) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      setDomains([]); // Set empty array on error
      toast({
        title: "Error",
        description: "Failed to fetch domains. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDialogues = async (domainId: string, languageId: string) => {
    try {
      const { data, error } = await supabase
        .from('dialogues')
        .select('*')
        .eq('domain_id', domainId)
        .eq('language_id', languageId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDialogues(data || []);
    } catch (error) {
      console.error('Error fetching dialogues:', error);
    }
  };

  // Handle language actions
  const handleLanguageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('languages')
        .insert([languageForm]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Language created successfully"
      });
      
      setLanguageForm({ name: '', code: '' });
      setShowLanguageForm(false);
      fetchLanguages();
    } catch (error) {
      console.error('Error saving language:', error);
      toast({
        title: "Error",
        description: "Failed to save language",
        variant: "destructive"
      });
    }
  };

  const handleSelectLanguage = (language: Language) => {
    setSelectedLanguage(language);
    setCurrentView('domains');
  };

  // Handle domain actions
  const handleDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('domains')
        .insert([domainForm]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Domain created successfully"
      });
      
      setDomainForm({
        title: '',
        description: '',
        difficulty: 'Beginner',
        color: '#3B82F6'
      });
      setShowDomainForm(false);
      fetchDomains();
    } catch (error) {
      console.error('Error saving domain:', error);
      toast({
        title: "Error",
        description: "Failed to save domain",
        variant: "destructive"
      });
    }
  };

  const handleSelectDomain = (domain: Domain) => {
    setSelectedDomain(domain);
    setCurrentView('dialogues');
  };

  const handleEditDomain = (domain: Domain) => {
    setEditingDomain(domain);
    setShowDomainForm(true);
    setDomainForm({
      title: domain.title,
      description: domain.description || '',
      difficulty: domain.difficulty,
      color: domain.color
    });
  };

  const handleUpdateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDomain) return;
    
    try {
      const { error } = await supabase
        .from('domains')
        .update(domainForm)
        .eq('id', editingDomain.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Domain updated successfully"
      });
      
      setDomainForm({
        title: '',
        description: '',
        difficulty: 'Beginner',
        color: '#3B82F6'
      });
      setEditingDomain(null);
      setShowDomainForm(false);
      fetchDomains();
    } catch (error) {
      console.error('Error updating domain:', error);
      toast({
        title: "Error",
        description: "Failed to update domain",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDomain = async (domain: Domain) => {
    try {
      const { error: dialoguesError } = await supabase
        .from('dialogues')
        .delete()
        .eq('domain_id', domain.id);
      
      if (dialoguesError) throw dialoguesError;

      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domain.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Domain deleted successfully"
      });
      
      setDeleteConfirmOpen(false);
      setDomainToDelete(null);
      fetchDomains();
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast({
        title: "Error",
        description: "Failed to delete domain",
        variant: "destructive"
      });
    }
  };

  // Handle audio playback
  const handlePlayAudio = async (audioUrl: string, index: number) => {
    try {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      // If clicking the same audio that's playing, stop it
      if (playingAudioIndex === index) {
        setPlayingAudioIndex(null);
        setAudioElement(null);
        setAudioProgress(0);
        setAudioCurrentTime(0);
        setAudioDuration(0);
        return;
      }

      // Get signed URL from Supabase storage
      const { data, error } = await supabase.storage
        .from('dialogue-audio')
        .createSignedUrl(audioUrl, 3600);

      if (error) throw error;

      if (data?.signedUrl) {
        const audio = new Audio(data.signedUrl);
        
        // Set up event listeners
        audio.onloadedmetadata = () => {
          setAudioDuration(audio.duration);
        };
        
        audio.ontimeupdate = () => {
          setAudioCurrentTime(audio.currentTime);
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        };
        
        audio.onended = () => {
          setPlayingAudioIndex(null);
          setAudioElement(null);
          setAudioProgress(0);
          setAudioCurrentTime(0);
          setAudioDuration(0);
        };
        
        audio.onerror = () => {
          toast({
            title: "Error",
            description: "Failed to play audio file",
            variant: "destructive"
          });
          setPlayingAudioIndex(null);
          setAudioElement(null);
          setAudioProgress(0);
          setAudioCurrentTime(0);
          setAudioDuration(0);
        };
        
        await audio.play();
        setAudioElement(audio);
        setPlayingAudioIndex(index);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: "Error",
        description: "Failed to load audio file",
        variant: "destructive"
      });
    }
  };

  const handleAudioSeek = (value: number[]) => {
    if (audioElement && audioDuration) {
      const newTime = (value[0] / 100) * audioDuration;
      audioElement.currentTime = newTime;
      setAudioCurrentTime(newTime);
      setAudioProgress(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle dialogue actions
  const uploadAudioFile = async (file: File, dialogueId: string, segmentOrder: number) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${dialogueId}_segment_${segmentOrder}.${fileExt}`;
    const filePath = `${selectedLanguage?.code}/${selectedDomain?.title}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('dialogue-audio')
      .upload(filePath, file);

    if (error) throw error;
    return data.path;
  };

  const handleCreateDialogue = async () => {
    if (!selectedDomain || !selectedLanguage) return;
    
    try {
      const { data: dialogueData, error: dialogueError } = await supabase
        .from('dialogues')
        .insert([{
          ...dialogueForm,
          domain_id: selectedDomain.id,
          language_id: selectedLanguage.id
        }])
        .select()
        .single();
      
      if (dialogueError) throw dialogueError;

      // Process segments with text content
      const segmentsToProcess = segments.filter(segment => segment.text_content.trim() !== '');
      
      for (const segment of segmentsToProcess) {
        let audioUrl = null;
        
        // Upload audio file if provided
        if (segment.audio_file) {
          try {
            audioUrl = await uploadAudioFile(segment.audio_file, dialogueData.id, segment.segment_order);
          } catch (uploadError) {
            console.error('Error uploading audio:', uploadError);
            toast({
              title: "Warning",
              description: `Audio upload failed for segment ${segment.segment_order}`,
              variant: "destructive"
            });
          }
        }

        // Insert segment into database
        const { error: segmentError } = await supabase
          .from('dialogue_segments')
          .insert({
            dialogue_id: dialogueData.id,
            segment_order: segment.segment_order,
            text_content: segment.text_content,
            audio_url: audioUrl,
            start_time: 0,
            end_time: 0
          });
        
        if (segmentError) throw segmentError;
      }

      toast({
        title: "Success",
        description: "Dialogue created successfully!"
      });

      // Reset forms
      setDialogueForm({
        title: '',
        description: '',
        duration: '',
        difficulty: 'Beginner'
      });

      setSegments([
        { segment_order: 1, text_content: '' },
        { segment_order: 2, text_content: '' },
        { segment_order: 3, text_content: '' },
        { segment_order: 4, text_content: '' },
        { segment_order: 5, text_content: '' },
        { segment_order: 6, text_content: '' },
        { segment_order: 7, text_content: '' },
        { segment_order: 8, text_content: '' },
        { segment_order: 9, text_content: '' },
        { segment_order: 10, text_content: '' }
      ]);
      
      setShowDialogueCreator(false);
      fetchDialogues(selectedDomain.id, selectedLanguage.id);
    } catch (error) {
      console.error('Error creating dialogue:', error);
      toast({
        title: "Error",
        description: "Failed to create dialogue",
        variant: "destructive"
      });
    }
  };

  const handleEditDialogue = async (dialogue: Dialogue) => {
    setEditingDialogue(dialogue);
    setDialogueForm({
      title: dialogue.title,
      description: dialogue.description || '',
      duration: dialogue.duration || '',
      difficulty: dialogue.difficulty
    });

    // Fetch existing segments for this dialogue
    try {
      const { data: segmentData, error } = await supabase
        .from('dialogue_segments')
        .select('*')
        .eq('dialogue_id', dialogue.id)
        .order('segment_order');
      
      if (error) throw error;
      
      const existingSegments: DialogueSegment[] = segmentData.map(segment => ({
        id: segment.id,
        dialogue_id: segment.dialogue_id,
        segment_order: segment.segment_order,
        text_content: segment.text_content || '',
        translation: segment.translation || '',
        audio_url: segment.audio_url,
        start_time: segment.start_time,
        end_time: segment.end_time
      }));
      
      // Fill remaining slots up to 10 segments
      while (existingSegments.length < 10) {
        existingSegments.push({
          segment_order: existingSegments.length + 1,
          text_content: '',
          translation: ''
        });
      }
      
      setSegments(existingSegments);
      setShowDialogueEditor(true);
    } catch (error) {
      console.error('Error fetching dialogue segments:', error);
      toast({
        title: "Error",
        description: "Failed to load dialogue segments",
        variant: "destructive"
      });
    }
  };

  const handleUpdateDialogue = async () => {
    if (!editingDialogue || !selectedDomain || !selectedLanguage) return;
    
    try {
      // Update dialogue metadata
      const { error: dialogueError } = await supabase
        .from('dialogues')
        .update(dialogueForm)
        .eq('id', editingDialogue.id);
      
      if (dialogueError) throw dialogueError;

      // Delete existing segments
      const { error: deleteError } = await supabase
        .from('dialogue_segments')
        .delete()
        .eq('dialogue_id', editingDialogue.id);
      
      if (deleteError) throw deleteError;

      // Process segments with text content
      const segmentsToProcess = segments.filter(segment => segment.text_content.trim() !== '');
      
      for (const segment of segmentsToProcess) {
        let audioUrl = segment.audio_url;
        
        // Upload new audio file if provided
        if (segment.audio_file) {
          try {
            audioUrl = await uploadAudioFile(segment.audio_file, editingDialogue.id, segment.segment_order);
          } catch (uploadError) {
            console.error('Error uploading audio:', uploadError);
            toast({
              title: "Warning",
              description: `Audio upload failed for segment ${segment.segment_order}`,
              variant: "destructive"
            });
          }
        }

        // Insert updated segment into database
        const { error: segmentError } = await supabase
          .from('dialogue_segments')
          .insert({
            dialogue_id: editingDialogue.id,
            segment_order: segment.segment_order,
            text_content: segment.text_content,
            translation: segment.translation,
            audio_url: audioUrl,
            start_time: segment.start_time || 0,
            end_time: segment.end_time || 0
          });
        
        if (segmentError) throw segmentError;
      }

      toast({
        title: "Success",
        description: "Dialogue updated successfully!"
      });

      // Reset forms
      setEditingDialogue(null);
      setShowDialogueEditor(false);
      setDialogueForm({
        title: '',
        description: '',
        duration: '',
        difficulty: 'Beginner'
      });

      setSegments([
        { segment_order: 1, text_content: '' },
        { segment_order: 2, text_content: '' },
        { segment_order: 3, text_content: '' },
        { segment_order: 4, text_content: '' },
        { segment_order: 5, text_content: '' },
        { segment_order: 6, text_content: '' },
        { segment_order: 7, text_content: '' },
        { segment_order: 8, text_content: '' },
        { segment_order: 9, text_content: '' },
        { segment_order: 10, text_content: '' }
      ]);
      
      fetchDialogues(selectedDomain.id, selectedLanguage.id);
    } catch (error) {
      console.error('Error updating dialogue:', error);
      toast({
        title: "Error",
        description: "Failed to update dialogue",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDialogue = async (dialogue: Dialogue) => {
    try {
      const { error: segmentsError } = await supabase
        .from('dialogue_segments')
        .delete()
        .eq('dialogue_id', dialogue.id);
      
      if (segmentsError) throw segmentsError;

      const { error } = await supabase
        .from('dialogues')
        .delete()
        .eq('id', dialogue.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Dialogue deleted successfully"
      });
      
      if (selectedDomain && selectedLanguage) {
        fetchDialogues(selectedDomain.id, selectedLanguage.id);
      }
    } catch (error) {
      console.error('Error deleting dialogue:', error);
      toast({
        title: "Error",
        description: "Failed to delete dialogue",
        variant: "destructive"
      });
    }
  };

  // Segment management
  const updateSegment = (index: number, field: keyof DialogueSegment, value: string | File) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setSegments(newSegments);
  };

  const addSegment = () => {
    const newSegment: DialogueSegment = {
      segment_order: segments.length + 1,
      text_content: '',
      translation: ''
    };
    setSegments([...segments, newSegment]);
  };

  const removeSegment = (index: number) => {
    if (segments.length > 1) {
      const newSegments = segments.filter((_, i) => i !== index);
      const reorderedSegments = newSegments.map((segment, i) => ({
        ...segment,
        segment_order: i + 1
      }));
      setSegments(reorderedSegments);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  // Language Selection View
  if (currentView === 'languages') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Select Language</h1>
        </div>

        {/* Add Language Section */}
        <Card className="border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardContent className="p-6">
            <Collapsible open={showLanguageForm} onOpenChange={setShowLanguageForm}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5">
                  <Plus className="h-8 w-8 text-primary" />
                  <span className="text-lg font-semibold">Add New Language</span>
                  <span className="text-sm text-muted-foreground">Click to add a new language</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showLanguageForm ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-4">
                <form onSubmit={handleLanguageSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Language Name</label>
                      <Input
                        value={languageForm.name}
                        onChange={(e) => setLanguageForm({ ...languageForm, name: e.target.value })}
                        placeholder="e.g., English, Hindi, Nepali"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Language Code</label>
                      <Input
                        value={languageForm.code}
                        onChange={(e) => setLanguageForm({ ...languageForm, code: e.target.value })}
                        placeholder="e.g., en, hi, ne"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Add Language</Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setLanguageForm({ name: '', code: '' });
                      setShowLanguageForm(false);
                    }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Languages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {languages.map((language) => (
            <Card 
              key={language.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
              onClick={() => handleSelectLanguage(language)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{language.name}</h3>
                    <p className="text-sm text-muted-foreground">Code: {language.code}</p>
                  </div>
                  <div className="text-primary">
                    <ArrowLeft className="h-5 w-5 rotate-180" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Domains View
  if (currentView === 'domains') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setCurrentView('languages')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Languages
            </Button>
            <h1 className="text-3xl font-bold">
              Domains ({selectedLanguage?.name})
            </h1>
          </div>
        </div>

        {/* Domains Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((domain) => (
            <Card 
              key={domain.id} 
              className="hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => handleSelectDomain(domain)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: domain.color }}
                      />
                      <h3 className="text-lg font-semibold">{domain.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{domain.description}</p>
                    <Badge variant="secondary">{domain.difficulty}</Badge>
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowLeft className="h-3 w-3 rotate-180" />
                      <span>Click to manage dialogues</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-50 hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDomain(domain);
                      }}>
                        View Dialogues
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleEditDomain(domain);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDomainToDelete(domain);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Domain Section */}
        <Card className="border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardContent className="p-6">
            <Collapsible open={showDomainForm} onOpenChange={setShowDomainForm}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5">
                  <Plus className="h-8 w-8 text-primary" />
                  <span className="text-lg font-semibold">Add New Domain</span>
                  <span className="text-sm text-muted-foreground">Click to create a new domain</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showDomainForm ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-4">
                <form onSubmit={editingDomain ? handleUpdateDomain : handleDomainSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Domain Title</label>
                      <Input
                        value={domainForm.title}
                        onChange={(e) => setDomainForm({ ...domainForm, title: e.target.value })}
                        placeholder="Enter domain title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Difficulty</label>
                      <Select 
                        value={domainForm.difficulty} 
                        onValueChange={(value) => setDomainForm({ ...domainForm, difficulty: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Color</label>
                      <Input
                        type="color"
                        value={domainForm.color}
                        onChange={(e) => setDomainForm({ ...domainForm, color: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={domainForm.description}
                      onChange={(e) => setDomainForm({ ...domainForm, description: e.target.value })}
                      placeholder="Enter domain description"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingDomain ? 'Update Domain' : 'Add Domain'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setDomainForm({
                        title: '',
                        description: '',
                        difficulty: 'Beginner',
                        color: '#3B82F6'
                      });
                      setEditingDomain(null);
                      setShowDomainForm(false);
                    }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Domain</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{domainToDelete?.title}"? This will also delete all associated dialogues and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => domainToDelete && handleDeleteDomain(domainToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Dialogues View
  if (currentView === 'dialogues' && selectedDomain && selectedLanguage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setCurrentView('domains')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Domains
            </Button>
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: selectedDomain.color }}
            />
            <h1 className="text-3xl font-bold">
              {selectedDomain.title} ({selectedLanguage.name})
            </h1>
          </div>
        </div>

        {/* Add Dialogue Section */}
        <Card className="border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardContent className="p-6">
            <Collapsible open={showDialogueCreator} onOpenChange={setShowDialogueCreator}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5">
                  <Plus className="h-8 w-8 text-primary" />
                  <span className="text-lg font-semibold">Add New Dialogue</span>
                  <span className="text-sm text-muted-foreground">Click to create a dialogue with segments</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showDialogueCreator ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-4 space-y-6">
                {/* Dialogue Details Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dialogue Title</label>
                    <Input
                      value={dialogueForm.title}
                      onChange={(e) => setDialogueForm({ ...dialogueForm, title: e.target.value })}
                      placeholder="Enter dialogue title"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration</label>
                    <Input
                      value={dialogueForm.duration}
                      onChange={(e) => setDialogueForm({ ...dialogueForm, duration: e.target.value })}
                      placeholder="e.g., 5 minutes"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty</label>
                    <Select 
                      value={dialogueForm.difficulty} 
                      onValueChange={(value) => setDialogueForm({ ...dialogueForm, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={dialogueForm.description}
                    onChange={(e) => setDialogueForm({ ...dialogueForm, description: e.target.value })}
                    placeholder="Enter dialogue description"
                    rows={3}
                  />
                </div>

                {/* Segments Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dialogue Segments</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {segments.map((segment, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Segment {segment.segment_order}</h4>
                            {segments.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeSegment(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Audio File</label>
                            <Input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  updateSegment(index, 'audio_file', file);
                                }
                              }}
                              className="file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer text-sm text-muted-foreground"
                            />
                            {segment.audio_file && (
                              <p className="text-xs text-muted-foreground">
                                Selected: {segment.audio_file.name}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Transcript</label>
                            <Textarea
                              value={segment.text_content}
                              onChange={(e) => updateSegment(index, 'text_content', e.target.value)}
                              placeholder="Enter the dialogue text..."
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Translation</label>
                            <Textarea
                              value={segment.translation || ''}
                              onChange={(e) => updateSegment(index, 'translation', e.target.value)}
                              placeholder="Enter the translation..."
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addSegment}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Segment
                  </Button>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateDialogue}>
                    Create Dialogue
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowDialogueCreator(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Dialogue Editor */}
        <Card className={showDialogueEditor ? "block" : "hidden"}>
          <CardContent className="p-6">
            <Collapsible open={showDialogueEditor}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full mb-4">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Dialogue: {editingDialogue?.title}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={dialogueForm.title}
                      onChange={(e) => setDialogueForm(prev => ({...prev, title: e.target.value}))}
                      placeholder="Enter dialogue title..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty</label>
                    <Select
                      value={dialogueForm.difficulty}
                      onValueChange={(value) => setDialogueForm(prev => ({...prev, difficulty: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration</label>
                    <Input
                      value={dialogueForm.duration}
                      onChange={(e) => setDialogueForm(prev => ({...prev, duration: e.target.value}))}
                      placeholder="e.g., 5 minutes"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={dialogueForm.description}
                    onChange={(e) => setDialogueForm(prev => ({...prev, description: e.target.value}))}
                    placeholder="Enter dialogue description..."
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Edit Dialogue Segments</h4>
                  <div className="space-y-4">
                    {segments.map((segment, index) => (
                      <Card key={index} className="border-l-4 border-l-primary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Segment {segment.segment_order}</CardTitle>
                            {segments.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSegment(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Audio File</label>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  updateSegment(index, 'audio_file', file);
                                }
                              }}
                              className="ml-4 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer text-sm text-muted-foreground"
                            />
                            {segment.audio_file && (
                              <p className="text-xs text-muted-foreground">
                                Selected: {segment.audio_file.name}
                              </p>
                            )}
                            {segment.audio_url && !segment.audio_file && (
                              <div className="mt-2 space-y-2">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-muted-foreground">
                                    📁 {segment.audio_url.split('/').pop()}
                                  </p>
                                </div>
                                {/* Audio Player */}
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePlayAudio(segment.audio_url!, index)}
                                    className="h-10 w-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white p-0 flex-shrink-0"
                                  >
                                    {playingAudioIndex === index ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4 ml-0.5" />
                                    )}
                                  </Button>
                                  
                                  <div className="flex-1 space-y-1">
                                    <Slider
                                      value={[playingAudioIndex === index ? audioProgress : 0]}
                                      onValueChange={playingAudioIndex === index ? handleAudioSeek : undefined}
                                      max={100}
                                      step={0.1}
                                      className="cursor-pointer"
                                      disabled={playingAudioIndex !== index}
                                    />
                                  </div>
                                  
                                  <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                                    {playingAudioIndex === index 
                                      ? `${formatTime(audioCurrentTime)} / ${formatTime(audioDuration)}`
                                      : '00:00 / 00:00'
                                    }
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Transcript</label>
                            <Textarea
                              value={segment.text_content}
                              onChange={(e) => updateSegment(index, 'text_content', e.target.value)}
                              placeholder="Enter the dialogue text..."
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Translation</label>
                            <Textarea
                              value={segment.translation || ''}
                              onChange={(e) => updateSegment(index, 'translation', e.target.value)}
                              placeholder="Enter the translation..."
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addSegment}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Segment
                  </Button>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateDialogue}>
                    Update Dialogue
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowDialogueEditor(false);
                      setEditingDialogue(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Dialogues List */}
        <div className="space-y-4">
          {dialogues.map((dialogue) => (
            <Card key={dialogue.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{dialogue.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{dialogue.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{dialogue.difficulty}</Badge>
                      {dialogue.duration && <Badge variant="outline">{dialogue.duration}</Badge>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        onClick={() => handleEditDialogue(dialogue)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Segments
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteDialogue(dialogue)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return null;
};