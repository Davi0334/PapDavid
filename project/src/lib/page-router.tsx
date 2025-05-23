import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Sequência de páginas para criação de grupo
export const CREATION_SEQUENCE = [
  {
    route: '/criar-grupo',
    name: 'Informações Básicas'
  },
  {
    route: '/descricao-grupo/:id',
    name: 'Atores e Figurino',
    fields: ['quantidadeAtores', 'figurino']
  },
  {
    route: '/descricao-atos/:id',
    name: 'Atos e Roteiro',
    fields: ['quantidadeAtos', 'roteiro']
  },
  {
    route: '/descricao-cenas/:id',
    name: 'Cenas e Cenários',
    fields: ['quantidadeCenas', 'cenario']
  },
  {
    route: '/convidar-participantes/:id',
    name: 'Convidar Participantes'
  }
];

// Função para obter a próxima página na sequência
export function getNextPage(currentRoute: string, id?: string): string {
  const currentIndex = CREATION_SEQUENCE.findIndex(page => 
    currentRoute.startsWith(page.route.split('/:')[0])
  );
  
  if (currentIndex === -1 || currentIndex >= CREATION_SEQUENCE.length - 1) {
    return '/';
  }
  
  const nextPage = CREATION_SEQUENCE[currentIndex + 1];
  return id ? nextPage.route.replace(':id', id) : nextPage.route;
}

// Hook para gerenciar a navegação entre páginas de criação
export function useCreationFlow(currentRoute: string, id?: string) {
  const navigate = useNavigate();
  const [currentPageIndex, setCurrentPageIndex] = useState(-1);

  useEffect(() => {
    // Encontrar o índice da página atual na sequência
    const index = CREATION_SEQUENCE.findIndex(page => 
      currentRoute.startsWith(page.route.split('/:')[0])
    );
    setCurrentPageIndex(index);
  }, [currentRoute]);

  const goToNextPage = (id?: string) => {
    if (currentPageIndex === -1 || currentPageIndex >= CREATION_SEQUENCE.length - 1) {
      navigate('/');
      return;
    }
    
    const nextPage = CREATION_SEQUENCE[currentPageIndex + 1];
    navigate(id ? nextPage.route.replace(':id', id) : nextPage.route);
  };

  return {
    currentPage: currentPageIndex !== -1 ? CREATION_SEQUENCE[currentPageIndex] : null,
    nextPage: currentPageIndex < CREATION_SEQUENCE.length - 1 ? CREATION_SEQUENCE[currentPageIndex + 1] : null,
    goToNextPage,
    isLastPage: currentPageIndex === CREATION_SEQUENCE.length - 1
  };
} 