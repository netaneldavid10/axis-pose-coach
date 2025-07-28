import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Zap, Weight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface StatisticsPageProps {
  onBack: () => void;
}

export const StatisticsPage = ({ onBack }: StatisticsPageProps) => {
  const [timeRange, setTimeRange] = useState('week');
  const [workouts, setWorkouts] = useState([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalCalories: 0,
    averageAccuracy: 0,
    totalDuration: 0
  });

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  const loadStatistics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const { data: workoutData } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (workoutData) {
      setWorkouts(workoutData);
      
      const totalWorkouts = workoutData.length;
      const totalCalories = workoutData.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
      const totalDuration = workoutData.reduce((sum, w) => sum + (w.duration_seconds || 0), 0);
      const averageAccuracy = workoutData.length > 0 
        ? workoutData.reduce((sum, w) => sum + (w.average_form_accuracy || 0), 0) / workoutData.length
        : 0;

      setStats({
        totalWorkouts,
        totalCalories,
        averageAccuracy,
        totalDuration
      });
    }
  };

  const chartData = workouts.map((workout: any, index) => ({
    workout: `W${index + 1}`,
    accuracy: workout.average_form_accuracy || 0,
    calories: workout.calories_burned || 0,
    duration: Math.round((workout.duration_seconds || 0) / 60)
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Statistics Dashboard</h1>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
                  <p className="text-sm text-muted-foreground">Workouts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Zap className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalCalories}</p>
                  <p className="text-sm text-muted-foreground">Calories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{Math.round(stats.averageAccuracy)}%</p>
                  <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{Math.round(stats.totalDuration / 60)}</p>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Accuracy Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="workout" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calories Burned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="workout" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="calories" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};