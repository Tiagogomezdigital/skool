import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAcceptInvite, useCommunityBySlug, getCommunityLogoUrl } from '@/hooks/use-communities';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function InvitePage() {
  const [, params] = useRoute('/invite/:token');
  const [, setLocation] = useLocation();
  const token = params?.token || null;
  
  const acceptInviteMutation = useAcceptInvite();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkInvite = async () => {
      if (!token) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('community_invites')
          .select(`
            *,
            communities:community_id (
              id,
              slug,
              name,
              description,
              logo_url
            )
          `)
          .eq('token', token)
          .single();

        if (error) {
          setInviteValid(false);
          setIsChecking(false);
          return;
        }

        // Verificar se já foi usado
        if (data.used_at) {
          setInviteValid(false);
          setInviteData({ ...data, error: 'used' });
          setIsChecking(false);
          return;
        }

        // Verificar se expirou
        if (new Date(data.expires_at) < new Date()) {
          setInviteValid(false);
          setInviteData({ ...data, error: 'expired' });
          setIsChecking(false);
          return;
        }

        setInviteValid(true);
        setInviteData(data);
        setIsChecking(false);
      } catch (error) {
        setInviteValid(false);
        setIsChecking(false);
      }
    };

    checkInvite();
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!token || !isAuthenticated) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para aceitar o convite',
        variant: 'destructive',
      });
      setLocation('/login');
      return;
    }

    try {
      const communityId = await acceptInviteMutation.mutateAsync(token);
      
      toast({
        title: 'Convite aceito!',
        description: 'Você foi adicionado à comunidade com sucesso',
      });

      // Redirecionar para a comunidade usando /c/:slug
      if (inviteData?.communities?.slug) {
        setLocation(`/c/${inviteData.communities.slug}`);
      } else {
        setLocation('/');
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao aceitar convite',
        description: error.message || 'Não foi possível aceitar o convite',
        variant: 'destructive',
      });
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verificando convite...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteValid) {
    const errorType = inviteData?.error;
    const community = inviteData?.communities;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-center">Convite Inválido</CardTitle>
            <CardDescription className="text-center">
              {errorType === 'used' 
                ? 'Este convite já foi usado'
                : errorType === 'expired'
                ? 'Este convite expirou'
                : 'Não foi possível encontrar este convite'}
            </CardDescription>
          </CardHeader>
          {community && (
            <CardContent>
              <div className="text-center text-sm text-muted-foreground">
                <p>Comunidade: <strong>{community.name}</strong></p>
              </div>
            </CardContent>
          )}
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => setLocation('/')}
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const community = inviteData?.communities;

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Erro ao carregar informações da comunidade</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {getCommunityLogoUrl(community) ? (
              <img 
                src={getCommunityLogoUrl(community)!} 
                alt={community.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          <CardTitle className="text-center">{community.name}</CardTitle>
          {community.description && (
            <CardDescription className="text-center">
              {community.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Você foi convidado para participar desta comunidade
            </p>
            {inviteData.email && (
              <p className="text-xs text-muted-foreground">
                Convite para: <strong>{inviteData.email}</strong>
              </p>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="space-y-2">
              <Button 
                className="w-full" 
                onClick={() => setLocation('/login')}
              >
                Fazer Login para Aceitar
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setLocation('/register')}
              >
                Criar Conta
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleAcceptInvite}
              disabled={acceptInviteMutation.isPending}
            >
              {acceptInviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aceitando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aceitar Convite
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

