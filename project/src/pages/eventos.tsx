import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, CalendarDays, Theater, Clock, Users, ChevronLeft, ChevronRight, Sparkles, Star, MapPin, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-prod';
import BottomNav from '../components/bottom-nav';

type Teatro = {
  id: string;
  titulo: string;
  descricao: string;
  diasEnsaio: string[];
  dataApresentacao: string;
  participantes: string[];
  criador: string;
};

// Componente de calendário futurístico
const FuturisticCalendar = ({ onDateSelect, eventDates }: { onDateSelect: (date: Date) => void, eventDates: Date[] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };
  
  const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  
  const getDaysArray = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const daysArray = [];
    let week = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      week.push({
        day: prevMonthLastDay - firstDayOfWeek + i + 1,
        month: 'prev',
        date: new Date(year, month - 1, prevMonthLastDay - firstDayOfWeek + i + 1)
      });
    }
    
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
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };
  
  const hasEvent = (date: Date) => {
    return eventDates.some(eventDate => 
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
    );
  };
  
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };
  
  const daysArray = getDaysArray();
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '20px'
    }}>
      {/* Elemento decorativo */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.1))',
        borderRadius: '50%',
        animation: 'float 5s ease-in-out infinite'
      }} />
      
      {/* Header do calendário */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
            borderRadius: '12px',
            padding: '8px'
          }}>
            <CalendarDays size={20} color="white" />
          </div>
          <h2 style={{
            color: '#333',
            fontSize: '20px',
            fontWeight: '700',
            margin: 0,
            textTransform: 'capitalize'
          }}>{formatMonthYear(currentDate)}</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={goToPreviousMonth}
            style={{
              background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.5))',
              border: 'none',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <ChevronLeft size={20} style={{ color: '#fc6c5f' }} />
          </button>
          <button 
            onClick={goToNextMonth}
            style={{
              background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.5))',
              border: 'none',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <ChevronRight size={20} style={{ color: '#fc6c5f' }} />
          </button>
        </div>
      </div>
      
      {/* Dias da semana */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        {daysOfWeek.map(day => (
          <div key={day} style={{
            color: '#666',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '8px 0'
          }}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Dias do mês */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {daysArray.map((week, weekIndex) => (
          <div key={weekIndex} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px',
            textAlign: 'center'
          }}>
            {week.map((dayObj, dayIndex) => {
              const isCurrentMonth = dayObj.month === 'current';
              const isDayToday = isToday(dayObj.date);
              const isDaySelected = isSelected(dayObj.date);
              const dayHasEvent = hasEvent(dayObj.date);
              
              return (
                <div 
                  key={`${weekIndex}-${dayIndex}`} 
                  onClick={() => isCurrentMonth && handleDateClick(dayObj.date)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: isDayToday || isDaySelected ? '700' : '500',
                    cursor: isCurrentMonth ? 'pointer' : 'default',
                    background: isDaySelected ? 'linear-gradient(135deg, #fc6c5f, #ff8a7a)' :
                               isDayToday ? 'linear-gradient(135deg, rgba(252, 108, 95, 0.2), rgba(255, 255, 255, 0.8))' :
                               dayHasEvent && isCurrentMonth ? 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.5))' :
                               'transparent',
                    color: isDaySelected ? 'white' :
                           isDayToday ? '#fc6c5f' :
                           isCurrentMonth ? '#333' : '#ccc',
                    border: isDayToday && !isDaySelected ? '2px solid #fc6c5f' : 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    boxShadow: isDaySelected ? '0 4px 15px rgba(252, 108, 95, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (isCurrentMonth && !isDaySelected) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.8))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isCurrentMonth && !isDaySelected) {
                      e.currentTarget.style.background = dayHasEvent ? 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.5))' : 'transparent';
                    }
                  }}
                >
                  {dayObj.day}
                  {dayHasEvent && isCurrentMonth && (
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      width: '6px',
                      height: '6px',
                      background: isDaySelected ? 'rgba(255, 255, 255, 0.8)' : '#fc6c5f',
                      borderRadius: '50%'
                    }} />
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

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  } catch (error) {
    return 'Data inválida';
  }
};

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
      const teatrosRef = collection(db, 'teatros');
      const q = query(teatrosRef, where('participantes', 'array-contains', user.uid));
      const docs = await getDocs(q);
      
      const teatrosDoUsuario: Teatro[] = [];
      docs.forEach((doc) => {
        const data = doc.data() as Teatro;
        teatrosDoUsuario.push({ ...data, id: doc.id });
      });
      
      setTeatros(teatrosDoUsuario);
      
      const datas = teatrosDoUsuario
        .filter(teatro => teatro.dataApresentacao)
        .map(teatro => new Date(teatro.dataApresentacao));
      
      setEventDates(datas);
    } catch (error) {
      console.error('Erro ao carregar teatros:', error);
      
      // Dados de exemplo
      const dataAtual = new Date();
      const teatrosExemplo: Teatro[] = [
        {
          id: "teatro1",
          titulo: "Romance de Shakespeare",
          descricao: "Peça clássica de romance",
          diasEnsaio: ["Terça", "Quinta"],
          dataApresentacao: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 18).toISOString(),
          participantes: [user?.uid || ''],
          criador: user?.uid || ''
        },
        {
          id: "teatro2",
          titulo: "Comédia Musical",
          descricao: "Espetáculo musical divertido",
          diasEnsaio: ["Segunda", "Quarta"],
          dataApresentacao: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 25).toISOString(),
          participantes: [user?.uid || ''],
          criador: "outro"
        }
      ];
      
      setTeatros(teatrosExemplo);
      
      const datas = teatrosExemplo
        .filter(teatro => teatro.dataApresentacao)
        .map(teatro => new Date(teatro.dataApresentacao));
      
      setEventDates(datas);
    } finally {
      setLoading(false);
    }
  };

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

  const renderEventCard = (teatro: Teatro, index: number) => (
    <div 
      key={teatro.id}
      onClick={() => navigate(`/teatro/${teatro.id}`)}
      style={{
        background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.95))',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid rgba(252, 108, 95, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        animation: `slideIn 0.6s ease-out ${index * 0.1}s both`
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Elemento decorativo */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        width: '40px',
        height: '40px',
        background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.2), rgba(255, 255, 255, 0.2))',
        borderRadius: '50%',
        animation: 'float 3s ease-in-out infinite'
      }} />
      
      {/* Header do evento */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
              borderRadius: '8px',
              padding: '6px',
              marginRight: '10px'
            }}>
              <Theater size={16} color="white" />
            </div>
            <span style={{
              color: '#666',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Apresentação
            </span>
          </div>
          <h3 style={{
            color: '#333',
            fontSize: '20px',
            fontWeight: '700',
            margin: 0,
            lineHeight: '1.2'
          }}>{teatro.titulo}</h3>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #22c55e, #4ade80)',
          borderRadius: '50%',
          width: '12px',
          height: '12px',
          animation: 'pulse 2s ease-in-out infinite',
          marginTop: '8px'
        }} />
      </div>
      
      {/* Informações do evento */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
            borderRadius: '10px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={16} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ 
              color: '#666', 
              fontSize: '12px', 
              margin: 0, 
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>Data & Hora</p>
            <p style={{ 
              color: '#333', 
              fontSize: '14px', 
              margin: 0, 
              fontWeight: '600' 
            }}>
              {formatDate(teatro.dataApresentacao)} às {new Date(teatro.dataApresentacao).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
            borderRadius: '10px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={16} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ 
              color: '#666', 
              fontSize: '12px', 
              margin: 0, 
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>Participantes</p>
            <p style={{ 
              color: '#333', 
              fontSize: '14px', 
              margin: 0, 
              fontWeight: '600' 
            }}>{teatro.participantes?.length || 0} pessoas</p>
          </div>
        </div>
      </div>
      
      {/* Botão de ação */}
      <div style={{ 
        marginTop: '16px', 
        paddingTop: '16px', 
        borderTop: '1px solid rgba(252, 108, 95, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={14} style={{ color: '#fc6c5f' }} />
          <span style={{ 
            color: '#fc6c5f', 
            fontSize: '12px', 
            fontWeight: '600' 
          }}>
            Clique para ver detalhes
          </span>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'white',
          boxShadow: '0 4px 12px rgba(252, 108, 95, 0.3)'
        }}>
          →
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fc6c5f 0%, #ff8a7a 25%, #ffb8a3 50%, #ffffff 75%, #f8f9fa 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientFlow 15s ease infinite',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Elementos decorativos de fundo */}
      <div style={{
        position: 'absolute',
        top: '12%',
        left: '8%',
        width: '70px',
        height: '70px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '12%',
        width: '50px',
        height: '50px',
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '25%',
        left: '6%',
        width: '60px',
        height: '60px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        animation: 'float 7s ease-in-out infinite'
      }} />

      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '20px 20px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
            borderRadius: '16px',
            padding: '12px',
            marginRight: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}>
            <Calendar size={24} style={{ color: '#fc6c5f' }} />
          </div>
          <h1 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: '800',
            margin: 0,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Eventos</h1>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 1px 5px rgba(0, 0, 0, 0.2)'
          }}>
            Seus eventos teatrais! 🎭
          </p>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '14px',
            fontWeight: '500',
            margin: '4px 0 0',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
          }}>
            Acompanhe apresentações e ensaios
          </p>
        </div>
      </div>
      
      {/* Conteúdo */}
      <div style={{
        maxWidth: '430px',
        margin: '0 auto',
        padding: '24px 20px 100px',
        position: 'relative',
        zIndex: 5
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(252, 108, 95, 0.3)',
              borderTop: '4px solid #fc6c5f',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }} />
            <p style={{
              color: '#666',
              fontSize: '16px',
              fontWeight: '500'
            }}>Carregando eventos...</p>
          </div>
        ) : (
          <>
            {/* Calendário */}
            <FuturisticCalendar onDateSelect={handleDateSelect} eventDates={eventDates} />
            
            {/* Eventos da data selecionada */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
                  borderRadius: '12px',
                  padding: '8px',
                  marginRight: '12px'
                }}>
                  <MapPin size={20} color="white" />
                </div>
                <h2 style={{
                  color: '#333',
                  fontSize: '20px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {selectedDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </h2>
              </div>
              
              {filteredTeatros.length === 0 ? (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1), rgba(255, 255, 255, 0.5))',
                  borderRadius: '16px',
                  padding: '30px',
                  textAlign: 'center',
                  border: '1px solid rgba(156, 163, 175, 0.2)'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #9ca3af, #d1d5db)',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>
                    <Calendar size={30} color="white" />
                  </div>
                  
                  <h3 style={{
                    color: '#333',
                    fontSize: '18px',
                    fontWeight: '700',
                    marginBottom: '10px'
                  }}>Sem eventos</h3>
                  
                  <p style={{
                    color: '#666',
                    fontSize: '16px',
                    lineHeight: '1.5'
                  }}>Não há apresentações programadas para esta data.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredTeatros.map((teatro, index) => renderEventCard(teatro, index))}
                </div>
              )}
            </div>
            
            {/* Todos os eventos */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
                  borderRadius: '12px',
                  padding: '8px',
                  marginRight: '12px'
                }}>
                  <Sparkles size={20} color="white" />
                </div>
                <h2 style={{
                  color: '#333',
                  fontSize: '20px',
                  fontWeight: '700',
                  margin: 0
                }}>Próximas Apresentações</h2>
              </div>
              
              {teatros.length === 0 ? (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.05), rgba(255, 255, 255, 0.5))',
                  borderRadius: '16px',
                  padding: '40px 30px',
                  textAlign: 'center',
                  border: '1px solid rgba(252, 108, 95, 0.1)'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
                    borderRadius: '50%',
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>
                    <Star size={40} color="white" />
                  </div>
                  
                  <h3 style={{
                    color: '#333',
                    fontSize: '20px',
                    fontWeight: '700',
                    marginBottom: '10px'
                  }}>Nenhum evento ainda</h3>
                  
                  <p style={{
                    color: '#666',
                    fontSize: '16px',
                    marginBottom: '25px',
                    lineHeight: '1.5'
                  }}>Você ainda não tem apresentações programadas. Participe de um teatro para ver eventos aqui!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {teatros
                    .filter((teatro: Teatro) => teatro.dataApresentacao)
                    .sort((a: Teatro, b: Teatro) => new Date(a.dataApresentacao).getTime() - new Date(b.dataApresentacao).getTime())
                    .map((teatro: Teatro, index: number) => renderEventCard(teatro, index))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <BottomNav />
      
      {/* Estilos CSS para animações */}
      <style>{`
        @keyframes gradientFlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}