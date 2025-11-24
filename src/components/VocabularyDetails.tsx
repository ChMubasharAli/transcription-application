import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Volume2, X, BookOpen } from 'lucide-react';

interface VocabularyWord {
  id: string;
  english: string;
  translated: string;
  pronunciation: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  definition: string;
  examples: string[];
  translatedExamples: string[];
}

interface VocabularyDetailsProps {
  word: VocabularyWord | null;
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: string;
}

export function VocabularyDetails({ word, isOpen, onClose, selectedLanguage }: VocabularyDetailsProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = async (text: string, language: string = 'en') => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      // Using Web Speech API as a fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'en' ? 'en-US' : language;
        utterance.rate = 0.8;
        utterance.onend = () => setIsPlaying(false);
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsPlaying(false);
    }
  };

  if (!word) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold text-primary">{word.english}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Word Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-card-foreground">English</h3>
                  <Badge variant="outline">{word.level}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary">{word.english}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playAudio(word.english, 'en')}
                      disabled={isPlaying}
                      className="hover:bg-primary/10"
                    >
                      <Volume2 className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">/{word.pronunciation}/</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-card-foreground">{selectedLanguage}</h3>
                  <Badge variant="secondary">Translation</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary">{word.translated}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playAudio(word.translated, selectedLanguage.toLowerCase())}
                      disabled={isPlaying}
                      className="hover:bg-primary/10"
                    >
                      <Volume2 className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Definition */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-3">Definition</h3>
            <p className="text-muted-foreground leading-relaxed">{word.definition}</p>
          </Card>

          {/* Examples */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">English Examples</h3>
              <div className="space-y-4">
                {word.examples.map((example, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-card-foreground flex-1">{example}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(example, 'en')}
                        disabled={isPlaying}
                        className="ml-2 hover:bg-primary/10"
                      >
                        <Volume2 className="h-3 w-3 text-primary" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">{selectedLanguage} Examples</h3>
              <div className="space-y-4">
                {word.translatedExamples.map((example, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-card-foreground flex-1">{example}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(example, selectedLanguage.toLowerCase())}
                        disabled={isPlaying}
                        className="ml-2 hover:bg-primary/10"
                      >
                        <Volume2 className="h-3 w-3 text-primary" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => playAudio(word.english + '. ' + word.definition, 'en')}
              disabled={isPlaying}
              className="bg-gradient-primary hover:shadow-glow"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Play Full Definition
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}