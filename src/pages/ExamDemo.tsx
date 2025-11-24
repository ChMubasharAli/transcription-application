import { ExamAudioFlow } from '../components/ExamAudioFlow';

const ExamDemo = () => {
  const handleResponseSaved = (audioBlob: Blob) => {
    console.log('Response saved in demo:', audioBlob);
    console.log('Audio file size:', audioBlob.size, 'bytes');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Exam Audio Flow Demo</h1>
        
        <ExamAudioFlow
          questionAudioUrl="/audio/sample.mp3"
          questionId="demo-question-1"
          onResponseSaved={handleResponseSaved}
          className="mb-8"
        />
        
        <div className="text-center text-muted-foreground mt-8">
          <p>This demonstrates the complete exam flow:</p>
          <p>Start → Play Question → Auto-Record → Live Mic Canvas → Finish → Save</p>
        </div>
      </div>
    </div>
  );
};

export default ExamDemo;