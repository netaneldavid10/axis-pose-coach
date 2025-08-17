import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmailVerificationMessageProps {
  onResendEmail?: () => void;
  onBack: () => void;
}

export const EmailVerificationMessage: React.FC<EmailVerificationMessageProps> = ({ 
  onResendEmail, 
  onBack 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary-dark rounded-2xl">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-base">
            We've sent you a verification link. Please check your email and click the link to verify your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or request a new one.
            </p>
            
            <div className="space-y-2">
              {onResendEmail && (
                <Button 
                  variant="outline" 
                  onClick={onResendEmail}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Email
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};