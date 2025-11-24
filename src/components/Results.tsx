import { DialogueResult, PerSegmentResult } from '../types';
import { scoreDialogue, generateFeedback } from '../scoring';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface DialogueResultsProps {
  dialogueId: string;
  dialogueTitle: string;
  perSegmentResults: PerSegmentResult[];
  repeatCount: number;
  onProceed: () => void;
  isLastDialogue: boolean;
}

interface FinalResultsProps {
  dialogue1Result: DialogueResult;
  dialogue2Result: DialogueResult;
  onRetryDialogue1: () => void;
  onRetryDialogue2: () => void;
  onRetryFullExam: () => void;
  onDownloadReport: () => void;
}

export function DialogueResults({ 
  dialogueId,
  dialogueTitle,
  perSegmentResults, 
  repeatCount,
  onProceed,
  isLastDialogue 
}: DialogueResultsProps) {
  const totals = scoreDialogue(perSegmentResults, repeatCount);
  const feedback = generateFeedback(totals);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-card-foreground">
          Dialogue Complete: {dialogueTitle}
        </CardTitle>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-3 py-1">
            Score: {totals.scoreOutOf45} / 45
          </Badge>
          <Badge variant={totals.scoreOutOf45 >= 29 ? "default" : "destructive"}>
            {totals.scoreOutOf45 >= 29 ? "Pass" : "Fail"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Results Table */}
        <div>
          <h3 className="font-medium mb-3 text-foreground">Detailed Results</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Your Transcript</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perSegmentResults.map((result, index) => {
                const totalDeductions = Object.values(result.deductions).reduce((sum, val) => sum + val, 0);
                return (
                  <TableRow key={result.segmentId}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="max-w-xs truncate" title={result.segmentId}>
                      Segment {index + 1}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {result.studentTranscript}
                    </TableCell>
                    <TableCell>
                      <Badge variant={totalDeductions === 0 ? "default" : "outline"}>
                        -{totalDeductions}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {result.notes || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Feedback */}
        {feedback.length > 0 && (
          <div>
            <h3 className="font-medium mb-3 text-foreground">Feedback</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {feedback.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-border">
          <Button onClick={onProceed} size="lg" className="w-full">
            {isLastDialogue ? 'View Final Results' : 'Proceed to Dialogue 2'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinalResults({ 
  dialogue1Result,
  dialogue2Result,
  onRetryDialogue1,
  onRetryDialogue2, 
  onRetryFullExam,
  onDownloadReport
}: FinalResultsProps) {
  const totalScore = dialogue1Result.totals.scoreOutOf45 + dialogue2Result.totals.scoreOutOf45;
  const dialogue1Pass = dialogue1Result.totals.scoreOutOf45 >= 29;
  const dialogue2Pass = dialogue2Result.totals.scoreOutOf45 >= 29;
  const overallPass = totalScore >= 63 && dialogue1Pass && dialogue2Pass;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-card-foreground">CCL Practice Exam - Final Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h3 className="font-medium text-muted-foreground">Dialogue 1</h3>
              <div className="text-2xl font-bold text-foreground">{dialogue1Result.totals.scoreOutOf45}</div>
              <div className="text-sm text-muted-foreground">/ 45</div>
              <Badge variant={dialogue1Pass ? "default" : "destructive"} className="mt-1">
                {dialogue1Pass ? "Pass" : "Fail"}
              </Badge>
            </div>
            
            <div className="text-center">
              <h3 className="font-medium text-muted-foreground">Dialogue 2</h3>
              <div className="text-2xl font-bold text-foreground">{dialogue2Result.totals.scoreOutOf45}</div>
              <div className="text-sm text-muted-foreground">/ 45</div>
              <Badge variant={dialogue2Pass ? "default" : "destructive"} className="mt-1">
                {dialogue2Pass ? "Pass" : "Fail"}
              </Badge>
            </div>

            <div className="text-center">
              <h3 className="font-medium text-muted-foreground">Total Score</h3>
              <div className="text-3xl font-bold text-foreground">{totalScore}</div>
              <div className="text-sm text-muted-foreground">/ 90</div>
              <Badge variant={overallPass ? "default" : "destructive"} className="mt-1 text-sm">
                {overallPass ? "PASS" : "FAIL"}
              </Badge>
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Pass criteria: Total ≥ 63 AND each dialogue ≥ 29
            </p>
            <p className="font-medium text-foreground">
              Result: {overallPass ? "Congratulations! You passed the CCL practice exam." : "You did not meet the pass criteria. Keep practicing!"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Retry Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={onRetryDialogue1} variant="outline" className="w-full">
              Retry Dialogue 1
            </Button>
            <Button onClick={onRetryDialogue2} variant="outline" className="w-full">
              Retry Dialogue 2
            </Button>
            <Button onClick={onRetryFullExam} variant="default" className="w-full">
              Retry Full Exam
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Export Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={onDownloadReport} variant="outline" className="w-full">
              Download Report (PDF)
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Opens browser print dialog for PDF generation
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}