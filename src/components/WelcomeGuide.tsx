import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { UserPlus, Search, TrendingUp, CheckCircle, X } from 'lucide-react';
import { Logo } from './Logo';

/**
 * Welcome guide component displayed on first visit to the dashboard.
 * Shows users how to use the platform and can be dismissed.
 *
 * @returns Welcome guide modal or null if already seen
 */
export function WelcomeGuide() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const hasSeenGuide = localStorage.getItem('blockballot_seen_guide');
      if (!hasSeenGuide) {
        setShow(true);
      }
    } catch (error) {
      console.error('Error checking welcome guide status:', error);
    }
  }, []);

  const handleClose = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('blockballot_seen_guide', 'true');
      }
    } catch (error) {
      console.error('Error saving welcome guide status:', error);
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-700 p-2">
                <Logo size="sm" className="h-12 w-12" />
              </div>
              <div>
                <CardTitle className="text-2xl">Welcome to BlockBallot!</CardTitle>
                <CardDescription>
                  A secure voting platform for transparent elections
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="space-y-4">

            <div className="space-y-4">
              <div className="flex items-start space-x-3 rounded-lg bg-blue-50 p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm text-white">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">As a Voter</h4>
                  <p className="text-sm text-gray-600">
                    Enter a 7-digit election code to join and vote in elections
                  </p>
                </div>
                <Search className="mt-1 h-5 w-5 text-blue-600" />
              </div>

              <div className="flex items-start space-x-3 rounded-lg bg-green-50 p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-sm text-white">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">As an Admin</h4>
                  <p className="text-sm text-gray-600">
                    Create elections, set up positions & candidates, and manage voter eligibility
                  </p>
                </div>
                <UserPlus className="mt-1 h-5 w-5 text-green-600" />
              </div>

              <div className="flex items-start space-x-3 rounded-lg bg-purple-50 p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-sm text-white">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">View Results</h4>
                  <p className="text-sm text-gray-600">
                    See live results (admin) or public results after elections close
                  </p>
                </div>
                <TrendingUp className="mt-1 h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
          <Button onClick={handleClose} className="w-full">
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
