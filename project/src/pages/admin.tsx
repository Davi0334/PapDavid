import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Shield, Search, User, Check, X, Plus, FileText, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { ref, query as dbQuery, get, orderByChild, equalTo, update, push, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserData = {
  id: string;
  email: string;
  role: string;
};

export function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchEmail, setSearchEmail] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [teatroId, setTeatroId] = useState<string>('');

  useEffect(() => {
    // Limpar mensagem após 5 segundos
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSearch = async () => {
    if (!searchEmail) {
      toast.error('Por favor, insira um email para buscar');
      return;
    }

    try {
      setLoading(true);
      const usersRef = ref(db, 'users');
      const q = dbQuery(usersRef, orderByChild('email'), equalTo(searchEmail));
      const snapshot = await get(q);
      
      const foundUsers: UserData[] = [];
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        foundUsers.push({
          id: childSnapshot.key || '',
          email: userData.email,
          role: userData.role || 'user'
        });
      });
      
      setUsers(foundUsers);
      
      if (foundUsers.length === 0) {
        toast.error('Nenhum usuário encontrado com este email');
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      toast.error('Erro ao buscar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      setLoading(true);
      const userRef = ref(db, `users/${userId}`);
      await update(userRef, {
        role: isAdmin ? 'admin' : 'user'
      });
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: isAdmin ? 'admin' : 'user' } : user
        )
      );
      
      toast.success(`Usuário ${isAdmin ? 'promovido a admin' : 'rebaixado a usuário normal'} com sucesso`);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error('Erro ao atualizar perfil do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExampleTeatro = async () => {
    try {
      setLoading(true);
      // Criar um novo teatro exemplo
      const teatrosRef = ref(db, 'teatros');
      const newTeatroRef = push(teatrosRef);
      
      const teatroData = {
        titulo: 'Teatro Exemplo',
        descricao: 'Este é um teatro de exemplo para testes',
        diasEnsaio: ['Segunda', 'Quarta'],
        dataApresentacao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias no futuro
        participantes: [user?.uid || ''],
        criador: user?.uid || '',
        dataCriacao: new Date().toISOString()
      };
      
      await set(newTeatroRef, teatroData);
      
      const teatroId = newTeatroRef.key;
      setTeatroId(teatroId || '');
      setMessage(`Teatro exemplo criado com sucesso! ID: ${teatroId}`);
      toast.success('Teatro exemplo criado com sucesso!');
    } catch (error) {
      console.error("Erro ao criar teatro exemplo:", error);
      toast.error('Erro ao criar teatro exemplo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSecondExampleTeatro = async () => {
    try {
      setLoading(true);
      // Criar um segundo teatro exemplo
      const teatrosRef = ref(db, 'teatros');
      const newTeatroRef = push(teatrosRef);
      
      const teatroData = {
        titulo: 'Segundo Teatro Exemplo',
        descricao: 'Este é outro teatro de exemplo para testes',
        diasEnsaio: ['Terça', 'Quinta'],
        dataApresentacao: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 dias no futuro
        participantes: [user?.uid || ''],
        criador: user?.uid || '',
        dataCriacao: new Date().toISOString()
      };
      
      await set(newTeatroRef, teatroData);
      
      const teatroId = newTeatroRef.key;
      setTeatroId(teatroId || '');
      setMessage(`Segundo teatro exemplo criado com sucesso! ID: ${teatroId}`);
      toast.success('Segundo teatro exemplo criado com sucesso!');
    } catch (error) {
      console.error("Erro ao criar segundo teatro exemplo:", error);
      toast.error('Erro ao criar segundo teatro exemplo');
    } finally {
      setLoading(false);
    }
  };

  const handleSetUserAsAdmin = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para realizar esta ação");
      return;
    }

    try {
      setLoading(true);
      
      // Referência para o usuário atual
      const userRef = ref(db, `users/${user.uid}`);
      
      // Atualizar o papel do usuário para admin
      await update(userRef, {
        role: 'admin'
      });
      
      setMessage(`Usuário ${user.email} definido como administrador com sucesso!`);
      toast.success('Você agora é um administrador!');
      
      // Recarregar a página para atualizar o estado do usuário
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Erro ao definir usuário como admin:", error);
      toast.error('Erro ao definir usuário como admin');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExampleEvento = async () => {
    if (!teatroId) {
      toast.error("Por favor, crie um teatro de exemplo primeiro");
      return;
    }
    
    try {
      setLoading(true);
      // Criar um evento exemplo
      const eventosRef = ref(db, 'eventos');
      const newEventoRef = push(eventosRef);
      
      const eventoData = {
        titulo: 'Ensaio Geral',
        descricao: 'Ensaio geral para a apresentação',
        data: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias no futuro
        horarioInicio: '18:00',
        horarioFim: '20:00',
        local: 'Sala 101',
        teatroId: teatroId
      };
      
      await set(newEventoRef, eventoData);
      
      setMessage(`Evento exemplo criado com sucesso! ID: ${newEventoRef.key}`);
      toast.success('Evento exemplo criado com sucesso!');
    } catch (error) {
      console.error("Erro ao criar evento exemplo:", error);
      toast.error('Erro ao criar evento exemplo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSecondExampleEvento = async () => {
    if (!teatroId) {
      toast.error("Por favor, crie um teatro de exemplo primeiro");
      return;
    }
    
    try {
      setLoading(true);
      // Criar um segundo evento exemplo
      const eventosRef = ref(db, 'eventos');
      const newEventoRef = push(eventosRef);
      
      const eventoData = {
        titulo: 'Reunião de Produção',
        descricao: 'Reunião para discutir detalhes da produção',
        data: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias no futuro
        horarioInicio: '14:00',
        horarioFim: '16:00',
        local: 'Sala de Reuniões',
        teatroId: teatroId
      };
      
      await set(newEventoRef, eventoData);
      
      setMessage(`Segundo evento exemplo criado com sucesso! ID: ${newEventoRef.key}`);
      toast.success('Segundo evento exemplo criado com sucesso!');
    } catch (error) {
      console.error("Erro ao criar segundo evento exemplo:", error);
      toast.error('Erro ao criar segundo evento exemplo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodayEvento = async () => {
    if (!teatroId) {
      toast.error("Por favor, crie um teatro de exemplo primeiro");
      return;
    }
    
    try {
      setLoading(true);
      // Criar um evento para hoje
      const eventosRef = ref(db, 'eventos');
      const newEventoRef = push(eventosRef);
      
      const eventoData = {
        titulo: 'Ensaio de Hoje',
        descricao: 'Ensaio programado para hoje',
        data: new Date().toISOString(), // Hoje
        horarioInicio: '19:00',
        horarioFim: '21:00',
        local: 'Sala Principal',
        teatroId: teatroId
      };
      
      await set(newEventoRef, eventoData);
      
      setMessage(`Evento de hoje criado com sucesso! ID: ${newEventoRef.key}`);
      toast.success('Evento de hoje criado com sucesso!');
    } catch (error) {
      console.error("Erro ao criar evento de hoje:", error);
      toast.error('Erro ao criar evento de hoje');
    } finally {
      setLoading(false);
    }
  };

  // Redirecionar se não for admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Acesso Restrito</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Esta página é restrita a administradores do sistema.
        </p>
        <Link to="/">
          <Button className="bg-primary text-white">
            Voltar para a página inicial
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto pb-20">
      <div className="flex items-center mb-6">
        <Link to="/" className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold text-center flex-1 -ml-6">
          Administração
        </h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="users" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Conteúdo</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span>Sistema</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-xl">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gerenciar Usuários
            </h2>
            
            <div className="flex gap-2 mb-4">
              <Input
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Buscar por email"
                className="rounded-xl bg-background border-none"
              />
              <Button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-primary text-white rounded-xl"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="bg-background p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </p>
                    </div>
                  </div>
                  
                  {user.role === 'admin' ? (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="rounded-full"
                      onClick={() => handleSetAdmin(user.id, false)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white rounded-full"
                      onClick={() => handleSetAdmin(user.id, true)}
                      disabled={loading}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-xl">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Conteúdo de Exemplo
            </h2>

            <div className="space-y-3">
              <h3 className="text-md font-medium border-b pb-2">Teatros</h3>
              <Button 
                onClick={handleAddExampleTeatro} 
                disabled={loading || !user}
                className="w-full"
              >
                Adicionar Teatro de Exemplo (Hamlet)
              </Button>

              <Button 
                onClick={handleAddSecondExampleTeatro} 
                disabled={loading || !user}
                className="w-full"
              >
                Adicionar Teatro de Exemplo (Romeu e Julieta)
              </Button>

              <h3 className="text-md font-medium border-b pb-2 mt-4">Eventos</h3>
              <Button 
                onClick={handleAddExampleEvento} 
                disabled={loading}
                className="w-full"
              >
                Adicionar Evento de Exemplo (Dezembro)
              </Button>

              <Button 
                onClick={handleAddSecondExampleEvento} 
                disabled={loading}
                className="w-full"
              >
                Adicionar Evento de Exemplo (Novembro)
              </Button>

              <Button 
                onClick={handleAddTodayEvento} 
                disabled={loading}
                className="w-full"
              >
                Adicionar Evento para Hoje
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-xl">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações do Sistema
            </h2>

            <div className="space-y-3">
              <div className="bg-background p-3 rounded-xl">
                <p className="text-sm mb-2">
                  Status de administrador: <strong>{isAdmin ? 'Sim' : 'Não'}</strong>
                </p>
                <p className="text-sm mb-4">
                  Email: <strong>{user?.email || 'Não logado'}</strong>
                </p>

                {!isAdmin && user && (
                  <Button 
                    onClick={handleSetUserAsAdmin} 
                    disabled={loading || !user || isAdmin}
                    className="w-full"
                    variant="secondary"
                  >
                    Definir-me como Administrador
                  </Button>
                )}
              </div>

              {teatroId && (
                <div className="bg-background p-3 rounded-xl">
                  <p className="text-sm mb-2">
                    Último teatro criado: <strong>{teatroId}</strong>
                  </p>
                  <Button 
                    onClick={() => navigate(`/teatro-detalhes/${teatroId}`)}
                    className="w-full mt-2"
                    variant="outline"
                  >
                    Ver Detalhes do Teatro
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {message && (
        <div className="bg-primary/10 p-3 rounded-md text-sm mt-4">
          {message}
        </div>
      )}
    </div>
  );
} 