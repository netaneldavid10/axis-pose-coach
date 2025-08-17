import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthForm } from '@/components/AuthForm';
import { ProfileSetup } from '@/components/ProfileSetup';
import { HomeScreen } from '@/components/HomeScreen';
import { WorkoutModal } from '@/components/WorkoutModal';
import { ExerciseSelection } from '@/components/ExerciseSelection';
import { ExerciseTracker } from '@/components/ExerciseTracker';
import { WorkoutSummary } from '@/components/WorkoutSummary';
import { ProfilePage } from '@/components/ProfilePage';
import { StatisticsPage } from '@/components/StatisticsPage';
import { PersonalCoachPage } from '@/components/PersonalCoachPage';
import { SettingsPage } from '@/components/SettingsPage';

type AppState = 'auth' | 'setup' | 'home' | 'workout-modal' | 'exercise-selection' | 'exercise-tracker' | 'workout-summary' | 'profile' | 'statistics' | 'coach' | 'settings';

interface ExerciseData {
  name: string;
  reps: number;
  duration: number;
  formAccuracy: number;
  feedback: string[];
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>('auth');
  const [user, setUser] = useState<any>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [completedExercises, setCompletedExercises] = useState<ExerciseData[]>([]);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (session.user.email_confirmed_at) {
          checkProfileStatus(session.user.id);
        } else {
          setAppState('auth');
        }
      } else {
        setUser(null);
        setAppState('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      if (session.user.email_confirmed_at) {
        await checkProfileStatus(session.user.id);
      } else {
        setAppState('auth');
      }
    }
  };

  const checkProfileStatus = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (data?.age && data?.height && data?.weight) {
      setProfileComplete(true);
      setAppState('home');
    } else {
      setAppState('setup');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAppState('auth');
  };

  const handleExerciseComplete = (exerciseData: ExerciseData) => {
    const newExercise = { ...exerciseData, name: selectedExercise };
    setCompletedExercises([newExercise]);
    setAppState('workout-summary');
  };

  const calculateWorkoutStats = () => {
    const totalDuration = completedExercises.reduce((sum, ex) => sum + ex.duration, 0);
    const caloriesBurned = Math.round(totalDuration * 0.15); // Rough estimate
    const averageFormAccuracy = completedExercises.reduce((sum, ex) => sum + ex.formAccuracy, 0) / completedExercises.length;
    
    return { totalDuration, caloriesBurned, averageFormAccuracy };
  };

  if (appState === 'auth') {
    return <AuthForm onAuthSuccess={() => setAppState('setup')} />;
  }

  if (appState === 'setup') {
    return <ProfileSetup onSetupComplete={() => setAppState('home')} />;
  }

  if (appState === 'home') {
    return (
      <HomeScreen 
        onStartWorkout={() => setAppState('workout-modal')}
        onShowProfile={() => setAppState('profile')}
        onShowStats={() => setAppState('statistics')}
        onShowCoach={() => setAppState('coach')}
        onShowSettings={() => setAppState('settings')}
        onSignOut={handleSignOut}
      />
    );
  }

  if (appState === 'workout-modal') {
    return (
      <WorkoutModal
        isOpen={true}
        onClose={() => setAppState('home')}
        onSingleExercise={() => setAppState('exercise-selection')}
        onWorkoutRoutine={() => setAppState('exercise-selection')}
      />
    );
  }

  if (appState === 'exercise-selection') {
    return (
      <ExerciseSelection
        onExerciseSelect={(exercise) => {
          setSelectedExercise(exercise);
          setAppState('exercise-tracker');
        }}
        onBack={() => setAppState('home')}
      />
    );
  }

  if (appState === 'exercise-tracker') {
    return (
      <ExerciseTracker
        exerciseName={selectedExercise}
        onExerciseComplete={handleExerciseComplete}
        onBack={() => setAppState('exercise-selection')}
      />
    );
  }

  if (appState === 'workout-summary') {
    const stats = calculateWorkoutStats();
    return (
      <WorkoutSummary
        exercises={completedExercises}
        {...stats}
        onFinish={() => setAppState('home')}
      />
    );
  }

  if (appState === 'profile') {
    return <ProfilePage onBack={() => setAppState('home')} />;
  }

  if (appState === 'statistics') {
    return <StatisticsPage onBack={() => setAppState('home')} />;
  }

  if (appState === 'coach') {
    return <PersonalCoachPage onBack={() => setAppState('home')} />;
  }

  if (appState === 'settings') {
    return (
      <SettingsPage 
        onBack={() => setAppState('home')} 
        onSignOut={handleSignOut}
      />
    );
  }

  return null;
};

export default Index;
