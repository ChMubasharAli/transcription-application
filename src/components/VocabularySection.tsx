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

interface Language {
  id: string;
  name: string;
}

interface VocabularyWord {
  id: string;
  english: string;
  translated: string;
  pronunciation: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  definition: string;
  examples: string[];
  translatedExamples: string[];
  domain: string;
}

const sampleWords: VocabularyWord[] = [
  {
    id: '1',
    english: 'University',
    translated: 'Universidad',
    pronunciation: 'ˌjuːnɪˈvɜːsɪti',
    level: 'Intermediate',
    definition: 'An institution at the highest level of education where you can study for a degree or do research',
    examples: [
      'Is there a university in this town?',
      'Both their children are at university.',
      'He\'s hoping to go to university next year.'
    ],
    translatedExamples: [
      '¿Hay una universidad en esta ciudad?',
      'Ambos hijos están en la universidad.',
      'Espera ir a la universidad el próximo año.'
    ],
    domain: 'Education'
  },
  {
    id: '2',
    english: 'Contract',
    translated: 'Contrato',
    pronunciation: 'ˈkɒntrækt',
    level: 'Advanced',
    definition: 'A legal document that states and explains a formal agreement between two different people or groups',
    examples: [
      'Please read the contract carefully before signing.',
      'The contract expires next month.'
    ],
    translatedExamples: [
      'Por favor lee el contrato cuidadosamente antes de firmar.',
      'El contrato expira el próximo mes.'
    ],
    domain: 'Legal'
  },
  {
    id: '3',
    english: 'Employment',
    translated: 'Empleo',
    pronunciation: 'ɪmˈplɔɪmənt',
    level: 'Intermediate',
    definition: 'The fact of someone being paid to work for a company or organization',
    examples: [
      'The company provides employment for 2000 people.',
      'Employment opportunities are limited in this area.'
    ],
    translatedExamples: [
      'La empresa proporciona empleo para 2000 personas.',
      'Las oportunidades de empleo son limitadas en esta área.'
    ],
    domain: 'Employment'
  },
  {
    id: '4',
    english: 'Healthcare',
    translated: 'Atención médica',
    pronunciation: 'ˈhelθkeə',
    level: 'Intermediate',
    definition: 'The organized provision of medical care to individuals or a community',
    examples: [
      'Access to healthcare is a basic human right.',
      'The healthcare system needs reform.'
    ],
    translatedExamples: [
      'El acceso a la atención médica es un derecho humano básico.',
      'El sistema de atención médica necesita reforma.'
    ],
    domain: 'Health'
  },
  {
    id: '5',
    english: 'Immigration',
    translated: 'Inmigración',
    pronunciation: 'ˌɪmɪˈɡreɪʃən',
    level: 'Advanced',
    definition: 'The action of coming to live permanently in a foreign country',
    examples: [
      'Immigration policies vary between countries.',
      'She studied immigration law at university.'
    ],
    translatedExamples: [
      'Las políticas de inmigración varían entre países.',
      'Estudió derecho de inmigración en la universidad.'
    ],
    domain: 'Immigration/Settlement'
  }
];

const languages = [
  { code: 'hi', name: 'Hindi' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ne', name: 'Nepali' }
];

export function VocabularySection() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const { userLanguageId } = useUserLanguage();

  // Fetch languages
  useEffect(() => {
    const fetchLanguages = async () => {
      const { data, error } = await supabase
        .from('languages')
        .select('id, name')
        .order('name');

      if (!error && data) {
        setLanguages(data);
      }
    };

    fetchLanguages();
  }, []);

  // Fetch vocabulary words from database
  useEffect(() => {
    const fetchVocabulary = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('vocabulary')
          .select('*')
          .order('word');

        // Filter by selected language or user's language
        const languageFilter = selectedLanguage ? 
          languages.find(lang => lang.name === selectedLanguage)?.id : 
          userLanguageId;
        
        if (languageFilter) {
          query = query.eq('language_id', languageFilter);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching vocabulary:', error);
          setWords([]);
        } else {
          // Transform database data to component format
          const transformedWords: VocabularyWord[] = (data || []).map(item => ({
            id: item.id,
            english: item.word,
            translated: item.definition || '',
            pronunciation: '', // Not available in current schema
            level: (item.difficulty_level as 'Beginner' | 'Intermediate' | 'Advanced') || 'Beginner',
            definition: item.definition || '',
            examples: item.example_sentence ? [item.example_sentence] : [],
            translatedExamples: [], // Not available in current schema
            domain: item.category || 'General'
          }));
          
          setWords(transformedWords);
        }
      } catch (error) {
        console.error('Error:', error);
        setWords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
  }, [userLanguageId, selectedLanguage, languages]);

  const filteredWords = words.filter(word => {
    const matchesSearch = word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         word.translated.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || word.level === selectedLevel;
    const matchesDomain = selectedDomain === 'all' || word.domain === selectedDomain;
    
    return matchesSearch && matchesLevel && matchesDomain;
  });

  const handleWordClick = (word: VocabularyWord) => {
    setSelectedWord(word);
    setIsDetailsOpen(true);
  };

  const playAudio = async (text: string, language: string = 'en') => {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'en' ? 'en-US' : language;
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpenCheck className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Vocabulary</h2>
            <p className="text-muted-foreground">Expand your vocabulary with domain-specific terms</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.id} value={lang.name}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedDomain} onValueChange={setSelectedDomain}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            <SelectItem value="Business">Business</SelectItem>
            <SelectItem value="Consumer Affairs">Consumer Affairs</SelectItem>
            <SelectItem value="Employment">Employment</SelectItem>
            <SelectItem value="Health">Health</SelectItem>
            <SelectItem value="Immigration/Settlement">Immigration/Settlement</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="Community">Community</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Financial">Financial</SelectItem>
            <SelectItem value="Housing">Housing</SelectItem>
            <SelectItem value="Insurance">Insurance</SelectItem>
            <SelectItem value="Social Services">Social Services</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>Clear Filters</span>
        </Button>
      </div>

      {/* Statistics */}
      <div className="w-full">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-muted-foreground">Day Streak</div>
            <div className="text-4xl font-bold text-primary">12</div>
          </div>
        </Card>
      </div>

      {/* Vocabulary Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-card-foreground">
            English ↔ {selectedLanguage} Vocabulary
          </h3>
        </div>
        
        <div className="divide-y divide-border">
          {filteredWords.map((word) => (
            <div
              key={word.id}
              onClick={() => handleWordClick(word)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              {/* English Column */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-card-foreground">{word.english}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(word.english, 'en');
                      }}
                      className="hover:bg-primary/10"
                    >
                      <Volume2 className="h-3 w-3 text-primary" />
                    </Button>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {word.level}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">/{word.pronunciation}/</p>
                <Badge variant="secondary" className="text-xs">
                  {word.domain}
                </Badge>
              </div>

              {/* Translated Column */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-card-foreground">{word.translated}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(word.translated, selectedLanguage.toLowerCase());
                    }}
                    className="hover:bg-primary/10"
                  >
                    <Volume2 className="h-3 w-3 text-primary" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {word.definition}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Learning Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Your Learning Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Words Mastered</span>
              <span className="font-medium text-card-foreground">245/500</span>
            </div>
            <Progress value={49} className="h-2 mb-4" />
            
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Daily Goal</span>
              <span className="font-medium text-card-foreground">8/10 words</span>
            </div>
            <Progress value={80} className="h-2" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Streak</span>
              <span className="font-bold text-primary">12 days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Best Streak</span>
              <span className="font-bold text-card-foreground">28 days</span>
            </div>
            <Button className="w-full" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Detailed Statistics
            </Button>
          </div>
        </div>
      </Card>

      {/* Vocabulary Details Modal */}
      <VocabularyDetails
        word={selectedWord}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        selectedLanguage={selectedLanguage}
      />
    </div>
  );
}