import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export function useInstructorStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['instructor-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Buscar cursos do instrutor
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('created_by', user.id);

      if (coursesError) throw coursesError;
      if (!courses || courses.length === 0) return { courses: [], stats: [] };

      // Para cada curso, buscar número de inscritos e progresso médio
      const statsPromises = courses.map(async (course) => {
        // Contar inscrições
        const { count: enrollmentCount, error: enrollError } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);

        if (enrollError) throw enrollError;

        // Buscar progresso médio
        // Primeiro, buscar todas as aulas do curso
        const { data: modules } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', course.id);

        if (!modules || modules.length === 0) {
          return {
            courseId: course.id,
            courseTitle: course.title,
            enrollmentCount: enrollmentCount || 0,
            averageProgress: 0,
          };
        }

        const moduleIds = modules.map(m => m.id);
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .in('module_id', moduleIds);

        if (!lessons || lessons.length === 0) {
          return {
            courseId: course.id,
            courseTitle: course.title,
            enrollmentCount: enrollmentCount || 0,
            averageProgress: 0,
          };
        }

        const lessonIds = lessons.map(l => l.id);
        const totalLessons = lessonIds.length;

        // Para cada aluno inscrito, calcular progresso
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('user_id')
          .eq('course_id', course.id);

        if (!enrollments || enrollments.length === 0) {
          return {
            courseId: course.id,
            courseTitle: course.title,
            enrollmentCount: 0,
            averageProgress: 0,
          };
        }

        const userIds = enrollments.map(e => e.user_id);
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('user_id, lesson_id')
          .in('user_id', userIds)
          .in('lesson_id', lessonIds);

        // Calcular progresso por usuário
        const userProgress: Record<string, number> = {};
        progressData?.forEach((p) => {
          if (!userProgress[p.user_id]) {
            userProgress[p.user_id] = 0;
          }
          userProgress[p.user_id]++;
        });

        // Calcular média
        const progressValues = Object.values(userProgress).map(count => 
          Math.round((count / totalLessons) * 100)
        );
        const averageProgress = progressValues.length > 0
          ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
          : 0;

        return {
          courseId: course.id,
          courseTitle: course.title,
          enrollmentCount: enrollmentCount || 0,
          averageProgress,
        };
      });

      const stats = await Promise.all(statsPromises);

      return {
        courses,
        stats,
      };
    },
    enabled: !!user,
  });
}

