import { topics } from '../data';
import { Topic, Dialogue } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface TopicListProps {
  selectedTopic: Topic | null;
  selectedDialogue: Dialogue | null;
  onTopicSelect: (topic: Topic) => void;
  onDialogueSelect: (dialogue: Dialogue) => void;
  isExamInProgress: boolean;
}

export function TopicList({ 
  selectedTopic, 
  selectedDialogue, 
  onTopicSelect, 
  onDialogueSelect,
  isExamInProgress 
}: TopicListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">CCL Practice Topics</h2>
      
      {topics.map(topic => (
        <Card key={topic.id} className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-card-foreground">{topic.title}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {topic.difficulty}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Language: {topic.language} • {topic.dialogues.length} dialogues
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {topic.dialogues.map(dialogue => (
                <Button
                  key={dialogue.id}
                  variant={selectedDialogue?.id === dialogue.id ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => {
                    onTopicSelect(topic);
                    onDialogueSelect(dialogue);
                  }}
                  disabled={isExamInProgress}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{dialogue.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {dialogue.segments.length} segments
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}