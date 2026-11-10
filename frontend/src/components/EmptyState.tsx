/**
 * PURPOSE: Component displaying empty state when queries return no rows
 * INPUT: title?: string, description?: string, icon?: LucideIcon
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'Try adjusting your search criteria or date filter.'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
      <div className="p-3 bg-slate-800 rounded-full mb-3 text-slate-500">
        <Inbox className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-300">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>
    </div>
  );
};

