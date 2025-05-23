import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight, Calendar, Theater } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-prod';

// Adicione estilo global para garantir scroll vertical
const styleFixScroll = `
  <style>
    body, html, #root {
      height: auto !important;
      min-height: 100% !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      position: relative !important;
    }
    
    .events-container {
      padding-bottom: 800px !important;
      overflow-y: visible !important;
    }
    
    .mobile-content-container {
      overflow-x: hidden !important;
      overflow-y: auto !important;
      max-width: 100% !important;
      width: 100% !important;
      height: auto !important;
      min-height: auto !important;
    }
    
    .mobile-wrapper-fix {
      overflow-y: auto !important;
      height: auto !important;
      min-height: auto !important;
    }
  </style>
`;

type Teatro = {
  id: string;
  titulo: string;
  descricao: string;
  diasEnsaio: string[];
  dataApresentacao: string;
  participantes: string[];
  criador: string;
};

// Componente de calendário interativo
const InteractiveCalendar = ({ onDateSelect, eventDates }: { onDateSelect: (date: Date) => void, eventDates: Date[] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Função para formatar nome do mês/ano
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };
  
  // Obter dias da semana
  const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  
  // Função para ir para o mês anterior
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  
  // Função para ir para o próximo mês
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  
  // Calcular dias do calendário para o mês atual
  const getDaysArray = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Dia da semana do primeiro dia (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
    let firstDayOfWeek = firstDay.getDay();
    // Ajustar para que Segunda seja o dia 0
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Dias do mês anterior para preencher a primeira semana
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const daysArray = [];
    let week = [];
    
    // Adicionar dias do mês anterior
    for (let i = 0; i < firstDayOfWeek; i++) {
      week.push({
        day: prevMonthLastDay - firstDayOfWeek + i + 1,
        month: 'prev',
        date: new Date(year, month - 1, prevMonthLastDay - firstDayOfWeek + i + 1)
      });
    }
    
    // Adicionar dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      if (week.length === 7) {
        daysArray.push(week);
        week = [];
      }
      week.push({
        day: i,
        month: 'current',
        date: new Date(year, month, i)
      });
    }
    
    // Adicionar dias do próximo mês
    const remainingDays = 7 - week.length;
    if (remainingDays > 0) {
      for (let i = 1; i <= remainingDays; i++) {
        week.push({
          day: i,
          month: 'next',
          date: new Date(year, month + 1, i)
        });
      }
      daysArray.push(week);
    }
    
    return daysArray;
  };
  
  // Verificar se uma data é hoje
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // Verificar se uma data é selecionada
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };
  
  // Verificar se um dia tem evento
  const hasEvent = (date: Date) => {
    return eventDates.some(eventDate => 
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
    );
  };
  
  // Manipulador de clique em uma data
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };
  
  const daysArray = getDaysArray();
  
  return (
    <div className="mb-6 bg-white rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold capitalize">{formatMonthYear(currentDate)}</h2>
        <div className="flex gap-2">
          <button 
            onClick={goToPreviousMonth}
            className="text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={goToNextMonth}
            className="text-gray-500 hover:text-gray-700"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-xs font-medium">
            {day}
          </div>
        ))}
      </div>
      
      {/* Dias do mês */}
      <div className="space-y-1">
        {daysArray.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 text-center">
            {week.map((dayObj, dayIndex) => {
              // Estilos de acordo com o tipo de dia
              let dayClass = "rounded-full w-9 h-9 flex items-center justify-center text-sm cursor-pointer relative";
              
              if (dayObj.month === 'current') {
                if (isSelected(dayObj.date)) {
                  dayClass += " bg-[#FF7F7F] text-white";
                } else if (isToday(dayObj.date)) {
                  dayClass += " bg-blue-100 text-blue-800 border border-blue-300";
                } else {
                  dayClass += " bg-white text-black border border-gray-200 hover:bg-gray-100";
                }
                
                // Adicionar indicador de evento
                if (hasEvent(dayObj.date)) {
                  dayClass += " font-bold";
                }
              } else {
                dayClass += " text-gray-400 border border-gray-100";
              }
              
              return (
                <div 
                  key={`${weekIndex}-${dayIndex}`} 
                  className={dayClass}
                  onClick={() => dayObj.month === 'current' && handleDateClick(dayObj.date)}
                >
                  {dayObj.day}
                  {hasEvent(dayObj.date) && dayObj.month === 'current' && (
                    <span className="absolute h-1 w-1 bg-[#FF7F7F] rounded-full -bottom-0.5 left-1/2 transform -translate-x-1/2"></span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Função auxiliar para formatar a data
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return dateString; // Retorna a string original se não for possível formatar
  }
};

// Função para verificar se um evento ocorre em uma data específica
const isEventOnDate = (eventDate: string, selectedDate: Date): boolean => {
  try {
    const date = new Date(eventDate);
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  } catch (error) {
    return false;
  }
};

export function Eventos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teatros, setTeatros] = useState<Teatro[]>([]);
  const [filteredTeatros, setFilteredTeatros] = useState<Teatro[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [eventDates, setEventDates] = useState<Date[]>([]);

  // Injetar estilos para garantir scroll
  useEffect(() => {
    // Adiciona o estilo ao head se não existir
    if (!document.querySelector('#fix-scroll-eventos')) {
      const styleEl = document.createElement('div');
      styleEl.id = 'fix-scroll-eventos';
      styleEl.innerHTML = styleFixScroll;
      document.head.appendChild(styleEl);
    }
    
    // Remover quando o componente for desmontado
    return () => {
      const styleEl = document.querySelector('#fix-scroll-eventos');
      if (styleEl) styleEl.remove();
    };
  }, []);

  useEffect(() => {
    carregarTeatros();
  }, [user]);

  const carregarTeatros = async () => {
    if (!user) {
      setTeatros([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Buscar teatros
      const teatrosRef = collection(db, 'teatros');
      const q = query(teatrosRef, where('participantes', 'array-contains', user.uid));
      const docs = await getDocs(q);
      
      const teatrosDoUsuario: Teatro[] = [];
      docs.forEach((doc) => {
        const data = doc.data() as Teatro;
        teatrosDoUsuario.push({ ...data, id: doc.id });
      });
      
      setTeatros(teatrosDoUsuario);
      
      // Extrair datas dos eventos para o calendário
      const datas = teatrosDoUsuario
        .filter(teatro => teatro.dataApresentacao)
        .map(teatro => new Date(teatro.dataApresentacao));
      
      setEventDates(datas);
    } catch (error) {
      console.error('Erro ao carregar teatros:', error);
      
      // Dados de exemplo para desenvolvimento
      const dataAtual = new Date();
      const teatrosExemplo: Teatro[] = [
        {
          id: "teatro1",
          titulo: "Teatro Criado:",
          descricao: "Descrição do teatro",
          diasEnsaio: ["Terça", "Quinta"],
          dataApresentacao: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 18).toISOString(),
          participantes: [],
          criador: user.uid
        },
        {
          id: "teatro2",
          titulo: "Título",
          descricao: "Descrição do teatro",
          diasEnsaio: ["Segunda", "Quarta"],
          dataApresentacao: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 15).toISOString(),
          participantes: [],
          criador: "outro"
        },
        {
          id: "teatro3",
          titulo: "Título",
          descricao: "Descrição do teatro",
          diasEnsaio: ["Sexta"],
          dataApresentacao: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 22).toISOString(),
          participantes: [],
          criador: "outro"
        }
      ];
      
      setTeatros(teatrosExemplo);
      
      // Extrair datas dos eventos para o calendário
      const datas = teatrosExemplo
        .filter(teatro => teatro.dataApresentacao)
        .map(teatro => new Date(teatro.dataApresentacao));
      
      setEventDates(datas);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar teatros quando data selecionada muda
  useEffect(() => {
    if (teatros.length > 0) {
      const teatrosFiltrados = teatros.filter(teatro => 
        isEventOnDate(teatro.dataApresentacao, selectedDate)
      );
      setFilteredTeatros(teatrosFiltrados);
    }
  }, [selectedDate, teatros]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <MobileWrapper 
      title="Eventos" 
      showBackButton={false} 
      showBottomNav={true}
      fullHeight={false}
      safeArea={true}
    >
      <div className="events-container" style={{
        marginBottom: '60px'
      }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '40px 0' 
          }}>
            <Loader2 size={32} style={{
              color: '#FF7F7F',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : (
          <>
            {/* Calendário interativo */}
            <InteractiveCalendar onDateSelect={handleDateSelect} eventDates={eventDates} />
            
            {/* Lista de Apresentações na data selecionada */}
            <div style={{ 
              marginBottom: '20px',
              padding: '0 12px' 
            }}>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calendar size={18} />
                Apresentações em {formatDate(selectedDate.toISOString())}
              </h2>
              
              {filteredTeatros.length === 0 ? (
                <div style={{ 
                  backgroundColor: '#f9f9f9', 
                  borderRadius: '8px', 
                  padding: '15px', 
                  textAlign: 'center',
                  color: '#777'
                }}>
                  Não há apresentações programadas para esta data.
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px'
                }}>
                  {filteredTeatros.map(teatro => (
                    <Link 
                      to={`/teatro/${teatro.id}`} 
                      key={teatro.id} 
                      style={{
                        display: 'block',
                        textDecoration: 'none'
                      }}
                    >
                      <div style={{
                        backgroundColor: '#FF7F7F',
                        borderRadius: '8px',
                        padding: '15px',
                        color: 'white',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start'
                        }}>
                          <Theater size={18} style={{
                            marginRight: '10px',
                            marginTop: '3px',
                            flexShrink: 0
                          }} />
                          <div style={{
                            width: 'calc(100% - 28px)'
                          }}>
                            <h3 style={{
                              fontSize: '18px',
                              fontWeight: '500',
                              margin: '0 0 5px 0'
                            }}>
                              {teatro.titulo}
                            </h3>
                            {teatro.descricao && (
                              <p style={{
                                fontSize: '14px',
                                margin: '0 0 5px 0'
                              }}>
                                {teatro.descricao}
                              </p>
                            )}
                            <p style={{
                              fontSize: '14px',
                              margin: 0
                            }}>
                              Horário: {new Date(teatro.dataApresentacao).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Lista de todas as apresentações */}
            <div style={{ 
              marginBottom: '20px',
              padding: '0 12px'  
            }}>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '12px'
              }}>
                Todas as Apresentações
              </h2>
              
              {teatros.length === 0 ? (
                <div style={{ 
                  backgroundColor: '#f9f9f9', 
                  borderRadius: '8px', 
                  padding: '15px', 
                  textAlign: 'center',
                  color: '#777'
                }}>
                  Você não tem apresentações programadas.
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px'
                }}>
                  {teatros
                    .filter((teatro: Teatro) => teatro.dataApresentacao)
                    .sort((a: Teatro, b: Teatro) => new Date(a.dataApresentacao).getTime() - new Date(b.dataApresentacao).getTime())
                    .map((teatro: Teatro) => (
                      <Link 
                        to={`/teatro/${teatro.id}`} 
                        key={teatro.id} 
                        style={{
                          display: 'block',
                          textDecoration: 'none'
                        }}
                      >
                        <div style={{
                          backgroundColor: '#FF7F7F',
                          borderRadius: '8px',
                          padding: '15px',
                          color: 'white',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '500',
                            margin: '0 0 5px 0'
                          }}>
                            {teatro.titulo}
                          </h3>
                          <p style={{
                            fontSize: '14px',
                            margin: '0 0 3px 0'
                          }}>
                            Data: {formatDate(teatro.dataApresentacao)}
                          </p>
                          <p style={{
                            fontSize: '14px',
                            margin: 0
                          }}>
                            Horário: {new Date(teatro.dataApresentacao).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </div>
            
            {/* Garantir espaço para scroll - extremamente grande */}
            <div style={{ height: '800px' }}></div>
          </>
        )}
      </div>
    </MobileWrapper>
  );
}