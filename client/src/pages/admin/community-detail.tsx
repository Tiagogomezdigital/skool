import { useState } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  useCommunityBySlug, 
  useCommunityMembers,
  useCommunityInvites,
  useCreateInvite,
  useAcceptInvite,
  type CommunityMember
} from '@/hooks/use-communities';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Mail, Copy, Loader2, Trash2, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminCommunityDetail() {
  const [, params] = useRoute('/admin/communities/:slug');
  const slug = params?.slug || null;
  
  const { data: community, isLoading: communityLoading } = useCommunityBySlug(slug);
  const { data: members, isLoading: membersLoading } = useCommunityMembers(community?.id || null);
  const { data: invites, isLoading: invitesLoading } = useCommunityInvites(community?.id || null);
  
  const createInviteMutation = useCreateInvite();
  const { toast } = useToast();
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteExpiresDays, setInviteExpiresDays] = useState(7);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const handleCreateInvite = async () => {
    if (!community) return;
    
    if (!inviteEmail.trim()) {
      toast({
        title: 'Erro',
        description: 'O email é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      const invite = await createInviteMutation.mutateAsync({
        communityId: community.id,
        email: inviteEmail.trim(),
        expiresInDays: inviteExpiresDays,
      });

      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/invite/${invite.token}`;
      
      // Copiar para clipboard
      await navigator.clipboard.writeText(inviteUrl);
      
      toast({
        title: 'Convite criado!',
        description: 'O link do convite foi copiado para a área de transferência',
      });
      
      setInviteEmail('');
      setIsInviteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar convite',
        description: error.message || 'Não foi possível criar o convite',
        variant: 'destructive',
      });
    }
  };

  const copyInviteLink = async (token: string) => {
    if (!community) return;
    
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/invite/${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    
    toast({
      title: 'Link copiado!',
      description: 'O link do convite foi copiado para a área de transferência',
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'admin':
        return 'Administrador';
      case 'moderator':
        return 'Moderador';
      case 'member':
        return 'Membro';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'moderator':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (communityLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Comunidade não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">{community.name}</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie membros e convites desta comunidade
          </p>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Membros
          </TabsTrigger>
          <TabsTrigger value="invites">
            <Mail className="h-4 w-4 mr-2" />
            Convites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Membros da Comunidade</CardTitle>
                <Badge variant="outline">{members?.length || 0} membros</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : members && members.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Membro desde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              {member.users?.name?.[0]?.toUpperCase() || member.users?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-medium">
                                {member.users?.name || member.users?.email || 'Usuário'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {member.users?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {getRoleLabel(member.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(member.joined_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum membro ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Convites Pendentes</CardTitle>
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Convite
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invitesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : invites && invites.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => {
                      const isExpired = new Date(invite.expires_at) < new Date();
                      const isUsed = !!invite.used_at;
                      
                      return (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">{invite.email}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(invite.expires_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>
                            {isUsed ? (
                              <Badge variant="secondary">Usado</Badge>
                            ) : isExpired ? (
                              <Badge variant="destructive">Expirado</Badge>
                            ) : (
                              <Badge variant="outline">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isUsed && !isExpired && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyInviteLink(invite.token)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Nenhum convite criado ainda</p>
                  <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Primeiro Convite
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Criar Novo Convite</AlertDialogTitle>
            <AlertDialogDescription>
              Envie um convite por email para adicionar um novo membro à comunidade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresDays">Expira em (dias)</Label>
              <Input
                id="expiresDays"
                type="number"
                min="1"
                max="30"
                value={inviteExpiresDays}
                onChange={(e) => setInviteExpiresDays(parseInt(e.target.value) || 7)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateInvite}
              disabled={createInviteMutation.isPending}
            >
              {createInviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Convite'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

