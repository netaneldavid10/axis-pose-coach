import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/lib/language-context';

interface StatisticsPageProps {
  onBack: () => void;
}

export const StatisticsPage = ({ onBack }: StatisticsPageProps) => {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState('month');
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalPushups: 0,
    averageAccuracy: 0
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

    const { data: workoutData, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error("❌ Error fetching stats:", error);
      return;
    }

    if (workoutData) {
      setWorkouts(workoutData);

      const totalWorkouts = workoutData.length;
      const totalPushups = workoutData.reduce((sum, w) => sum + (w.total_reps || 0), 0);
      const averageAccuracy = workoutData.length > 0 
        ? workoutData.reduce((sum, w) => sum + (w.average_form_accuracy || 0), 0) / workoutData.length
        : 0;

      setStats({
        totalWorkouts,
        totalPushups,
        averageAccuracy
      });
    }
  };

  const chartData = workouts.map((workout: any, index) => ({
    workout: `W${index + 1}`,
    accuracy: workout.average_form_accuracy || 0,
    pushups: workout.total_reps || 0,
    date: new Date(workout.created_at).toLocaleDateString()
  }));

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack} className="p-2 hover-scale">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold animate-scale-in">{t.statistics.title}</h1>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t.statistics.week}</SelectItem>
              <SelectItem value="month">{t.statistics.month}</SelectItem>
              <SelectItem value="year">{t.statistics.year}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover-scale transition-all duration-300 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
                  <p className="text-sm text-muted-foreground">{t.statistics.workouts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale transition-all duration-300 animate-fade-in animate-delay-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Zap className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalPushups}</p>
                  <p className="text-sm text-muted-foreground">{t.statistics.pushups}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale transition-all duration-300 animate-fade-in animate-delay-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{Math.round(stats.averageAccuracy)}%</p>
                  <p className="text-sm text-muted-foreground">{t.statistics.avgAccuracy}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover-scale transition-all duration-300 animate-fade-in animate-delay-300">
            <CardHeader>
              <CardTitle>{t.statistics.formAccuracy}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
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

          <Card className="hover-scale transition-all duration-300 animate-fade-in animate-delay-300">
            <CardHeader>
              <CardTitle>{t.statistics.pushupsCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="pushups" fill="hsl(var(--primary))" />
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
