import React from 'react';
import { 
  SquatsTracker, 
  PushUpsTracker, 
  PlanksTracker, 
  LungesTracker, 
  BurpeesTracker, 
  MountainClimbersTracker 
} from './exercises';

interface ExerciseTrackerProps {
  exerciseName: string;
  onExerciseComplete: (data: ExerciseData) => void;
  onBack: () => void;
}

export interface ExerciseData {
  reps: number;
  duration: number;
  formAccuracy: number;
  feedback: string[];
}

export const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({
  exerciseName,
  onExerciseComplete,
  onBack
}) => {
  // Route to the correct exercise component based on exercise name
  switch (exerciseName.toLowerCase()) {
    case 'squats':
      return <SquatsTracker onExerciseComplete={onExerciseComplete} onBack={onBack} />;
    case 'push-ups':
      return <PushUpsTracker onExerciseComplete={onExerciseComplete} onBack={onBack} />;
    case 'planks':
      return <PlanksTracker onExerciseComplete={onExerciseComplete} onBack={onBack} />;
    case 'lunges':
      return <LungesTracker onExerciseComplete={onExerciseComplete} onBack={onBack} />;
    case 'burpees':
      return <BurpeesTracker onExerciseComplete={onExerciseComplete} onBack={onBack} />;
    case 'mountain climbers':
      return <MountainClimbersTracker onExerciseComplete={onExerciseComplete} onBack={onBack} />;
    default:
      return <SquatsTracker onExerciseComplete={onExerciseComplete} onBack={onBack} />;
  }
};