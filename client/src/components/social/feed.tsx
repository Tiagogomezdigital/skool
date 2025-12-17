import { useMemo } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Post as PostType } from '@/types/social';
import { PostComponent } from './post';
import { PostComposerSimple } from './post-composer-simple';
import { useAuth } from '@/hooks/use-auth';
import { useUserRole } from '@/hooks/use-user-role';
import { can } from '@/lib/permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { convertBlocksToContent } from '@/lib/post-utils';

interface FeedProps {
  posts: PostType[];
  isLoading?: boolean;
  onPostCreate?: (title: string, content: string) => Promise<void>;
  onCommentAdd?: (postId: string, content: string, parentId?: string) => void;
  onReactionChange?: (postId: string, reactions: Array<{ id: string; type: any; userId: string; userName: string }>) => void;
  onShare?: (postId: string) => void;
  onPostClick?: (post: PostType) => void;
  context?: string;
  contextHighlight?: string;
  className?: string;
}

/**
 * Feed - Container principal do feed social
 * 
 * Funcionalidades:
 * - Ordena posts: pinned primeiro, depois por data
 * - Renderiza PostComposer no topo (se autorizado)
 * - Renderiza lista de PostCard
 * - Loading states e empty state
 */
export function Feed({
  posts,
  isLoading = false,
  onPostCreate,
  onCommentAdd,
  onReactionChange,
  onShare,
  onPostClick,
  context,
  contextHighlight,
  className,
}: FeedProps) {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();

  // Verificar se usuário pode criar posts
  const canCreate = can(user, userRole || null, 'create');

  // Ordenar posts: pinned primeiro, depois por data (mais recente primeiro)
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      // Posts fixados primeiro
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Depois ordenar por data (mais recente primeiro)
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [posts]);

  const currentUser = user ? {
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
    avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.name || user.email || 'U')}`,
  } : null;

  const handlePublish = async (title: string, content: string) => {
    if (onPostCreate) {
      await onPostCreate(title, content);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border/50 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Post Composer */}
      {canCreate && currentUser && onPostCreate && (
        <PostComposerSimple
          avatar={currentUser.avatar}
          name={currentUser.name}
          context={context}
          contextHighlight={contextHighlight}
          onPublish={handlePublish}
          isPublishing={false}
        />
      )}

      {/* Posts List */}
      {sortedPosts.length > 0 ? (
        <div className="space-y-4">
          {sortedPosts.map((post) => {
            // Converter Post do tipo social para formato esperado pelo PostComponent
            const postForComponent: PostType = {
              ...post,
              createdAt: post.createdAt instanceof Date 
                ? post.createdAt 
                : new Date(post.createdAt),
            };

            return (
              <PostComponent
                key={post.id}
                post={postForComponent}
                currentUserId={user?.id || ''}
                currentUserName={currentUser?.name || 'Usuário'}
                currentUserAvatar={currentUser?.avatar}
                onCommentAdd={onCommentAdd}
                onReactionChange={onReactionChange}
                onShare={onShare}
                onPostClick={onPostClick}
              />
            );
          })}
        </div>
      ) : (
        <Card className="border-border/50 shadow-sm border-dashed">
          <CardContent className="p-12 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50">
              <MessageSquarePlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">
                Nenhum post ainda
              </p>
              <p className="text-sm text-muted-foreground">
                Seja o primeiro a compartilhar algo com a comunidade!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

