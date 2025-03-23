import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyProps {
  className?: string;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export function Empty({
  className,
  title = "No data found",
  message = "There's nothing here yet.",
  action,
  icon = <FolderOpen className="h-12 w-12 text-muted-foreground" />,
}: EmptyProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", className)}>
      {icon}
      <h3 className="text-lg font-semibold mt-4 mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
} 