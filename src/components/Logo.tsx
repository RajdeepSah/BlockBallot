import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-28 w-28',
  xl: 'h-48 w-48',
};

/**
 * Reusable Logo component for BlockBallot branding.
 * 
 * @param props - Component props
 * @param props.className - Additional CSS classes
 * @param props.size - Predefined size variant (sm, md, lg, xl)
 * @returns Logo image element
 */
export function Logo({ className = '', size }: LogoProps) {
  const sizeClass = size ? sizeClasses[size] : '';
  const combinedClassName = `logo-icon ${sizeClass} ${className}`.trim();

  return (
    <img 
      src="/logoicon.png" 
      alt="BlockBallot Logo" 
      className={combinedClassName}
    />
  );
}

