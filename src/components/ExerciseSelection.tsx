import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Dumbbell, Zap } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

interface Exercise {
  name: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  targetReps?: number;
  duration?: number;
}

interface ExerciseSelectionProps {
  onExerciseSelect: (exercise: string) => void;
  onBack: () => void;
}

export const ExerciseSelection: React.FC<ExerciseSelectionProps> = ({
  onExerciseSelect,
  onBack
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState(t.exercises.all);

  const exercises: Exercise[] = [
    {
      name: 'Squats',
      category: t.exercises.legs,
      difficulty: 'Beginner',
      description: t.exercises.squatsDesc,
      targetReps: 15
    },
    {
      name: 'Push-ups',
      category: t.exercises.chest,
      difficulty: 'Beginner',
      description: t.exercises.pushupsDesc,
      targetReps: 12
    },
    {
      name: 'Planks',
      category: t.exercises.core,
      difficulty: 'Intermediate',
      description: t.exercises.planksDesc,
      duration: 60
    },
    {
      name: 'Lunges',
      category: t.exercises.legs,
      difficulty: 'Intermediate',
      description: t.exercises.lungesDesc,
      targetReps: 10
    },
    {
      name: 'Burpees',
      category: t.exercises.fullBody,
      difficulty: 'Advanced',
      description: t.exercises.burpeesDesc,
      targetReps: 8
    },
    {
      name: 'Mountain Climbers',
      category: t.exercises.cardio,
      difficulty: 'Intermediate',
      description: t.exercises.mountainClimbersDesc,
      duration: 45
    }
  ];

  const categories = [t.exercises.all, t.exercises.legs, t.exercises.chest, t.exercises.core, t.exercises.fullBody, t.exercises.cardio];

  const filteredExercises = selectedCategory === t.exercises.all 
    ? exercises 
    : exercises.filter(exercise => exercise.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return t.exercises.beginner;
      case 'Intermediate': return t.exercises.intermediate;
      case 'Advanced': return t.exercises.advanced;
      default: return difficulty;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case t.exercises.legs: return <Target className="h-5 w-5" />;
      case t.exercises.chest: return <Dumbbell className="h-5 w-5" />;
      case t.exercises.core: return <Zap className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 p-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack} className="hover-scale">
            ← {t.exercises.back}
          </Button>
          <h1 className="text-2xl font-bold text-center flex-1 animate-scale-in">
            {t.exercises.chooseExercise}
          </h1>
          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center animate-fade-in animate-delay-100">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`hover-scale ${selectedCategory === category ? 'bg-gradient-to-r from-primary to-primary-dark' : ''}`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in animate-delay-200">
          {filteredExercises.map((exercise, index) => (
            <Card 
              key={exercise.name}
              className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary/20 bg-card backdrop-blur-sm hover-scale"
              onClick={() => onExerciseSelect(exercise.name)}
              style={{ animationDelay: `${300 + index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(exercise.category)}
                    <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  </div>
                  <Badge className={getDifficultyColor(exercise.difficulty)}>
                    {getDifficultyText(exercise.difficulty)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {exercise.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-primary">
                    {exercise.category}
                  </span>
                  <span className="text-muted-foreground">
                    {exercise.targetReps ? `${exercise.targetReps} ${t.exercises.reps}` : `${exercise.duration}s`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">{t.exercises.noExercises}</p>
          </div>
        )}
      </div>
    </div>
  );
};