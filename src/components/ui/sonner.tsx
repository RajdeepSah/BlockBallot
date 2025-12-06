'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-center"
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            'group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          success:
            '!bg-green-50 !border-green-200 !text-green-900 dark:!bg-green-950 dark:!border-green-800 dark:!text-green-50',
          error:
            '!bg-red-50 !border-red-200 !text-red-900 dark:!bg-red-950 dark:!border-red-800 dark:!text-red-50',
          warning:
            '!bg-yellow-50 !border-yellow-200 !text-yellow-900 dark:!bg-yellow-950 dark:!border-yellow-800 dark:!text-yellow-50',
          info: '!bg-blue-50 !border-blue-200 !text-blue-900 dark:!bg-blue-950 dark:!border-blue-800 dark:!text-blue-50',
          description: 'group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
