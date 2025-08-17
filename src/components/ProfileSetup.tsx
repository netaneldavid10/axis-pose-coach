import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Target, Calendar } from 'lucide-react';

interface ProfileSetupProps {
  onSetupComplete: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    height: '',
    weight: '',
    country: '',
    workoutGoalType: '',
    workoutGoalValue: '',
    workoutGoalPeriod: ''
  });
  const { toast } = useToast();

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          age: parseInt(formData.age),
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          country: formData.country,
          workout_goal_type: formData.workoutGoalType,
          workout_goal_value: parseInt(formData.workoutGoalValue),
          workout_goal_period: formData.workoutGoalPeriod
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile setup complete!",
        description: "Welcome to Axis. Let's start your fitness journey!",
      });

      onSetupComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
    'France', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 
    'Denmark', 'Finland', 'Japan', 'South Korea', 'Singapore', 'Other'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            Step {step} of 3 - Help us personalize your experience
          </CardDescription>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                } transition-colors duration-300`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                <p className="text-muted-foreground text-sm">Tell us about yourself</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="13"
                  max="100"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => setFormData({...formData, country: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Physical Details</h3>
                <p className="text-muted-foreground text-sm">Help us track your progress</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="100"
                    max="250"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="30"
                    max="300"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your Fitness Goal</h3>
                <p className="text-muted-foreground text-sm">What would you like to achieve?</p>
              </div>

              <div className="space-y-4">
                <Label>Goal Type</Label>
                <RadioGroup 
                  value={formData.workoutGoalType}
                  onValueChange={(value) => setFormData({...formData, workoutGoalType: value})}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="workouts" id="workouts" />
                    <Label htmlFor="workouts">Number of Workouts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="calories" id="calories" />
                    <Label htmlFor="calories">Calories Burned</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goalValue">
                    Target {formData.workoutGoalType === 'workouts' ? 'Workouts' : 'Calories'}
                  </Label>
                  <Input
                    id="goalValue"
                    type="number"
                    min="1"
                    value={formData.workoutGoalValue}
                    onChange={(e) => setFormData({...formData, workoutGoalValue: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalPeriod">Period</Label>
                  <Select 
                    value={formData.workoutGoalPeriod}
                    onValueChange={(value) => setFormData({...formData, workoutGoalPeriod: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Per Week</SelectItem>
                      <SelectItem value="month">Per Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
            )}
            
            {step < 3 ? (
              <Button onClick={handleNext} className="flex-1 bg-gradient-to-r from-primary to-primary-dark">
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="flex-1 bg-gradient-to-r from-primary to-primary-dark"
                disabled={isLoading}
              >
                {isLoading ? "Completing..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};