import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }: CardProps) => (
  <div className={`border-b border-gray-200 pb-2 mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }: CardProps) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }: CardProps) => (
  <div className={className}>
    {children}
  </div>
);
