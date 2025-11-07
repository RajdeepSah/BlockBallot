import React from 'react';
import { Vote, Shield, Github, FileText } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1 bg-indigo-600 rounded">
                <Vote className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg">BlockBallot</span>
            </div>
            <p className="text-sm text-gray-600">
              Secure, transparent, and private voting platform for organizations and communities.
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-3">Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <Shield className="w-3 h-3" />
                <span>Two-Factor Authentication</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="w-3 h-3" />
                <span>Anonymous Voting</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="w-3 h-3" />
                <span>Real-time Results</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="w-3 h-3" />
                <span>Audit Trail</span>
              </li>
            </ul>
          </div>

          {/* Important Notice */}
          <div>
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-3">Notice</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p className="flex items-start space-x-2">
                <span className="text-yellow-600">⚠️</span>
                <span>Demonstration platform only</span>
              </p>
              <p className="text-xs">
                Not for use with sensitive elections or personal data. For production use, additional security measures required.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} BlockBallot MVP. Built with React & Supabase.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://github.com', '_blank');
                }}
                className="hover:text-indigo-600 flex items-center space-x-1"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  alert('View README.md, DEMO_GUIDE.md, and TROUBLESHOOTING.md files for documentation');
                }}
                className="hover:text-indigo-600 flex items-center space-x-1"
              >
                <FileText className="w-4 h-4" />
                <span>Docs</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
