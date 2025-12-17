import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  FileVideo, 
  FolderOpen, 
  Settings, 
  Home,
  ChevronRight,
  Menu,
  LogOut,
  Users as UsersIcon
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const adminNavigation = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Comunidades", href: "/admin/communities", icon: UsersIcon },
  { name: "Cursos", href: "/admin/courses", icon: BookOpen },
  { name: "Módulos e Aulas", href: "/admin/modules", icon: FolderOpen },
  { name: "Media Library", href: "/admin/media", icon: FileVideo },
  { name: "Configurações", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado',
    });
    setLocation('/login');
  };

  const currentUser = user ? {
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Admin',
    avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.name || user.email || 'A')}`,
  } : null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 z-30 border-r border-border/40 bg-card">
        <div className="h-full flex flex-col">
          {/* Logo/Header */}
          <div className="h-16 border-b border-border/40 flex items-center px-6">
            <Link href="/admin">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  A
                </div>
                <span className="font-heading font-bold text-lg">Admin Panel</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-6">
            <nav className="flex flex-col gap-1 px-4">
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={cn(
                        "flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-200 px-3 py-2.5",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                      {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </a>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User Section */}
          <div className="border-t border-border/40 p-4">
            {currentUser && (
              <>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 mb-3">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>{currentUser.name[0]?.toUpperCase() || 'A'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground truncate">Administrador</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <Link href="/">Voltar ao Site</Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Sair
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r border-border">
          <div className="h-full flex flex-col">
            <div className="h-16 border-b border-border/40 flex items-center px-6">
              <span className="font-heading font-bold text-lg">Admin Panel</span>
            </div>
            <ScrollArea className="flex-1 py-6">
              <nav className="flex flex-col gap-1 px-4">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
                  return (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={cn(
                          "flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-200 px-3 py-2.5",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.name}</span>
                      </a>
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden h-14 border-b flex items-center px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setIsMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold ml-2">Admin Panel</span>
        </div>

        {/* Desktop Top Bar */}
        <div className="hidden md:flex h-16 items-center px-8 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl font-heading font-semibold">Painel Administrativo</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/">Voltar ao Site</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

