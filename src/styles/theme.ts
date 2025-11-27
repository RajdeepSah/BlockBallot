/**
 * Theme Configuration
 * 
 * Centralized theme tokens for design customization.
 * Design leads can modify these values to change the look and feel across the app.
 * 
 * Usage in components:
 * import { theme } from '@/styles/theme';
 * <div className={theme.colors.status.success.bg}>...</div>
 */

export const theme = {
  /**
   * Color tokens organized by purpose
   */
  colors: {
    /**
     * Status colors for badges, alerts, and notifications
     * Each status has bg (background), border, and text variants
     */
    status: {
      success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        /** Combined classes for alerts/cards */
        alert: 'bg-green-50 border-green-200 text-green-800',
      },
      warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        alert: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      },
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        alert: 'bg-blue-50 border-blue-200 text-blue-600',
      },
      error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        alert: 'bg-red-50 border-red-200 text-red-800',
      },
    },
    
    /**
     * Primary brand colors
     */
    brand: {
      primary: 'bg-indigo-600',
      primaryText: 'text-indigo-600',
      primaryHover: 'hover:bg-indigo-700',
    },
    
    /**
     * Page and section backgrounds
     */
    background: {
      page: 'bg-gray-50',
      card: 'bg-white',
      muted: 'bg-gray-100',
    },
  },
  
  /**
   * Spacing tokens for consistent padding/margins
   */
  spacing: {
    /** Standard page container padding */
    page: 'px-4 sm:px-6 lg:px-8 py-8',
    /** Card internal padding */
    card: 'p-6',
    /** Section gaps */
    section: 'space-y-6',
  },
  
  /**
   * Layout tokens
   */
  layout: {
    /** Max-width variants for page containers */
    maxWidth: {
      sm: 'max-w-md',
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-7xl',
    },
    /** Centered container with auto margins */
    container: 'mx-auto',
  },
  
  /**
   * Typography tokens
   */
  typography: {
    /** Heading styles */
    heading: {
      page: 'text-2xl font-medium tracking-tight',
      section: 'text-xl font-medium',
      card: 'text-lg font-medium',
    },
    /** Body text styles */
    body: {
      default: 'text-base text-gray-700',
      muted: 'text-sm text-gray-500',
      small: 'text-xs text-gray-400',
    },
  },
  
  /**
   * Loading spinner configuration
   */
  loading: {
    spinner: 'animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600',
    text: 'mt-4 text-gray-600',
  },
} as const;

/**
 * Type definitions for theme tokens
 */
export type Theme = typeof theme;
export type StatusColor = keyof typeof theme.colors.status;
export type MaxWidth = keyof typeof theme.layout.maxWidth;

