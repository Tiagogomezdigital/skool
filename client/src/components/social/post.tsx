import { useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Post } from '@/types/social';
import { PostHeader } from './post-header';
import { PostContent } from './post-content';
import { ActivityIndicator } from './activity-indicator';
import { PostActions } from './post-actions';
import { PostActionsMenu } from './post-actions-menu';
import { PostEditDialog } from './post-edit-dialog';
import { ReactionType } from '@/types/social';
import { cn } from '@/lib/utils';
import { Post as PostPermissionType } from '@/lib/permissions';

interface PostProps {
  post: Post;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onCommentAdd?: (postId: string, content: string, parentId?: string) => void;
  onReactionChange?: (postId: string, reactions: Array<{ id: string; type: ReactionType; userId: string; userName: string }>) => void;
  onShare?: (postId: string) => void;
  onPostClick?: (post: Post) => void;
  className?: string;
}

export function PostComponent({
  post,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onCommentAdd,
  onReactionChange,
  onShare,
  onPostClick,
  className,
}: PostProps) {
  const [editingPost, setEditingPost] = useState<PostPermissionType | null>(null);

  const handlePostClick = () => {
    if (onPostClick) {
      onPostClick(post);
    }
  };

  const handleCommentClick = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevenir propagação dupla
    // Abrir modal ao clicar em comentários
    if (onPostClick) {
      onPostClick(post);
    }
  };

  const handleEdit = (postToEdit: PostPermissionType) => {
    setEditingPost(postToEdit);
  };

  // Converter Post do tipo social para o formato esperado pelo PostActionsMenu
  const postForMenu: PostPermissionType = {
    id: parseInt(post.id) || 0,
    user_id: post.authorId,
    title: post.title,
    content: post.content,
    course_id: 0, // Será preenchido se necessário
    created_at: post.createdAt.toISOString(),
    pinned: post.pinned,
    users: {
      id: post.authorId,
      name: post.authorName,
      email: undefined,
      avatar_url: post.authorAvatar,
    },
  };

  return (
    <>
      <Card 
        className={cn(
          'border-border/50 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group',
          className
        )}
        onClick={handlePostClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <PostHeader post={post} className="flex-1" />
            <div onClick={(e) => e.stopPropagation()}>
              <PostActionsMenu post={postForMenu} onEdit={handleEdit} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <PostContent post={post} />
        </CardContent>

        <CardFooter className="pt-3 pb-4 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <PostActions
              postId={post.id}
              reactions={post.reactions}
              commentCount={post.commentCount}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              onCommentClick={handleCommentClick}
              onShareClick={onShare ? () => onShare(post.id) : undefined}
              onReactionChange={(reactions) => onReactionChange?.(post.id, reactions)}
            />
            <ActivityIndicator post={post} />
          </div>
        </CardFooter>
      </Card>

      <PostEditDialog
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
      />
    </>
  );
}

