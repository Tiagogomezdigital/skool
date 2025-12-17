import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('role, email, name')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      return data?.role as 'admin' | 'student' | null;
    },
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    // Garantir que sempre use o valor mais recente do cache
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}

export function useIsAdmin() {
  const { data: role, isLoading, isError, error } = useUserRole();
  
  // Se está carregando ou houve erro, retorna undefined para indicar estado desconhecido
  if (isLoading || isError) return undefined;
  
  // Se role é null ou undefined, retorna false (não é admin)
  if (role === null || role === undefined) return false;
  
  // Retorna true apenas se role é exatamente 'admin'
  return role === 'admin';
}

export function useUserRoleData() {
  return useUserRole();
}

