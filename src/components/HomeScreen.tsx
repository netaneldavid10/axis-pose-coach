import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Menu, User, BarChart3, Settings, MessageSquare, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import axisLogo from '@/assets/axis-logo.png';

interface Profile {
  first_name: string;
  workout_goal_type: string;
  workout_goal_value: number;
  workout_goal_period: string;
}

interface HomeScreenProps {
  onStartWorkout: () => void;
  onShowProfile: () => void;
  onShowStats: () => void;
  onShowCoach: () => void;
  onShowSettings: () => void;
  onSignOut: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onStartWorkout, 
  onShowProfile, 
  onShowStats, 
  onShowCoach,
  onShowSettings,
  onSignOut 
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
    loadProgress();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, workout_goal_type, workout_goal_value, workout_goal_period')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date range based on goal period
      const now = new Date();
      const startDate = new Date();
      
      if (profile?.workout_goal_period === 'week') {
        startDate.setDate(now.getDate() - now.getDay()); // Start of current week
      } else {
        startDate.setDate(1); // Start of current month
      }

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      if (error) throw error;

      if (profile?.workout_goal_type === 'workouts') {
        setCurrentProgress(data?.length || 0);
      } else {
        const totalCalories = data?.reduce((sum, workout) => sum + (workout.calories_burned || 0), 0) || 0;
        setCurrentProgress(totalCalories);
      }
    } catch (error: any) {
      toast({
        title: "Error loading progress",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!profile?.workout_goal_value) return 0;
    return Math.min((currentProgress / profile.workout_goal_value) * 100, 100);
  };

  const getMotivationalText = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return "Goal achieved! 🎉";
    if (percentage >= 75) return "Almost there! Keep pushing!";
    if (percentage >= 50) return "Great progress! Keep it up!";
    if (percentage >= 25) return "You're on the right track!";
    return "Let's get started!";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={onShowProfile}>
              <User className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowStats}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Statistics Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowCoach}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Personal Coach
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          Axis
        </h1>

        <div className="w-10" /> {/* Spacer for alignment */}
      </header>

      {/* Main Content */}
      <main className="px-4 pb-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Welcome back, {profile?.first_name || 'User'}!
          </h2>
          <p className="text-muted-foreground">
            Ready to crush your fitness goals today?
          </p>
        </div>

        {/* Progress Circle */}
        <div className="flex justify-center mb-8">
          <Card className="p-6 bg-white/50 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardContent className="p-0">
              <CircularProgress
                value={currentProgress}
                max={profile?.workout_goal_value || 100}
                size={200}
                strokeWidth={12}
              >
                <div className="text-center">
                  <img 
                    src={axisLogo} 
                    alt="Axis Logo" 
                    className="w-16 h-16 mx-auto mb-2 opacity-80"
                  />
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(getProgressPercentage())}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentProgress} / {profile?.workout_goal_value || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {profile?.workout_goal_type === 'workouts' ? 'workouts' : 'calories'} this {profile?.workout_goal_period}
                  </div>
                </div>
              </CircularProgress>
            </CardContent>
          </Card>
        </div>

        {/* Motivational Text */}
        <div className="text-center mb-8">
          <p className="text-lg font-medium text-foreground">
            {getMotivationalText()}
          </p>
        </div>

        {/* Start Workout Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={onStartWorkout}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <Play className="h-6 w-6 mr-3" />
            Start Workout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Card className="p-4 bg-white/30 backdrop-blur-sm border border-white/20">
            <CardContent className="p-0 text-center">
              <div className="text-2xl font-bold text-primary">
                {profile?.workout_goal_period === 'week' ? '7' : '30'}
              </div>
              <div className="text-sm text-muted-foreground">Days left</div>
            </CardContent>
          </Card>
          <Card className="p-4 bg-white/30 backdrop-blur-sm border border-white/20">
            <CardContent className="p-0 text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.max(0, (profile?.workout_goal_value || 0) - currentProgress)}
              </div>
              <div className="text-sm text-muted-foreground">
                {profile?.workout_goal_type === 'workouts' ? 'Workouts' : 'Calories'} to go
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};