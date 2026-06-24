import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-elevated text-text-secondary border border-border',
        accent: 'bg-accent text-accent-foreground',
        success: 'bg-success/10 text-success border border-success/20',
        danger: 'bg-danger/10 text-danger border border-danger/20',
        warning: 'bg-warning/10 text-warning border border-warning/20',
        info: 'bg-info/10 text-info border border-info/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
