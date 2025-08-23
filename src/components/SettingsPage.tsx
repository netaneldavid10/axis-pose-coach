import React, { useState, useEffect } from 'react';
import { ArrowLeft, Moon, Sun, Volume2, Languages, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getTranslation } from '@/lib/translations';

interface SettingsPageProps {
  onBack: () => void;
  onSignOut: () => void;
}

export const SettingsPage = ({ onBack, onSignOut }: SettingsPageProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [volume, setVolume] = useState([70]);
  const { toast } = useToast();
  
  const t = getTranslation(language);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedVolume = parseInt(localStorage.getItem('volume') || '70');

    setDarkMode(savedDarkMode);
    setLanguage(savedLanguage);
    setVolume([savedVolume]);

    // Apply dark mode
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('darkMode', enabled.toString());
    
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast({ title: `${enabled ? 'Dark' : 'Light'} mode enabled` });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // Apply RTL for Hebrew
    if (newLanguage === 'he') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.classList.remove('rtl');
    }
    
    toast({ title: `Language changed to ${newLanguage === 'en' ? 'English' : 'Hebrew'}` });
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    localStorage.setItem('volume', newVolume[0].toString());
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
    toast({ title: "Signed out successfully" });
  };

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack} className="p-2 hover-scale">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold animate-scale-in">{t.settings.title}</h1>
          <div></div>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <Card className="hover-scale transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                {t.settings.appearance}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <Label htmlFor="dark-mode">{t.settings.darkMode}</Label>
                    <p className="text-sm text-muted-foreground">{t.settings.darkModeDesc}</p>
                  </div>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={handleDarkModeToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card className="hover-scale transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                {t.settings.languageRegion}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <Label>{t.settings.language}</Label>
                    <p className="text-sm text-muted-foreground">{t.settings.languageDesc}</p>
                  </div>
                </div>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="he">עברית</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audio */}
          <Card className="hover-scale transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                {t.settings.audio}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div>
                    <Label>{t.settings.voiceVolume}</Label>
                    <p className="text-sm text-muted-foreground">{t.settings.voiceVolumeDesc}</p>
                  </div>
                </div>
                <div className="px-3">
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>{volume[0]}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account */}
          <Card className="hover-scale transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                {t.settings.account}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="w-full hover-scale"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t.settings.signOut}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};