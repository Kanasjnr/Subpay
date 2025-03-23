import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ErrorProps {
  className?: string;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function Error({
  className,
  title = "Something went wrong",
  message = "An error occurred while loading the data. Please try again.",
  onRetry,
}: ErrorProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", className)}>
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
} 