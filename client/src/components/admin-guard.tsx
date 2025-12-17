import { useUserRole } from '@/hooks/use-user-role';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AdminGuard({ 
  children, 
  fallback,
  redirectTo = '/'
}: AdminGuardProps) {
  const { user, loading: authLoading } = useAuth();
  // Usar useUserRole diretamente para ter mais controle sobre o estado
  const { data: role, isLoading: roleLoading, isError: roleError } = useUserRole();
  const [, setLocation] = useLocation();

  // Calcular isAdmin diretamente aqui para evitar race conditions
  const isAdmin = roleLoading || roleError ? undefined : role === 'admin';

  // Aguardar até que tanto a autenticação quanto a role sejam carregadas
  // isAdmin === undefined significa que ainda está carregando ou houve erro
  const isLoading = authLoading || roleLoading || isAdmin === undefined;

  useEffect(() => {
    // Não fazer nada enquanto está carregando
    if (isLoading || roleLoading) {
      return;
    }

    // Só redirecionar se não estiver carregando e não for admin
    if (!user) {
      setLocation('/login');
      return;
    }
    
    // CORREÇÃO: Só redirecionar se role foi DEFINITIVAMENTE carregada (não é null/undefined) e não é admin
    // Se role é null ou undefined, ainda está carregando ou não existe, então não redirecionar
    if (!roleLoading && role !== null && role !== undefined && role !== 'admin') {
      setLocation(redirectTo);
      return;
    }
    
    // Se role é null ou undefined, ainda está carregando - não fazer nada
    if (role === null || role === undefined) {
      return;
    }
    
  }, [user, role, roleLoading, roleError, isLoading, redirectTo, setLocation]);

  // Mostrar loader enquanto carrega
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não tem usuário, não renderizar nada (o useEffect vai redirecionar)
  if (!user) {
    return null;
  }

  // Se não é admin, não renderizar nada (o useEffect vai redirecionar)
  // Só renderizar se role foi DEFINITIVAMENTE carregada e é 'admin'
  // Se role é null/undefined, ainda está carregando - não renderizar
  if (roleLoading || role === null || role === undefined || role !== 'admin') {
    return null;
  }

  // Se chegou aqui, é admin e pode renderizar
  return <>{children}</>;
}

