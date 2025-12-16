import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, Settings, Menu, ChevronsUpDown, Check, Plus, Compass, Search, MessageSquare, Bell, Moon, Sun, Users, LayoutGrid, BookmarkCheck } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/use-user-role";
import { useProfile } from "@/hooks/use-profile";
import { getAvatarUrl } from "@/lib/avatar-utils";

const baseNavigation = [
  { name: "Comunidade", href: "/", icon: Users },
  { name: "Classroom", href: "/courses", icon: LayoutGrid },
  { name: "Salvos", href: "/saved", icon: BookmarkCheck },
];

import { ChatDropdown } from "@/components/chat-dropdown";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { useSelectedCommunity } from "@/contexts/community-context";
import { useUserCommunities } from "@/hooks/use-communities";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { selectedCommunity, setSelectedCommunity, isLoading: communityLoading, communitySlug } = useSelectedCommunity();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const { data: communities = [], isLoading: communitiesLoading } = useUserCommunities();
  const { data: profile } = useProfile();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Helper para adicionar prefixo /c/:slug aos links quando uma comunidade está selecionada
  const getLinkWithCommunity = (href: string) => {
    if (communitySlug && !href.startsWith('/admin') && !href.startsWith('/login') && !href.startsWith('/register')) {
      return `/c/${communitySlug}${href === '/' ? '' : href}`;
    }
    return href;
  };

  const navigation = isAdmin === true
    ? [...baseNavigation, { name: "Admin Panel", href: "/admin", icon: Settings }]
    : baseNavigation;

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado',
    });
    setLocation('/login');
  };

  const currentUser = user ? {
    name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
    avatar: getAvatarUrl(profile?.avatar_url || user.user_metadata?.avatar_url, profile?.name || user.user_metadata?.name || user.email) || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user.user_metadata?.name || user.email || 'U')}`,
    isPremium: false, // TODO: implementar verificação de premium
  } : null;
  
  // Collapse by default, manual toggle
  const isCollapsed = !isSidebarExpanded;

  const SidebarContent = ({ forceExpanded = false }: { forceExpanded?: boolean }) => {
    const collapsed = isCollapsed && !forceExpanded;
    
    // Fallback para quando selectedCommunity é null ou ainda está carregando
    const displayCommunity = selectedCommunity || (communityLoading ? {
      id: 'loading',
      name: 'Carregando...',
      icon: '⏳',
    } : {
      id: 'default',
      name: 'Comunidade',
      icon: '👥',
    });

    return (
    <div 
        className="flex h-full flex-col bg-sidebar border-r border-sidebar-border/50 bg-card transition-all duration-300"
        onClick={() => !forceExpanded && setIsSidebarExpanded(true)}
    >
      {/* Community Switcher */}
      <div className={cn("flex h-16 items-center border-b border-border/40", collapsed ? "justify-center px-2" : "px-4")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn("hover:bg-muted/50", collapsed ? "h-10 w-10 p-0 rounded-full justify-center" : "w-full justify-between px-2")}>
              <div className="flex items-center gap-2 font-heading font-bold text-sm tracking-tight text-primary truncate">
                 <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">
                    {displayCommunity.slug === 'zona' ? 'ZN' : (displayCommunity.logo_data ? '📷' : '👥')}
                 </div>
                 {!collapsed && <span className="truncate">{displayCommunity.name}</span>}
              </div>
              {!collapsed && <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="start" side={collapsed ? "right" : "bottom"}>
            <div className="p-2">
               <Input placeholder="Pesquisar" className="h-8 text-xs" />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 text-muted-foreground"
              onClick={() => {
                setLocation(getLinkWithCommunity('/admin/communities'));
                setIsMobileOpen(false);
              }}
            >
                <Plus className="h-4 w-4" /> Criar comunidade
            </DropdownMenuItem>
             <DropdownMenuItem className="gap-2 text-muted-foreground">
                <Compass className="h-4 w-4" /> Descobrir comunidades
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {communitiesLoading ? (
              <DropdownMenuItem disabled className="gap-2">
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </DropdownMenuItem>
            ) : communities.length === 0 ? (
              <DropdownMenuItem disabled className="gap-2">
                <span className="text-sm text-muted-foreground">Nenhuma comunidade</span>
              </DropdownMenuItem>
            ) : (
              communities.map((comm) => (
              <DropdownMenuItem 
                key={comm.id} 
                onClick={() => setSelectedCommunity(comm)}
                className="gap-2"
              >
                <div className="h-5 w-5 rounded bg-muted flex items-center justify-center text-xs">
                    {comm.slug === 'zona' ? 'ZN' : (comm.logo_data ? '📷' : '👥')}
                </div>
                <span className="flex-1 truncate">{comm.name}</span>
                  {selectedCommunity && selectedCommunity.id === comm.id && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className={cn("flex-1 py-6", collapsed ? "px-2" : "px-4")}>
        <nav className="flex flex-col gap-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const linkHref = getLinkWithCommunity(item.href);
            const isActive = location === linkHref || location === item.href;
            return (
              <Link
                key={item.name}
                href={linkHref}
                className={cn(
                  "flex items-center rounded-md text-sm font-medium transition-all duration-200 group relative",
                  collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-primary/5 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={(e) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/f7f539cc-af4e-42c4-bdaa-abc176a59b89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:133',message:'Navigation link clicked',data:{itemName:item.name,itemHref:item.href,currentLocation:location,isActive},timestamp:Date.now(),sessionId:'debug-session',runId:'audit1',hypothesisId:'C'})}).catch(()=>{});
                  // #endregion
                  setIsMobileOpen(false);
                }}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className={cn("border-t border-border/40", collapsed ? "p-2" : "p-4")}>
        {currentUser && (
          <>
            <div className={cn("flex items-center rounded-lg bg-muted/30 mb-3", collapsed ? "justify-center p-0 bg-transparent" : "gap-3 p-2")}>
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{currentUser.name[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser.isPremium ? "Membro Premium" : "Plano Gratuito"}
                  </p>
                </div>
              )}
            </div>
            <div className={cn("grid gap-2", collapsed ? "grid-cols-1" : "grid-cols-2")}>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn("text-xs text-muted-foreground", collapsed ? "h-8 w-full justify-center px-0" : "w-full justify-start px-2 h-8")}
                onClick={() => setLocation(getLinkWithCommunity('/profile'))}
              >
                <Settings className={cn("h-3 w-3", !collapsed && "mr-2")} />
                {!collapsed && "Config"}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className={cn("text-xs text-muted-foreground hover:text-destructive", collapsed ? "h-8 w-full justify-center px-0" : "w-full justify-start px-2 h-8")}
              >
                <LogOut className={cn("h-3 w-3", !collapsed && "mr-2")} />
                {!collapsed && "Sair"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside 
        className={cn("hidden md:block shrink-0 h-screen sticky top-0 z-30 transition-all duration-300", isCollapsed ? "w-[70px]" : "w-64")}
      >
        <div className="h-full relative group">
           <SidebarContent />
           {!isCollapsed && (
             <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-1/2 -right-3 z-50 h-6 w-6 rounded-full border shadow-md bg-background hidden group-hover:flex"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsSidebarExpanded(false);
                }}
             >
                <ChevronsUpDown className="h-3 w-3 rotate-90" />
             </Button>
           )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r border-border">
          <SidebarContent forceExpanded={true} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden h-14 border-b flex items-center px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setIsMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold ml-2">Aurius</span>
        </div>

        {/* Desktop Top Bar */}
        <div className="hidden md:flex h-16 items-center px-8 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 relative">
            <div className="w-full max-w-xl absolute left-1/2 -translate-x-1/2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar" 
                  className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 h-10"
                />
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                <ChatDropdown />
                <NotificationDropdown />
                
                {currentUser && (
                  <Avatar className="h-9 w-9 border border-border ml-2">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>{currentUser.name[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                )}
            </div>
        </div>

        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
