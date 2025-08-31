import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { ArrowLeft, User, Mail, Key } from 'lucide-react';

export default function DemoLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    demoCode: ''
  });
  const [error, setError] = useState('');

  const demoLoginMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Split full name into first and last name
      const nameParts = data.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return apiRequest('POST', '/api/demo-login', {
        firstName,
        lastName,
        email: data.email,
        demoCode: data.demoCode
      });
    },
    onSuccess: async () => {
      try {
        console.log('[DEMO LOGIN] Success - starting authentication flow');
        
        // Invalidate and refetch auth cache to ensure demo user is recognized
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Wait for auth state to properly update
        console.log('[DEMO LOGIN] Refreshing authentication state...');
        const authData = await queryClient.fetchQuery({ 
          queryKey: ["/api/auth/user"],
          retry: 3 // Retry up to 3 times for robustness
        });
        
        console.log('[DEMO LOGIN] Auth data received:', authData);
        
        // Ensure the user is properly authenticated before redirect
        if (authData && (authData as any).id) {
          const user = authData as any;
          console.log('[DEMO LOGIN] User onboarding status:', user.isOnboarded);
          
          // Explicitly check the isOnboarded boolean value from database
          if (user.isOnboarded === true) {
            console.log('[DEMO LOGIN] Demo user already onboarded - redirecting to dashboard');
            window.location.href = '/';
          } else {
            console.log('[DEMO LOGIN] Demo user needs onboarding - redirecting to onboarding');
            window.location.href = '/onboarding';
          }
        } else {
          console.warn('[DEMO LOGIN] Auth data incomplete, using fallback redirect');
          setTimeout(() => {
            window.location.href = '/onboarding';
          }, 300);
        }
      } catch (error) {
        console.error('[DEMO LOGIN] Auth refresh failed:', error);
        // Fallback - still use full page redirect
        console.log('[DEMO LOGIN] Using fallback full page redirect');
        setTimeout(() => {
          window.location.href = '/onboarding';
        }, 300);
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Demo access failed. Please check your demo code.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate demo code format
    if (!formData.demoCode.toLowerCase().startsWith('demo')) {
      setError('Demo code must start with "Demo" followed by your registration number (e.g. Demo13)');
      return;
    }
    
    if (!formData.fullName || !formData.email || !formData.demoCode) {
      setError('Please fill in all fields');
      return;
    }
    
    demoLoginMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">BT</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">🎉 Welcome to Your Demo Login</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder=""
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full"
                  disabled={demoLoginMutation.isPending}
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder=""
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={demoLoginMutation.isPending}
                />
              </div>

              <div>
                <Label htmlFor="demoCode" className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4" />
                  Demo Code
                </Label>
                <Input
                  id="demoCode"
                  type="text"
                  placeholder=""
                  value={formData.demoCode}
                  onChange={(e) => handleInputChange('demoCode', e.target.value)}
                  className="w-full"
                  disabled={demoLoginMutation.isPending}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={demoLoginMutation.isPending}
              >
                {demoLoginMutation.isPending ? 'Accessing Demo...' : 'Enter My Demo'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                className="w-full text-gray-600"
                onClick={() => setLocation('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}