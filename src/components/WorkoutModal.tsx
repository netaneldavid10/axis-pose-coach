import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Target, List } from 'lucide-react';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSingleExercise: () => void;
  onWorkoutRoutine: () => void;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  onClose,
  onSingleExercise,
  onWorkoutRoutine
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Choose Workout Type
          </DialogTitle>
          <DialogDescription className="text-center">
            How would you like to train today?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card 
            className="p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
            onClick={onSingleExercise}
          >
            <CardContent className="p-0 text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Single Exercise</h3>
              <p className="text-sm text-muted-foreground">
                Focus on one exercise with AI form tracking
              </p>
            </CardContent>
          </Card>

          <Card 
            className="p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
            onClick={onWorkoutRoutine}
          >
            <CardContent className="p-0 text-center">
              <List className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Workout Routine</h3>
              <p className="text-sm text-muted-foreground">
                Complete a sequence of exercises
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};