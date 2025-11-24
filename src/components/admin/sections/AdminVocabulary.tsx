import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Edit, Trash2, Upload, Search, ArrowLeft, ChevronDown, Volume2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Language {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  example_sentence: string;
  difficulty_level: string;
  category: string;
  audio_url: string;
  language_id: string;
  created_at: string;
  english_word?: string;
  target_word?: string;
}

interface Domain {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  color: string;
}

export const AdminVocabulary = () => {
  // View states
  const [currentView, setCurrentView] = useState<'languages' | 'vocabulary'>('languages');
  
  // Data states
  const [languages, setLanguages] = useState<Language[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [filteredVocabulary, setFilteredVocabulary] = useState<VocabularyItem[]>([]);
  
  // Selected items
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [showLanguageForm, setShowLanguageForm] = useState(false);
  
  // Form states
  const [languageForm, setLanguageForm] = useState({
    name: '',
    code: ''
  });
  
  const [formData, setFormData] = useState({
    english_word: '',
    target_word: '',
    description: '',
    difficulty_level: 'Beginner',
    english_audio_file: null as File | null,
    target_audio_file: null as File | null
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchLanguages();
    fetchDomains();
  }, []);

  useEffect(() => {
    if (selectedLanguage && currentView === 'vocabulary') {
      fetchVocabulary(selectedLanguage.id);
    }
  }, [selectedLanguage, currentView]);

  useEffect(() => {
    filterVocabulary();
  }, [vocabulary, searchTerm, filterBy]);

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
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast({
        title: "Error",
        description: "Failed to fetch domains",
        variant: "destructive"
      });
    }
  };

  const fetchVocabulary = async (languageId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('language_id', languageId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setVocabulary(data || []);
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vocabulary",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVocabulary = () => {
    let filtered = vocabulary;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterBy !== 'all') {
      if (filterBy === 'difficulty') {
        // Group by difficulty levels if needed
      } else {
        filtered = filtered.filter(item => item.difficulty_level === filterBy);
      }
    }
    setFilteredVocabulary(filtered);
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
    setCurrentView('vocabulary');
  };

  // Handle vocabulary actions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLanguage) return;
    
    try {
      let english_audio_url = '';
      let target_audio_url = '';
      
      // Upload English audio file if provided
      if (formData.english_audio_file) {
        const fileExt = formData.english_audio_file.name.split('.').pop();
        const fileName = `english_${Math.random()}.${fileExt}`;
        const filePath = `vocabulary/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(filePath, formData.english_audio_file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('audio')
          .getPublicUrl(filePath);
        
        english_audio_url = publicUrl;
      }

      // Upload target language audio file if provided
      if (formData.target_audio_file) {
        const fileExt = formData.target_audio_file.name.split('.').pop();
        const fileName = `target_${Math.random()}.${fileExt}`;
        const filePath = `vocabulary/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(filePath, formData.target_audio_file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('audio')
          .getPublicUrl(filePath);
        
        target_audio_url = publicUrl;
      }

      // Combine both audio URLs if available
      const combined_audio_url = [english_audio_url, target_audio_url].filter(Boolean).join('|');

      const vocabData = {
        word: `${formData.english_word} → ${formData.target_word}`,
        definition: formData.description,
        example_sentence: '',
        difficulty_level: formData.difficulty_level,
        category: selectedLanguage.name,
        audio_url: combined_audio_url || undefined,
        language_id: selectedLanguage.id
      };
      
      if (editingId) {
        const { error } = await supabase
          .from('vocabulary')
          .update(vocabData)
          .eq('id', editingId);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Vocabulary item updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('vocabulary')
          .insert([vocabData]);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Vocabulary item created successfully"
        });
      }
      
      setFormData({
        english_word: '',
        target_word: '',
        description: '',
        difficulty_level: 'Beginner',
        english_audio_file: null,
        target_audio_file: null
      });
      setEditingId(null);
      fetchVocabulary(selectedLanguage.id);
    } catch (error) {
      console.error('Error saving vocabulary:', error);
      toast({
        title: "Error",
        description: "Failed to save vocabulary item",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: VocabularyItem) => {
    const [english, target] = item.word.split(' → ');
    setFormData({
      english_word: english || '',
      target_word: target || '',
      description: item.definition,
      difficulty_level: item.difficulty_level,
      english_audio_file: null,
      target_audio_file: null
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vocabulary item?')) return;
    
    try {
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Vocabulary item deleted successfully"
      });
      
      if (selectedLanguage) {
        fetchVocabulary(selectedLanguage.id);
      }
    } catch (error) {
      console.error('Error deleting vocabulary:', error);
      toast({
        title: "Error",
        description: "Failed to delete vocabulary item",
        variant: "destructive"
      });
    }
  };

  const cancelEdit = () => {
    setFormData({
      english_word: '',
      target_word: '',
      description: '',
      difficulty_level: 'Beginner',
      english_audio_file: null,
      target_audio_file: null
    });
    setEditingId(null);
  };

  const playAudio = (text: string, lang: string = 'en-US') => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const playAudioFile = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      toast({
        title: "Error",
        description: "Failed to play audio",
        variant: "destructive"
      });
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  // Language Selection View
  if (currentView === 'languages') {
    return (
      <div className="space-y-6 my-[88px]">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Select Language for Vocabulary</h1>
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
                        placeholder="e.g., Hindi, Nepali, Punjabi"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Language Code</label>
                      <Input
                        value={languageForm.code}
                        onChange={(e) => setLanguageForm({ ...languageForm, code: e.target.value })}
                        placeholder="e.g., hi, ne, pa"
                        maxLength={3}
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
              className="hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => handleSelectLanguage(language)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{language.name}</h3>
                    <p className="text-sm text-muted-foreground">Code: {language.code}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowLeft className="h-3 w-3 rotate-180" />
                      <span>Click to manage vocabulary</span>
                    </div>
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

  // Vocabulary Management View
  if (currentView === 'vocabulary' && selectedLanguage) {
    const categories = [...new Set(vocabulary.map(item => item.category).filter(Boolean))];
    
    return (
      <div className="space-y-6 my-[88px]">
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
              Vocabulary Management ({selectedLanguage.name})
            </h1>
          </div>
        </div>

        {/* Create/Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Vocabulary Item' : 'Add New Vocabulary Item'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Language Direction Header */}
              <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
                <span className="text-lg font-semibold">English</span>
                <ArrowRight className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold text-primary">{selectedLanguage.name}</span>
              </div>

              {/* Word Input Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* English Word Box */}
                <Card className="border-2 border-muted">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">English Word</label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(formData.english_word, 'en-US')}
                        disabled={!formData.english_word}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={formData.english_word}
                      onChange={(e) => setFormData({ ...formData, english_word: e.target.value })}
                      placeholder="Enter English word"
                      required
                      className="text-lg"
                    />
                  </CardContent>
                </Card>

                {/* Target Language Word Box */}
                <Card className="border-2 border-primary/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{selectedLanguage.name} Word</label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(formData.target_word, selectedLanguage.code)}
                        disabled={!formData.target_word}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={formData.target_word}
                      onChange={(e) => setFormData({ ...formData, target_word: e.target.value })}
                      placeholder={`Enter ${selectedLanguage.name} word`}
                      required
                      className="text-lg"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Audio Upload Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* English Audio Box */}
                <Card className="border-2 border-muted">
                  <CardContent className="p-4 space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      English Audio
                    </label>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ ...formData, english_audio_file: file });
                        }
                      }}
                      className="cursor-pointer"
                      required={!editingId}
                    />
                    {formData.english_audio_file && (
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {formData.english_audio_file.name}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Upload English pronunciation audio
                    </p>
                  </CardContent>
                </Card>

                {/* Target Language Audio Box */}
                <Card className="border-2 border-primary/50">
                  <CardContent className="p-4 space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      {selectedLanguage.name} Audio
                    </label>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ ...formData, target_audio_file: file });
                        }
                      }}
                      className="cursor-pointer"
                      required={!editingId}
                    />
                    {formData.target_audio_file && (
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {formData.target_audio_file.name}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Upload {selectedLanguage.name} pronunciation audio
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Word description, meaning, and example sentences"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty Level</label>
                <Select
                  value={formData.difficulty_level}
                  onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
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

              <div className="flex gap-2">
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Add'} Vocabulary Item
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vocabulary..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vocabulary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vocabulary Items ({filteredVocabulary.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading vocabulary...</div>
            ) : filteredVocabulary.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No vocabulary items found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>English → Target</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Audio</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVocabulary.map((item) => {
                    const [english, target] = item.word.split(' → ');
                    const [englishAudio, targetAudio] = item.audio_url?.split('|') || [];
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span>{english}</span>
                              {englishAudio && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => playAudioFile(englishAudio)}
                                >
                                  <Volume2 className="h-3 w-3 text-primary" />
                                </Button>
                              )}
                            </div>
                            <span className="text-muted-foreground">→</span>
                            <div className="flex items-center gap-2">
                              <span>{target}</span>
                              {targetAudio && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => playAudioFile(targetAudio)}
                                >
                                  <Volume2 className="h-3 w-3 text-primary" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{item.definition}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.difficulty_level}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.audio_url ? (
                            <Badge variant="default">
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="outline">No audio</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};