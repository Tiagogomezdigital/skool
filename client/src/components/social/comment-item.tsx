import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronDown, ChevronUp, Edit, Trash2, X, Check, MoreHorizontal } from 'lucide-react';
import { Comment } from '@/types/social';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReactionButton } from './reaction-button';
import { useReactions } from '@/hooks/use-reactions';
import { ReactionType } from '@/types/social';
import { CommentComposer } from './comment-composer';
import { CommentList } from './comment-list';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateComment, useDeleteComment } from '@/hooks/use-forum';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useUserRole } from '@/hooks/use-user-role';
import { canComment, Comment as CommentPermission } from '@/lib/permissions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  currentUserName: string;
  depth?: number;
  maxDepth?: number;
  onReply: (content: string, parentId: string) => void;
  onReactionChange?: (commentId: string, reactions: Array<{ id: string; type: ReactionType; userId: string; userName: string }>) => void;
}

export function CommentItem({
  comment,
  currentUserId,
  currentUserName,
  depth = 0,
  maxDepth = 10,
  onReply,
  onReactionChange,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userRole } = useUserRole();

  // Converter Comment para formato de permissão
  const commentForPermission: CommentPermission = {
    id: comment.id,
    authorId: comment.authorId,
    content: comment.content,
    createdAt: comment.createdAt,
  };

  // Verificar permissões usando o sistema centralizado
  const canUpdate = canComment(user, userRole || null, 'update', commentForPermission);
  const canDelete = canComment(user, userRole || null, 'delete', commentForPermission);
  const canModerate = canComment(user, userRole || null, 'moderate', commentForPermission);
  const isAdmin = userRole === 'admin';
  
  // Mostrar menu apenas se tiver permissões
  const showMenu = canUpdate || canDelete || (isAdmin && canModerate);

  const { reactions, reactionCounts, userReaction, toggleReaction } = useReactions({
    initialReactions: comment.reactions,
    currentUserId,
    currentUserName,
  });

  // Sync reactions changes with parent (for API integration)
  useEffect(() => {
    if (!onReactionChange) return;
    
    // Compare reactions arrays
    const hasChanges = 
      reactions.length !== comment.reactions.length ||
      reactions.some((r, i) => {
        const oldR = comment.reactions[i];
        return !oldR || r.type !== oldR.type || r.userId !== oldR.userId;
      }) ||
      comment.reactions.some((r, i) => {
        const newR = reactions[i];
        return !newR || r.type !== newR.type || r.userId !== newR.userId;
      });
    
    if (hasChanges) {
      onReactionChange(comment.id, reactions);
    }
  }, [reactions, comment.id, comment.reactions, onReactionChange]);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = depth < maxDepth;

  const handleReaction = (type: ReactionType) => {
    toggleReaction(type);
  };

  const handleReply = (content: string) => {
    onReply(content, comment.id);
    setShowComposer(false);
  };

  const handleEdit = () => {
    setEditContent(comment.content);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;

    try {
      await updateCommentMutation.mutateAsync({
        commentId: parseInt(comment.id),
        content: editContent.trim(),
      });

      toast({
        title: 'Comentário atualizado!',
        description: 'Seu comentário foi atualizado com sucesso',
      });

      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar o comentário',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteCommentMutation.mutateAsync({
        commentId: parseInt(comment.id),
      });

      toast({
        title: 'Comentário deletado',
        description: 'O comentário foi removido com sucesso',
      });

      setShowDeleteDialog(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar',
        description: error.message || 'Não foi possível deletar o comentário',
        variant: 'destructive',
      });
    }
  };

  // Atualizar editContent quando comment.content mudar
  useEffect(() => {
    if (!isEditing) {
      setEditContent(comment.content);
    }
  }, [comment.content, isEditing]);

  const initials = comment.authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn(
      'space-y-3',
      depth > 0 && 'ml-6 pl-4 border-l-2 border-primary/20 hover:border-primary/40 transition-colors'
    )}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 ring-1 ring-border/50 shrink-0">
          <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">
                  {comment.authorName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {showMenu && !isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {canUpdate && (
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] text-sm"
                  disabled={updateCommentMutation.isPending}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveEdit}
                    disabled={updateCommentMutation.isPending || !editContent.trim()}
                    className="h-7 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={updateCommentMutation.isPending}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                {comment.content}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <ReactionButton
                type="like"
                count={reactionCounts.like}
                isActive={userReaction === 'like'}
                onClick={() => handleReaction('like')}
              />
              <ReactionButton
                type="love"
                count={reactionCounts.love}
                isActive={userReaction === 'love'}
                onClick={() => handleReaction('love')}
              />
              <ReactionButton
                type="laugh"
                count={reactionCounts.laugh}
                isActive={userReaction === 'laugh'}
                onClick={() => handleReaction('laugh')}
              />
            </div>

            {canReply && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComposer(!showComposer)}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Responder
              </Button>
            )}

            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Ocultar respostas
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Mostrar {comment.replies?.length} resposta{comment.replies?.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>

          {showComposer && canReply && (
            <div className="pt-2">
              <CommentComposer
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                parentId={comment.id}
                placeholder="Escreva uma resposta..."
                onSubmit={handleReply}
                onCancel={() => setShowComposer(false)}
              />
            </div>
          )}
        </div>
      </div>

      {hasReplies && showReplies && (
        <CommentList
          comments={comment.replies || []}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          depth={depth + 1}
          maxDepth={maxDepth}
          onReply={onReply}
          onReactionChange={onReactionChange}
        />
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O comentário será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCommentMutation.isPending}
            >
              {deleteCommentMutation.isPending ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

