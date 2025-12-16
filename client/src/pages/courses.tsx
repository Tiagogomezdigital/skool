import { useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlayCircle, Search, Filter, Loader2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useCourses, useEnrollments, useEnrollInCourse, useIsEnrolled } from "@/hooks/use-courses";
import { useCourseProgress } from "@/hooks/use-course-content";
import { useToast } from "@/hooks/use-toast";
import { useHasCourseAccess } from "@/hooks/use-course-invites";
import { Skeleton } from "@/components/ui/skeleton";

export default function Courses() {
  const [location, setLocation] = useLocation();
  const { data: courses, isLoading, error } = useCourses();
  const { data: enrolledCourseIds = [] } = useEnrollments();
  
  // Debug: Log dos cursos carregados
  useEffect(() => {
    if (!isLoading) {
      console.log('📊 Courses Page - Status:', {
        isLoading,
        hasError: !!error,
        error: error?.message,
        coursesCount: courses?.length || 0,
        courses: courses?.map(c => ({ id: c.id, title: c.title, community_id: c.community_id }))
      });
    }
  }, [courses, isLoading, error]);
  const enrollMutation = useEnrollInCourse();
  const { toast } = useToast();

  const handleEnroll = async (e: React.MouseEvent, courseId: number) => {
    e.stopPropagation();
    try {
      await enrollMutation.mutateAsync(courseId);
      toast({
        title: 'Inscrição realizada!',
        description: 'Você agora tem acesso ao curso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao se inscrever',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleCardClick = (course: any) => {
    const isEnrolled = enrolledCourseIds.includes(course.id);
    
    if (isEnrolled) {
      setLocation(`/courses/${course.id}`);
      return;
    }

    // Se curso está bloqueado, redirecionar para página de compra
    if (course.is_locked) {
      setLocation(`/purchase?courseId=${course.id}`);
      return;
    }

    // Curso não bloqueado, permitir inscrição direta
    handleEnroll({ stopPropagation: () => {} } as any, course.id);
  };

  const handlePurchaseClick = (e: React.MouseEvent, courseId: number) => {
    e.stopPropagation();
    setLocation(`/purchase?courseId=${courseId}`);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Classroom</h1>
          <p className="text-muted-foreground mt-2">Seus treinamentos e materiais exclusivos.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9 h-9 bg-muted/50" />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Filter className="h-4 w-4" />
            </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-full flex flex-col overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            const CourseProgress = ({ courseId }: { courseId: number }) => {
              const { progress } = useCourseProgress(courseId);
              return (
                <>
                  <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </>
              );
            };

            const statusBadge = () => {
              if (isEnrolled) {
                return { text: 'INSCRITO', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
              }
              if (course.is_locked) {
                return { text: 'BLOQUEADO', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
              }
              return { text: 'GRATUITO', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
            };

            const badge = statusBadge();

            return (
              <div 
                key={course.id} 
                onClick={() => handleCardClick(course)}
                className="cursor-pointer"
              >
                <Card className="h-full flex flex-col overflow-hidden border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
                  <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-black" />
                    {course.is_locked && !isEnrolled && (
                      <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                        <Lock className="h-12 w-12 text-white/80" />
                      </div>
                    )}
                    <h3 className="relative z-10 font-heading font-black text-2xl text-white text-center px-4 uppercase transform -rotate-2 group-hover:rotate-0 transition-transform duration-300">
                      {course.image_text || course.title.substring(0, 10).toUpperCase()}
                    </h3>
                    {!course.is_locked && (
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                        <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <PlayCircle className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="px-4 pt-4 pb-2 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${badge.className}`}>
                        {badge.text}
                      </span>
                      <h3 className="font-heading font-bold text-sm leading-tight truncate flex-1">
                        {course.title}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {course.description || 'Sem descrição'}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="px-4 py-3 bg-muted/10 border-t border-border/30 mt-auto">
                    {isEnrolled ? (
                      <div className="w-full space-y-1.5">
                        <CourseProgress courseId={course.id} />
                      </div>
                    ) : course.is_locked ? (
                      <Button 
                        className="w-full text-xs h-8"
                        onClick={(e) => handlePurchaseClick(e, course.id)}
                      >
                        <Lock className="mr-2 h-3 w-3" />
                        Comprar Curso
                      </Button>
                    ) : (
                      <Button 
                        className="w-full text-xs h-8"
                        onClick={(e) => handleEnroll(e, course.id)}
                        disabled={enrollMutation.isPending}
                      >
                        {enrollMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Inscrevendo...
                          </>
                        ) : (
                          'Inscrever-se Gratuitamente'
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum curso disponível no momento.</p>
        </div>
      )}
    </div>
  );
}
