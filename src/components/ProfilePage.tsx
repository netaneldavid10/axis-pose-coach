import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage = ({ onBack }: ProfilePageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    age: '',
    height: '',
    weight: '',
    country: '',
    workout_goal_type: '',
    workout_goal_value: '',
    workout_goal_period: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      toast({ title: "Error loading profile", variant: "destructive" });
      return;
    }

    if (data) {
      setProfile({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        age: data.age?.toString() || '',
        height: data.height?.toString() || '',
        weight: data.weight?.toString() || '',
        country: data.country || '',
        workout_goal_type: data.workout_goal_type || '',
        workout_goal_value: data.workout_goal_value?.toString() || '',
        workout_goal_period: data.workout_goal_period || ''
      });
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        age: parseInt(profile.age) || null,
        height: parseFloat(profile.height) || null,
        weight: parseFloat(profile.weight) || null,
        country: profile.country,
        workout_goal_type: profile.workout_goal_type,
        workout_goal_value: parseInt(profile.workout_goal_value) || null,
        workout_goal_period: profile.workout_goal_period
      })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: "Error updating profile", variant: "destructive" });
      return;
    }

    toast({ title: "Profile updated successfully" });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <Button
            variant="ghost"
            onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
            className="p-2"
          >
            {isEditing ? <X className="h-6 w-6" /> : <Edit2 className="h-6 w-6" />}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={profile.height}
                  onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={profile.weight}
                  onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-4">
              <Label>Workout Goal</Label>
              <div className="grid grid-cols-3 gap-4">
                <Select 
                  value={profile.workout_goal_type} 
                  onValueChange={(value) => setProfile({ ...profile, workout_goal_type: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Goal Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workouts">Workouts</SelectItem>
                    <SelectItem value="calories">Calories</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  type="number"
                  placeholder="Target"
                  value={profile.workout_goal_value}
                  onChange={(e) => setProfile({ ...profile, workout_goal_value: e.target.value })}
                  disabled={!isEditing}
                />
                
                <Select 
                  value={profile.workout_goal_period} 
                  onValueChange={(value) => setProfile({ ...profile, workout_goal_period: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Per Week</SelectItem>
                    <SelectItem value="month">Per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isEditing && (
              <Button onClick={handleSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};