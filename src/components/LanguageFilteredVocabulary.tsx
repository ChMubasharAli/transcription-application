import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { VocabularyDetails } from './VocabularyDetails';
import { supabase } from '@/integrations/supabase/client';
import { useUserLanguage } from '@/hooks/useUserLanguage';
import { 
  BookOpenCheck, 
  Volume2, 
  Search, 
  TrendingUp, 
  Filter,
  Globe
} from 'lucide-react';

interface VocabularyWord {
  id: string;
  word: string;
  definition: string;
  example_sentence: string;
  category: string;
  difficulty_level: string;
  audio_url: string;
}

const LanguageFilteredVocabulary = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { userLanguageId, loading: languageLoading } = useUserLanguage();

  useEffect(() => {
    const fetchVocabulary = async () => {
      if (!userLanguageId || languageLoading) return;

      try {
        const { data, error } = await supabase
          .from('vocabulary')
          .select('*')
          .eq('language_id', userLanguageId)
          .order('word');

        if (error) {
          console.error('Error fetching vocabulary:', error);
        } else {
          setVocabulary(data || []);
        }
      } catch (error) {
        console.error('Error fetching vocabulary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
  }, [userLanguageId, languageLoading]);

  const filteredWords = vocabulary.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         word.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === '' || selectedLevel === 'all' || word.difficulty_level === selectedLevel;
    const matchesCategory = selectedCategory === '' || selectedCategory === 'all' || word.category === selectedCategory;
    
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const handleWordClick = (word: VocabularyWord) => {
    setSelectedWord(word);
    setIsDetailsOpen(true);
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (languageLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  if (!userLanguageId) {
    return (
      <div className="text-center p-8">
        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Language Selected</h3>
        <p className="text-muted-foreground">Please select a language in your profile to access vocabulary.</p>
      </div>
    );
  }

  const categories = [...new Set(vocabulary.map(word => word.category).filter(Boolean))];
  const levels = [...new Set(vocabulary.map(word => word.difficulty_level).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Vocabulary Builder</h2>
          <p className="text-muted-foreground">Expand your language skills with targeted vocabulary</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vocabulary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Level</label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setSelectedLevel('all');
              setSelectedCategory('all');
            }}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredWords.length} of {vocabulary.length} words
        </p>
      </div>

      {/* Vocabulary Grid */}
      <div className="grid gap-4">
        {filteredWords.length === 0 ? (
          <Card className="p-8 text-center bg-card/50 backdrop-blur border-border/50">
            <BookOpenCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vocabulary found</h3>
            <p className="text-muted-foreground">
              {vocabulary.length === 0 
                ? "No vocabulary has been added for your selected language yet."
                : "Try adjusting your search criteria or filters."
              }
            </p>
          </Card>
        ) : (
          filteredWords.map((word) => (
            <Card 
              key={word.id} 
              className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer bg-card/50 backdrop-blur border-border/50 hover:border-primary/20"
              onClick={() => handleWordClick(word)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{word.word}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(word.word);
                      }}
                      className="p-1 h-8 w-8"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-muted-foreground mb-3 line-clamp-2">{word.definition}</p>
                  
                  <div className="flex items-center gap-2">
                    {word.difficulty_level && (
                      <Badge variant="secondary" className="text-xs">
                        {word.difficulty_level}
                      </Badge>
                    )}
                    {word.category && (
                      <Badge variant="outline" className="text-xs">
                        {word.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Vocabulary Details Modal */}
      {selectedWord && (
        <VocabularyDetails
          word={{
            id: selectedWord.id,
            english: selectedWord.word,
            translated: selectedWord.word, // Using same word as fallback
            pronunciation: '', // Will be empty for now
            level: selectedWord.difficulty_level as 'Beginner' | 'Intermediate' | 'Advanced',
            definition: selectedWord.definition,
            examples: selectedWord.example_sentence ? [selectedWord.example_sentence] : [],
            translatedExamples: selectedWord.example_sentence ? [selectedWord.example_sentence] : []
          }}
          selectedLanguage="en" // Default language code
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedWord(null);
          }}
        />
      )}
    </div>
  );
};

export default LanguageFilteredVocabulary;