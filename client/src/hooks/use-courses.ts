import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Tipo para curso com campos de imagem
export interface Course {
  id: number;
  title: string;
  description: string | null;
  created_by: string | null;
  community_id: string | null;
  community_slug: string | null;
  cover_image_url: string | null;
  cover_image_data: string | null;
  cover_image_mime_type: string | null;
  image_text: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

// Helper para obter URL da imagem de capa (prioriza data, depois url)
export function getCourseCoverImageUrl(course: Course | null | undefined): string | null {
  if (!course) return null;
  if (course.cover_image_data) {
    return `data:${course.cover_image_mime_type || 'image/png'};base64,${course.cover_image_data}`;
  }
  return course.cover_image_url;
}

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      return data;
    },
  });
}

export function useCourse(courseId: number) {
  return useQuery({
    queryKey: ['course', courseId],
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

export function useEnrollments() {
  return useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(e => e.course_id);
    },
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se o curso está bloqueado
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('is_locked')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      
      if (course?.is_locked) {
        throw new Error('Este curso está bloqueado. É necessário comprar ou receber um convite para acessar.');
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({ user_id: user.id, course_id: courseId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useIsEnrolled(courseId: number) {
  const { data: enrolledCourseIds } = useEnrollments();
  return enrolledCourseIds?.includes(courseId) ?? false;
}

/**
 * Busca ou cria um curso padrão para a comunidade.
 * Este curso é usado para permitir postagens na comunidade mesmo quando não há cursos criados.
 */
export function useGetOrCreateDefaultCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Primeiro, tenta encontrar um curso padrão existente para a comunidade
      const { data: existingCourses, error: searchError } = await supabase
        .from('courses')
        .select('id')
        .eq('community_id', communityId)
        .limit(1);

      if (searchError) throw searchError;

      // Se já existe um curso na comunidade, retorna o primeiro
      if (existingCourses && existingCourses.length > 0) {
        return existingCourses[0].id;
      }

      // Se não existe, cria um curso padrão "Geral" para a comunidade
      const { data: newCourse, error: createError } = await supabase
        .from('courses')
        .insert({
          title: 'Geral',
          description: 'Curso padrão para postagens na comunidade',
          community_id: communityId,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (createError) throw createError;
      
      // Inscreve automaticamente o usuário no curso padrão
      await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: newCourse.id,
        });

      return newCourse.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

