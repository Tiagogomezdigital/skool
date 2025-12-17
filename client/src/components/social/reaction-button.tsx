import { ThumbsUp, Heart, Laugh } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ReactionType } from '@/types/social';
import { cn } from '@/lib/utils';

interface ReactionButtonProps {
  type: ReactionType;
  count: number;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

const reactionConfig: Record<ReactionType, { icon: typeof ThumbsUp; label: string; color: string }> = {
  like: {
    icon: ThumbsUp,
    label: 'Curtir',
    color: 'text-blue-500',
  },
  love: {
    icon: Heart,
    label: 'Amar',
    color: 'text-red-500',
  },
  laugh: {
    icon: Laugh,
    label: 'Rir',
    color: 'text-yellow-500',
  },
};

export function ReactionButton({
  type,
  count,
  isActive,
  onClick,
  className,
}: ReactionButtonProps) {
  const config = reactionConfig[type];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
              'gap-1.5 h-8 px-2.5 text-muted-foreground hover:text-foreground transition-all duration-200 rounded-full hover:bg-muted/80',
              isActive && config.color,
              isActive && 'bg-muted/50',
              className
            )}
            aria-label={config.label}
          >
            <Icon className={cn(
              'h-[18px] w-[18px] transition-transform duration-200',
              isActive && 'fill-current scale-110'
            )} />
            {count > 0 && (
              <span className={cn('text-sm font-semibold tabular-nums', isActive && config.color)}>
                {count}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

