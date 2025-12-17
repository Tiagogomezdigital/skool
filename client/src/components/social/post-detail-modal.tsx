import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Post, Comment } from '@/types/social';
import { PostHeader } from './post-header';
import { PostContent } from './post-content';
import { PostActions } from './post-actions';
import { PostActionsMenu } from './post-actions-menu';
import { PostEditDialog } from './post-edit-dialog';
import { CommentComposer } from './comment-composer';
import { CommentList } from './comment-list';
import { ReactionType } from '@/types/social';
import { X, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useComments } from '@/hooks/use-forum';
import { Post as PostPermissionType } from '@/lib/permissions';
import { getAvatarUrl } from '@/lib/avatar-utils';

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onCommentAdd?: (postId: string, content: string, parentId?: string) => void;
  onReactionChange?: (postId: string, reactions: Array<{ id: string; type: ReactionType; userId: string; userName: string }>) => void;
  onShare?: (postId: string) => void;
}

export function PostDetailModal({
  post,
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onCommentAdd,
  onReactionChange,
  onShare,
}: PostDetailModalProps) {
  const [editingPost, setEditingPost] = useState<PostPermissionType | null>(null);

  // Buscar comentários do Supabase (sempre chamar o hook, mesmo se post for null)
  const postId = post ? parseInt(post.id) || 0 : 0;
  const { data: supabaseComments, isLoading: commentsLoading } = useComments(postId);

  // Converter comentários do Supabase para o formato Comment
  const comments = useMemo(() => {
    if (!supabaseComments || supabaseComments.length === 0) {
      return [];
    }

    // Primeiro, converter todos os comentários
    const allComments: Comment[] = supabaseComments.map((comment: any) => {
      const commentUser = comment.users || {};
      return {
        id: String(comment.id),
        content: comment.content,
        authorId: comment.user_id,
        authorName: commentUser.name || commentUser.email?.split('@')[0] || 'Usuário',
        authorAvatar: getAvatarUrl(commentUser.avatar_url, commentUser.name || commentUser.email) || undefined,
        createdAt: new Date(comment.created_at),
        reactions: [], // Será preenchido se houver dados de reações
        parentId: comment.parent_id ? String(comment.parent_id) : undefined,
      };
    });

    // Organizar comentários em árvore (comentários de primeiro nível e suas respostas)
    const rootComments: Comment[] = [];
    const commentsMap = new Map<string, Comment>();

    // Primeiro, criar um mapa de todos os comentários
    allComments.forEach(comment => {
      commentsMap.set(comment.id, { ...comment, replies: [] });
    });

    // Depois, organizar em árvore
    allComments.forEach(comment => {
      const commentWithReplies = commentsMap.get(comment.id)!;
      if (comment.parentId) {
        // É uma resposta
        const parent = commentsMap.get(comment.parentId);
        if (parent) {
          if (!parent.replies) {
            parent.replies = [];
          }
          parent.replies.push(commentWithReplies);
        }
      } else {
        // É um comentário de primeiro nível
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  }, [supabaseComments]);

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    if (!post) return;
    await onCommentAdd?.(post.id, content, parentId);
  };

  const handleReply = (content: string, parentId: string) => {
    handleCommentSubmit(content, parentId);
  };

  const handleEdit = (postToEdit: PostPermissionType) => {
    setEditingPost(postToEdit);
  };

  // Early return DEPOIS de todos os hooks
  if (!post) return null;

  // Converter Post do tipo social para o formato esperado pelo PostActionsMenu
  const postForMenu: PostPermissionType = {
    id: parseInt(post.id) || 0,
    user_id: post.authorId,
    title: post.title,
    content: post.content,
    course_id: 0,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>{post.title}</DialogTitle>
        </VisuallyHidden>

        {/* Header com botão de fechar */}
        <div className="flex items-center justify-between p-6 border-b border-border/40">
          <h2 className="text-lg font-semibold">Detalhes da Postagem</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 md:p-8 space-y-6">
            {/* Post Header */}
            <div className="flex items-start justify-between gap-3">
              <PostHeader post={post} className="flex-1" />
              <div onClick={(e) => e.stopPropagation()}>
                <PostActionsMenu post={postForMenu} onEdit={handleEdit} />
              </div>
            </div>

            {/* Post Content */}
            <div className="space-y-4">
              <PostContent post={post} />
            </div>

            {/* Post Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-border/40">
              <PostActions
                postId={post.id}
                reactions={post.reactions}
                commentCount={post.commentCount}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                onCommentClick={() => {}} // Não precisa fazer nada, já está expandido
                onShareClick={onShare ? () => onShare(post.id) : undefined}
                onReactionChange={(reactions) => onReactionChange?.(post.id, reactions)}
              />
            </div>

            {/* Comments Section */}
            <div className="space-y-6 pt-6 border-t border-border/40">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Comentários ({comments.length})
                </h3>
              </div>

              {/* Comment Composer */}
              {onCommentAdd && (
                <div className="pb-4 border-b border-border/30">
                  <CommentComposer
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    currentUserAvatar={currentUserAvatar}
                    placeholder="Escreva um comentário..."
                    onSubmit={(content) => handleCommentSubmit(content)}
                    autoFocus={false}
                  />
                </div>
              )}

              {/* Comments List */}
              {commentsLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Carregando comentários...</p>
                </div>
              ) : comments && comments.length > 0 ? (
                <CommentList
                  comments={comments}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  onReply={handleReply}
                  onReactionChange={(commentId, reactions) => {
                    // Handle comment reaction changes
                    // In a real app, you'd update the comment in the post's comments array
                  }}
                />
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/50">
                    <MessageCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-sm">Nenhum comentário ainda</p>
                    <p className="text-xs text-muted-foreground">Seja o primeiro a comentar!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>

      <PostEditDialog
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
      />
    </Dialog>
  );
}

