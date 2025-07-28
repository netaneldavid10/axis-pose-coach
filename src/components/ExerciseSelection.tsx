import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Dumbbell, Zap } from 'lucide-react';

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

const exercises: Exercise[] = [
  {
    name: 'Squats',
    category: 'Legs',
    difficulty: 'Beginner',
    description: 'Lower body compound movement targeting quads, glutes, and hamstrings',
    targetReps: 15
  },
  {
    name: 'Push-ups',
    category: 'Chest',
    difficulty: 'Beginner',
    description: 'Upper body exercise targeting chest, shoulders, and triceps',
    targetReps: 12
  },
  {
    name: 'Planks',
    category: 'Core',
    difficulty: 'Intermediate',
    description: 'Isometric core exercise for stability and strength',
    duration: 60
  },
  {
    name: 'Lunges',
    category: 'Legs',
    difficulty: 'Intermediate',
    description: 'Single-leg movement for balance and leg strength',
    targetReps: 10
  },
  {
    name: 'Burpees',
    category: 'Full Body',
    difficulty: 'Advanced',
    description: 'High-intensity full-body exercise combining squat, plank, and jump',
    targetReps: 8
  },
  {
    name: 'Mountain Climbers',
    category: 'Cardio',
    difficulty: 'Intermediate',
    description: 'Dynamic cardio exercise targeting core and cardiovascular system',
    duration: 45
  }
];

const categories = ['All', 'Legs', 'Chest', 'Core', 'Full Body', 'Cardio'];

export const ExerciseSelection: React.FC<ExerciseSelectionProps> = ({
  onExerciseSelect,
  onBack
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredExercises = selectedCategory === 'All' 
    ? exercises 
    : exercises.filter(exercise => exercise.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Legs': return <Target className="h-5 w-5" />;
      case 'Chest': return <Dumbbell className="h-5 w-5" />;
      case 'Core': return <Zap className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-center flex-1">
            Choose Exercise
          </h1>
          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? 'bg-gradient-to-r from-primary to-primary-dark' : ''}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <Card 
              key={exercise.name}
              className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary/20 bg-white/80 backdrop-blur-sm"
              onClick={() => onExerciseSelect(exercise.name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(exercise.category)}
                    <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  </div>
                  <Badge className={getDifficultyColor(exercise.difficulty)}>
                    {exercise.difficulty}
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
                    {exercise.targetReps ? `${exercise.targetReps} reps` : `${exercise.duration}s`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No exercises found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};