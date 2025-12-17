import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export function useAdminCourses() {
  return useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useAdminCourse(courseId: number) {
  return useQuery({
    queryKey: ['admin-course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseData: {
      title: string;
      description?: string;
      community_id?: string;
      image_text?: string;
      cover_image_url?: string;
      cover_image_data?: string;
      cover_image_mime_type?: string;
      is_locked?: boolean;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar o próximo número de ordem
      const { data: existingCourses } = await supabase
        .from('courses')
        .select('order')
        .order('order', { ascending: false, nullsFirst: false })
        .limit(1);

      const nextOrder = existingCourses && existingCourses.length > 0 && existingCourses[0].order !== null
        ? existingCourses[0].order + 1
        : 1;

      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...courseData,
          created_by: user.id,
          order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...courseData }: {
      id: number;
      title?: string;
      description?: string;
      community_id?: string;
      image_text?: string;
      cover_image_url?: string;
      cover_image_data?: string;
      cover_image_mime_type?: string;
      is_locked?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.id] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: number) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

/**
 * Reordena cursos atualizando o campo order
 * Recebe um array de IDs na nova ordem
 */
export function useReorderCourses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseIds: number[]) => {
      // Criar array de updates com a nova ordem
      const updates = courseIds.map((id, index) => ({
        id,
        order: index + 1,
      }));

      // Executar updates em batch usando Promise.all
      const updatePromises = updates.map(({ id, order }) =>
        supabase
          .from('courses')
          .update({ order })
          .eq('id', id)
      );

      const results = await Promise.all(updatePromises);
      
      // Verificar se algum update falhou
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Erro ao reordenar cursos: ${errors[0].error?.message}`);
      }

      return courseIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

