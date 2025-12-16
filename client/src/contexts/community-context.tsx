import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useCommunityBySlug, type Community } from '@/hooks/use-communities';

interface CommunityContextType {
  selectedCommunity: Community | null;
  isLoading: boolean;
  communitySlug: string | null;
  setSelectedCommunity: (community: Community | null) => void;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

// Extrair slug da URL (formato /c/:slug)
function extractSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname;
  
  // Verificar se está no formato /c/:slug
  const match = pathname.match(/^\/c\/([^\/]+)/);
  if (match) {
    return match[1];
  }
  
  // Fallback: tentar pegar do localStorage (para desenvolvimento)
  return localStorage.getItem('selectedCommunity') || null;
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [communitySlug, setCommunitySlug] = useState<string | null>(() => {
    return extractSlugFromUrl();
  });

  const { data: community, isLoading } = useCommunityBySlug(communitySlug);
  const [selectedCommunity, setSelectedCommunityState] = useState<Community | null>(null);

  // Atualizar slug quando a URL mudar
  useEffect(() => {
    const newSlug = extractSlugFromUrl();
    if (newSlug !== communitySlug) {
      setCommunitySlug(newSlug);
    }
  }, [location, communitySlug]);

  // Atualizar comunidade quando dados carregarem
  useEffect(() => {
    if (community) {
      setSelectedCommunityState(community);
      // Salvar no localStorage para desenvolvimento local
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedCommunity', community.slug);
      }
    } else if (!isLoading && communitySlug) {
      // Se não encontrou comunidade mas tinha slug, limpar
      setSelectedCommunityState(null);
    }
  }, [community, isLoading, communitySlug]);

  const setSelectedCommunity = (community: Community | null) => {
    setSelectedCommunityState(community);
    if (community) {
      setCommunitySlug(community.slug);
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedCommunity', community.slug);
        // Navegar para /c/:slug se não estiver nessa rota
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith(`/c/${community.slug}`)) {
          setLocation(`/c/${community.slug}`);
        }
      }
    } else {
      setCommunitySlug(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedCommunity');
      }
    }
  };

  return (
    <CommunityContext.Provider value={{ 
      selectedCommunity, 
      isLoading, 
      communitySlug,
      setSelectedCommunity 
    }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useSelectedCommunity() {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useSelectedCommunity must be used within a CommunityProvider');
  }
  return context;
}

