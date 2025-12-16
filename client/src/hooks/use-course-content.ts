import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useModules(courseId: number) {
  return useQuery({
    queryKey: ['modules', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (error) {
        console.error(`❌ Erro ao buscar módulos do curso ${courseId}:`, error);
        throw error;
      }
      
      console.log(`✅ Módulos carregados do curso ${courseId}:`, data?.length || 0, 'módulos');
      if (data && data.length > 0) {
        console.log('📦 Módulos:', data.map(m => ({ id: m.id, title: m.title, order: m.order })));
      }
      
      return data;
    },
    enabled: !!courseId,
  });
}

export function useLessons(moduleId: number) {
  return useQuery({
    queryKey: ['lessons', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order', { ascending: true });

      if (error) {
        console.error(`❌ Erro ao buscar aulas do módulo ${moduleId}:`, error);
        throw error;
      }
      
      console.log(`✅ Aulas carregadas do módulo ${moduleId}:`, data?.length || 0, 'aulas');
      if (data && data.length > 0) {
        console.log('📝 Aulas:', data.map(l => ({ id: l.id, title: l.title, order: l.order })));
      }
      
      return data;
    },
    enabled: !!moduleId,
  });
}

export function useLessonProgress(courseId: number) {
  return useQuery({
    queryKey: ['lesson-progress', courseId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar todas as aulas do curso e verificar quais foram concluídas
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      if (!modules || modules.length === 0) return [];

      const moduleIds = modules.map(m => m.id);
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (!lessons || lessons.length === 0) return [];

      const lessonIds = lessons.map(l => l.id);
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      if (error) throw error;
      return data.map(p => p.lesson_id);
    },
    enabled: !!courseId,
  });
}

export function useMarkLessonComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('lesson_progress')
        .insert({ user_id: user.id, lesson_id: lessonId });

      if (error) throw error;
    },
    onSuccess: (_, lessonId) => {
      // Buscar o course_id através do lesson_id
      supabase
        .from('lessons')
        .select('module_id, modules!inner(course_id)')
        .eq('id', lessonId)
        .single()
        .then(({ data }) => {
          if (data && (data as any).modules) {
            const courseId = (data as any).modules.course_id;
            queryClient.invalidateQueries({ queryKey: ['lesson-progress', courseId] });
            queryClient.invalidateQueries({ queryKey: ['lessons'] });
          }
        });
    },
  });
}

export function useCourseProgress(courseId: number) {
  const { data: completedLessonIds = [] } = useLessonProgress(courseId);
  const { data: modules } = useModules(courseId);

  const totalLessons = modules?.reduce((acc, module) => {
    // Precisamos contar as aulas de cada módulo
    // Por enquanto retornamos um valor aproximado
    return acc + 1; // Placeholder - será calculado corretamente quando tivermos as aulas
  }, 0) || 0;

  // Buscar total real de aulas
  const { data: allLessons } = useQuery({
    queryKey: ['all-lessons', courseId],
    queryFn: async () => {
      if (!modules) return [];
      const moduleIds = modules.map(m => m.id);
      const { data, error } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (error) throw error;
      return data;
    },
    enabled: !!modules && modules.length > 0,
  });

  const total = allLessons?.length || 0;
  const completed = completedLessonIds.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { progress, completed, total };
}

