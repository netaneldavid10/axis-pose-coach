import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Zap, Target, TrendingUp } from 'lucide-react';

interface ExerciseData {
  name: string;
  reps: number;
  duration: number;
  formAccuracy: number;
  feedback: string[];
}

interface WorkoutSummaryProps {
  exercises: ExerciseData[];
  totalDuration: number;
  caloriesBurned: number;
  averageFormAccuracy: number;
  onFinish: () => void;
}

export const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
  exercises,
  totalDuration,
  caloriesBurned,
  averageFormAccuracy,
  onFinish
}) => {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 90) return 'bg-green-100 text-green-800';
    if (accuracy >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMotivationalMessage = () => {
    if (averageFormAccuracy >= 90) {
      return "Exceptional form! You're crushing it! 🔥";
    } else if (averageFormAccuracy >= 80) {
      return "Great workout! Keep up the excellent work! 💪";
    } else if (averageFormAccuracy >= 70) {
      return "Good effort! Focus on form for even better results! 👍";
    } else {
      return "Nice work! Practice makes perfect! 🎯";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full">
              <Trophy className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Workout Complete!
          </h1>
          <p className="text-lg text-muted-foreground">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Overall Stats */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Workout Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatDuration(totalDuration)}
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {caloriesBurned}
                </div>
                <div className="text-sm text-muted-foreground">Calories</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className={`text-2xl font-bold ${getAccuracyColor(averageFormAccuracy)}`}>
                  {Math.round(averageFormAccuracy)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Form</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {exercises.length}
                </div>
                <div className="text-sm text-muted-foreground">Exercises</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Breakdown */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Exercise Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{exercise.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{exercise.reps} reps</span>
                      <span>{formatDuration(exercise.duration)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getAccuracyBadge(exercise.formAccuracy)}>
                      {Math.round(exercise.formAccuracy)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Form Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exercises.flatMap(ex => ex.feedback).slice(0, 5).map((feedback, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{feedback}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={onFinish}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};