import React from 'react';
import Image from 'next/image';

/**
 * Props for the Logo component.
 * @internal
 */
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

const sizeDimensions = {
  sm: { width: 48, height: 48 },
  md: { width: 64, height: 64 },
  lg: { width: 112, height: 112 },
  xl: { width: 192, height: 192 },
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
  const dimensions = size ? sizeDimensions[size] : { width: 64, height: 64 };

  return (
    <Image
      src="/logoicon.png"
      alt="BlockBallot Logo"
      width={dimensions.width}
      height={dimensions.height}
      className={combinedClassName}
    />
  );
}
