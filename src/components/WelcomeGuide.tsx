import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Vote, UserPlus, Search, TrendingUp, CheckCircle, X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Welcome to BlockBallot!</CardTitle>
                <CardDescription>
                  A secure voting platform for transparent elections
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-sm">
              <strong>⚠️ Demo Environment:</strong> This is a demonstration platform. 
              Do not use for sensitive elections or real personal data.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Quick Start Guide
            </h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">As a Voter</h4>
                  <p className="text-sm text-gray-600">
                    Enter a 7-digit election code to join and vote in elections
                  </p>
                </div>
                <Search className="w-5 h-5 text-blue-600 mt-1" />
              </div>

              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">As an Admin</h4>
                  <p className="text-sm text-gray-600">
                    Create elections, set up positions & candidates, and manage voter eligibility
                  </p>
                </div>
                <UserPlus className="w-5 h-5 text-green-600 mt-1" />
              </div>

              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">View Results</h4>
                  <p className="text-sm text-gray-600">
                    See live results (admin) or public results after elections close
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-purple-600 mt-1" />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="mb-3">Key Features</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">2FA</Badge>
                <span className="text-gray-600">Email verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Anonymous</Badge>
                <span className="text-gray-600">Private voting</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">One Vote</Badge>
                <span className="text-gray-600">Per person</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Receipts</Badge>
                <span className="text-gray-600">Vote verification</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="mb-2">Ballot Types Supported</h3>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• <strong>Single Choice:</strong> Vote for one candidate</li>
              <li>• <strong>Multiple Choice:</strong> Vote for multiple candidates</li>
              <li>• <strong>Ranked Choice:</strong> Rank candidates by preference</li>
            </ul>
          </div>

          <Button onClick={handleClose} className="w-full">
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
