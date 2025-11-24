import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, GripVertical, Plus, Save, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  difficulty: string;
  duration: string;
  domain: Domain;
}

interface MockTest {
  id: string;
  title: string;
  language_id: string;
  language?: { name: string };
  dialogue1_id: string;
  dialogue2_id: string;
  dialogue1?: Dialogue;
  dialogue2?: Dialogue;
  difficulty: string;
  time_limit_minutes: number;
  is_active: boolean;
  created_at: string;
}

export const AdminMockTests = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // New mock test form state
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestDifficulty, setNewTestDifficulty] = useState('Intermediate');
  const [newTestTimeLimit, setNewTestTimeLimit] = useState(20);
  const [selectedDialogue1, setSelectedDialogue1] = useState<Dialogue | null>(null);
  const [selectedDialogue2, setSelectedDialogue2] = useState<Dialogue | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchLanguages();
    fetchMockTests();
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      fetchDialogues();
    }
  }, [selectedLanguage]);

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

  const fetchDialogues = async () => {
    if (!selectedLanguage) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('dialogues')
      .select(`
        id,
        title,
        difficulty,
        duration,
        domains!dialogues_domain_id_fkey (
          id,
          title,
          color
        )
      `)
      .eq('language_id', selectedLanguage)
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
        difficulty: dialogue.difficulty || 'Intermediate',
        duration: dialogue.duration || '10 min',
        domain: dialogue.domains as Domain
      })) || [];
      setDialogues(formattedDialogues);
    }
    setLoading(false);
  };

  const fetchMockTests = async () => {
    const { data, error } = await supabase
      .from('mock_tests')
      .select(`
        *,
        languages (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch mock tests",
        variant: "destructive",
      });
      return;
    }

    // Fetch dialogue details separately to avoid complex joins
    const mockTestsWithDialogues = await Promise.all(
      (data || []).map(async (mockTest) => {
        const [dialogue1Result, dialogue2Result] = await Promise.all([
          supabase
            .from('dialogues')
            .select(`
              id,
              title,
              difficulty,
              duration,
              domains!dialogues_domain_id_fkey (
                id,
                title,
                color
              )
            `)
            .eq('id', mockTest.dialogue1_id)
            .single(),
          supabase
            .from('dialogues')
            .select(`
              id,
              title,
              difficulty,
              duration,
              domains!dialogues_domain_id_fkey (
                id,
                title,
                color
              )
            `)
            .eq('id', mockTest.dialogue2_id)
            .single()
        ]);

        const dialogue1 = dialogue1Result.data ? {
          id: dialogue1Result.data.id,
          title: dialogue1Result.data.title,
          difficulty: dialogue1Result.data.difficulty || 'Intermediate',
          duration: dialogue1Result.data.duration || '10 min',
          domain: dialogue1Result.data.domains as Domain
        } : null;

        const dialogue2 = dialogue2Result.data ? {
          id: dialogue2Result.data.id,
          title: dialogue2Result.data.title,
          difficulty: dialogue2Result.data.difficulty || 'Intermediate',
          duration: dialogue2Result.data.duration || '10 min',
          domain: dialogue2Result.data.domains as Domain
        } : null;

        return {
          ...mockTest,
          dialogue1,
          dialogue2
        };
      })
    );

    setMockTests(mockTestsWithDialogues);
  };

  const handleDragStart = (e: React.DragEvent, dialogue: Dialogue) => {
    e.dataTransfer.setData('dialogue', JSON.stringify(dialogue));
  };

  const handleDrop = (e: React.DragEvent, slot: 'dialogue1' | 'dialogue2') => {
    e.preventDefault();
    const dialogueData = e.dataTransfer.getData('dialogue');
    const dialogue = JSON.parse(dialogueData) as Dialogue;
    
    if (slot === 'dialogue1') {
      setSelectedDialogue1(dialogue);
    } else {
      setSelectedDialogue2(dialogue);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearSlot = (slot: 'dialogue1' | 'dialogue2') => {
    if (slot === 'dialogue1') {
      setSelectedDialogue1(null);
    } else {
      setSelectedDialogue2(null);
    }
  };

  const createMockTest = async () => {
    if (!newTestTitle || !selectedLanguage || !selectedDialogue1 || !selectedDialogue2) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select two dialogues",
        variant: "destructive",
      });
      return;
    }

    if (selectedDialogue1.id === selectedDialogue2.id) {
      toast({
        title: "Error",
        description: "Please select two different dialogues",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('mock_tests')
      .insert({
        title: newTestTitle,
        language_id: selectedLanguage,
        dialogue1_id: selectedDialogue1.id,
        dialogue2_id: selectedDialogue2.id,
        difficulty: newTestDifficulty,
        time_limit_minutes: newTestTimeLimit,
        created_by: user.id
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create mock test",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Mock test created successfully",
      });
      
      // Reset form
      setNewTestTitle('');
      setSelectedDialogue1(null);
      setSelectedDialogue2(null);
      setIsCreating(false);
      
      // Refresh mock tests
      fetchMockTests();
    }
    setLoading(false);
  };

  const toggleMockTestStatus = async (mockTestId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('mock_tests')
      .update({ is_active: !currentStatus })
      .eq('id', mockTestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update mock test status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Mock test ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      fetchMockTests();
    }
  };

  const deleteMockTest = async (mockTestId: string) => {
    const { error } = await supabase
      .from('mock_tests')
      .delete()
      .eq('id', mockTestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete mock test",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Mock test deleted successfully",
      });
      fetchMockTests();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Mock Tests Management</h2>
          <p className="text-muted-foreground">Create and manage mock tests for different languages</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Mock Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Mock Test</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Section */}
              <div className="lg:col-span-1 space-y-4">
                <div>
                  <Label htmlFor="title">Mock Test Title</Label>
                  <Input
                    id="title"
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                    placeholder="Enter mock test title"
                  />
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.id} value={language.id}>
                          {language.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={newTestDifficulty} onValueChange={setNewTestDifficulty}>
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

                <div>
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={newTestTimeLimit}
                    onChange={(e) => setNewTestTimeLimit(parseInt(e.target.value))}
                    min="10"
                    max="60"
                  />
                </div>

                {/* Drop Zones */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Dialogue Slots</h3>
                  
                  {/* Dialogue 1 Slot */}
                  <div
                    className="border-2 border-dashed border-primary/20 rounded-lg p-3 min-h-[80px] transition-colors hover:border-primary/40"
                    onDrop={(e) => handleDrop(e, 'dialogue1')}
                    onDragOver={handleDragOver}
                  >
                    <h4 className="font-medium mb-1 text-sm">Dialogue 1</h4>
                    {selectedDialogue1 ? (
                      <div className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                        <div>
                          <p className="font-medium">{selectedDialogue1.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedDialogue1.domain?.title} • {selectedDialogue1.difficulty}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => clearSlot('dialogue1')}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-3 text-xs">
                        Drop dialogue here
                      </p>
                    )}
                  </div>

                  {/* Dialogue 2 Slot */}
                  <div
                    className="border-2 border-dashed border-primary/20 rounded-lg p-3 min-h-[80px] transition-colors hover:border-primary/40"
                    onDrop={(e) => handleDrop(e, 'dialogue2')}
                    onDragOver={handleDragOver}
                  >
                    <h4 className="font-medium mb-1 text-sm">Dialogue 2</h4>
                    {selectedDialogue2 ? (
                      <div className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                        <div>
                          <p className="font-medium">{selectedDialogue2.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedDialogue2.domain?.title} • {selectedDialogue2.difficulty}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => clearSlot('dialogue2')}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-3 text-xs">
                        Drop dialogue here
                      </p>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={createMockTest} 
                  disabled={loading || !selectedDialogue1 || !selectedDialogue2 || !newTestTitle}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Mock Test
                </Button>
              </div>

              {/* Available Dialogues */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-semibold">Available Dialogues</h3>
                {!selectedLanguage ? (
                  <p className="text-muted-foreground">Please select a language to see available dialogues</p>
                ) : loading ? (
                  <p className="text-muted-foreground">Loading dialogues...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                    {dialogues.map((dialogue) => (
                      <div
                        key={dialogue.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, dialogue)}
                        className="p-3 border rounded-lg cursor-move hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                          <p className="font-medium text-sm">{dialogue.title}</p>
                        </div>
                        <div className="flex gap-1 text-xs flex-wrap">
                          <Badge 
                            variant="secondary" 
                            style={{ backgroundColor: dialogue.domain?.color || '#6b7280' }}
                            className="text-white text-xs"
                          >
                            {dialogue.domain?.title}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{dialogue.difficulty}</Badge>
                          <Badge variant="outline" className="text-xs">{dialogue.duration}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Mock Tests */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Existing Mock Tests</CardTitle>
          </CardHeader>
          <CardContent>
            {mockTests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No mock tests created yet</p>
            ) : (
              <div className="space-y-4">
                {mockTests.map((mockTest) => (
                  <div key={mockTest.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{mockTest.title}</h3>
                        <p className="text-muted-foreground">
                          {mockTest.language?.name} • {mockTest.difficulty} • {mockTest.time_limit_minutes} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={mockTest.is_active ? "default" : "secondary"}>
                          {mockTest.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMockTestStatus(mockTest.id, mockTest.is_active)}
                        >
                          {mockTest.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMockTest(mockTest.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded p-3">
                        <h4 className="font-medium mb-2">Dialogue 1</h4>
                        <p className="font-medium">{mockTest.dialogue1?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {mockTest.dialogue1?.domain?.title} • {mockTest.dialogue1?.difficulty}
                        </p>
                      </div>
                      <div className="border rounded p-3">
                        <h4 className="font-medium mb-2">Dialogue 2</h4>
                        <p className="font-medium">{mockTest.dialogue2?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {mockTest.dialogue2?.domain?.title} • {mockTest.dialogue2?.difficulty}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
