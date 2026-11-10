/**
 * PURPOSE: Animated loading spinner and skeleton placeholder component
 * INPUT: message?: string
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-400 space-y-2">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      <span className="text-xs">{message}</span>
    </div>
  );
};
