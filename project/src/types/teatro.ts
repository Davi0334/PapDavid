// Teatro interface definition
export interface Teatro {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  diasEnsaio?: string;
  dataApresentacao?: string | Date;
  qtdParticipantes?: number;
  lider?: string;
  criadoPor?: string;
  emailCriador?: string;
  dataCriacao: any; // Can be Timestamp or Date or string
  status?: 'ativo' | 'inativo' | 'cancelado' | 'concluido';
} 