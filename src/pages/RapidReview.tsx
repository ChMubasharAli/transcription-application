import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ExamResult {
  id: string;
  user_id: string;
  dialogue_id: string;
  segment_count: number;
  average_accuracy_score: number;
  average_language_quality_score: number;
  average_fluency_pronunciation_score: number;
  average_delivery_coherence_score: number;
  average_cultural_context_score: number;
  average_response_management_score: number;
  average_final_score: number;
  total_final_score: number;
  overall_feedback: string;
  answer_ids: string[] | null;
  created_at: string;
}

interface UserExamResultsResponse {
  success: boolean;
  user_id: string;
  results: ExamResult[];
}

export default function RapidReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUserExamResults();
    }
  }, [user]);

  const fetchUserExamResults = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "get-user-exam-results",
        {
          body: {
            userId: user.id,
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setExamResults(data.results || []);
        console.log("Fetched user exam results:", data.results);
      } else {
        throw new Error("Failed to fetch user exam results");
      }
    } catch (error) {
      console.error("Error fetching user exam results:", error);
      toast({
        title: "Error",
        description: "Failed to load your exam history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const goToNextResult = () => {
    if (currentPage < examResults.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousResult = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center bg-cyan-50 rounded-lg border border-cyan-200">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-cyan-800 font-medium">
            Loading your exam results...
          </p>
        </div>
      </div>
    );
  }

  if (examResults.length === 0) {
    return (
      <div className="min-h-96 flex items-center justify-center bg-cyan-50 rounded-lg border border-cyan-200">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto">
            <Star className="h-8 w-8 text-cyan-600" />
          </div>
          <h3 className="text-xl font-bold text-cyan-900">
            No Exam Results Yet
          </h3>
          <p className="text-cyan-700 max-w-md">
            You haven't completed any practice exams yet. Start practicing to
            see your results here!
          </p>
        </div>
      </div>
    );
  }

  const currentResult = examResults[currentPage];

  return (
    <div className="min-h-96 bg-white rounded-lg border border-cyan-200 shadow-sm">
      {/* Header */}
      <div className="bg-cyan-50 px-6 py-4 border-b border-cyan-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-cyan-900">Rapid Review</h2>
            <p className="text-cyan-700">Your exam results and progress</p>
          </div>
          <Badge
            variant="outline"
            className="bg-white text-cyan-700 border-cyan-300"
          >
            {currentPage + 1} of {examResults.length} Results
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Card className="border-cyan-200 shadow-sm">
          <CardHeader className="bg-cyan-50 border-b border-cyan-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-cyan-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Attempt {examResults.length - currentPage}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-white text-cyan-700 border-cyan-300"
                >
                  {currentResult.segment_count} segment
                  {currentResult.segment_count !== 1 ? "s" : ""}
                </Badge>
                <div className="text-sm text-cyan-600">
                  {formatDate(currentResult.created_at)}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Total Score */}
            <div className="text-center">
              <div
                className={`text-5xl font-bold ${getScoreColor(
                  currentResult.total_final_score
                )} mb-2`}
              >
                {currentResult.total_final_score}
              </div>
              <Badge
                variant={getScoreBadgeVariant(currentResult.total_final_score)}
                className="text-lg"
              >
                Total Score
              </Badge>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="text-2xl font-bold text-cyan-700">
                  {currentResult.average_accuracy_score.toFixed(1)}
                </div>
                <div className="text-sm text-cyan-600 font-medium">
                  Accuracy
                </div>
              </div>

              <div className="text-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="text-2xl font-bold text-cyan-700">
                  {currentResult.average_language_quality_score.toFixed(1)}
                </div>
                <div className="text-sm text-cyan-600 font-medium">
                  Language Quality
                </div>
              </div>

              <div className="text-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="text-2xl font-bold text-cyan-700">
                  {currentResult.average_fluency_pronunciation_score.toFixed(1)}
                </div>
                <div className="text-sm text-cyan-600 font-medium">
                  Fluency & Pronunciation
                </div>
              </div>

              <div className="text-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="text-2xl font-bold text-cyan-700">
                  {currentResult.average_delivery_coherence_score.toFixed(1)}
                </div>
                <div className="text-sm text-cyan-600 font-medium">
                  Delivery & Coherence
                </div>
              </div>

              <div className="text-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="text-2xl font-bold text-cyan-700">
                  {currentResult.average_cultural_context_score.toFixed(1)}
                </div>
                <div className="text-sm text-cyan-600 font-medium">
                  Cultural Context
                </div>
              </div>

              <div className="text-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="text-2xl font-bold text-cyan-700">
                  {currentResult.average_response_management_score.toFixed(1)}
                </div>
                <div className="text-sm text-cyan-600 font-medium">
                  Response Management
                </div>
              </div>
            </div>

            {/* Overall Feedback */}
            <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <h4 className="font-semibold text-cyan-900 mb-2">
                Overall Feedback
              </h4>
              <p className="text-cyan-800 leading-relaxed">
                {currentResult.overall_feedback}
              </p>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-cyan-200">
              <Button
                onClick={goToPreviousResult}
                disabled={currentPage === 0}
                variant="outline"
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {examResults.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentPage ? "bg-cyan-600" : "bg-cyan-300"
                    }`}
                    aria-label={`Go to result ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                onClick={goToNextResult}
                disabled={currentPage === examResults.length - 1}
                variant="outline"
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
