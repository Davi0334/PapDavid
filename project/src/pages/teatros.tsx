import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { Search } from 'lucide-react';

export const Teatros: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <MobileWrapper
      title="ServeFirst"
      showBackButton={false}
    >
      {/* Campo de Pesquisa */}
      <div className="mb-4 flex items-center">
        <div className="flex items-center bg-gray-100 rounded-full p-2 flex-1">
          <input
            type="text"
            placeholder="Buscar por grupo ou ID"
            className="bg-transparent border-none w-full focus:outline-none px-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="bg-[#FF7F7F] text-white p-2 rounded-full">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Card com informações do teatro */}
      <Link to="/criar-grupo">
        <div className="bg-[#FF7F7F] text-white rounded-lg p-5 mb-4">
          <h2 className="text-xl font-semibold mb-1">Título</h2>
          <p className="mb-1">Roteiro</p>
          <p className="mb-4">Data de Apresentação</p>
          
          {/* Botão de adicionar */}
          <div className="flex justify-start">
            <button className="bg-white rounded-full p-2 shadow">
              <svg className="h-6 w-6 text-[#FF7F7F]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </Link>
    </MobileWrapper>
  );
};