import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface PersonalCoachPageProps {
  onBack: () => void;
}

// === הגדרות קריטיות ===
// זה ה-URL ששלחת (פונקציה בשם quick-endpoint). אם הפונקציה שלך נקראת אחרת (למשל chat) – החלף כאן ל-URL שלה.
const FUNCTION_URL =
  'https://itxtpwxqpzxrlsxdcxpe.supabase.co';

// הדבק כאן את ה-anon public key מה-Supabase (Settings → API → Project API keys → anon public)
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY_HERE';
// =======================

export const PersonalCoachPage = ({ onBack }: PersonalCoachPageProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        "Hi! I'm your personal AI coach. I have access to all your workout data and I'm here to help you achieve your fitness goals. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    setUserProfile({
      ...profile,
      recentWorkouts: workouts || [],
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // היסטוריה מצומצמת לשמירה על בקשה קלה
      const compactHistory = messages.slice(-5).map(m => ({
        isUser: m.isUser,
        content: m.content,
      }));

      // נצרף JWT אם המשתמש מחובר; אחרת נשלח את ה-anon key
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData?.session?.access_token;

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${jwt ?? SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage.content }],
          userProfile,
          conversationHistory: compactHistory,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('Edge Function HTTP error:', res.status, txt);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          data?.reply ||
          "I'm here to help! Let me know what specific advice you need.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Edge Function error (fetch):', err?.message || err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content:
            "I'm having trouble connecting right now. Please try again later!",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Personal Coach</h1>
          <div />
        </div>

        <Card className="h-[calc(100vh-12rem)]">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>AI Fitness Coach</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col h-full p-0">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.isUser ? 'bg-primary text-primary-foreground ml-4' : 'bg-muted mr-4'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {!message.isUser && <Bot className="h-4 w-4 mt-1 flex-shrink-0" />}
                        <p className="text-sm">{message.content}</p>
                        {message.isUser && <User className="h-4 w-4 mt-1 flex-shrink-0" />}
                      </div>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 mr-4">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full animate-bounce bg-primary"></div>
                          <div className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-6 border-t">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your coach anything..."
                  disabled={isLoading}
                />
                <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
