import { useState, useEffect, useContext, createContext } from 'react';
import { db } from './firebase-prod';
import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './auth';
import React from 'react';

// Type definitions
export type Teatro = {
  id: string;
  titulo: string;
  descricao: string;
  diasEnsaio: string[];
  dataApresentacao: string;
  participantes: string[];
  criador: string;
  criadoEm?: string;
  atualizadoEm?: string;
};

export type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  organizador: string;
  horarioInicio?: string;
  horarioFim?: string;
  teatroId?: string;
  criadoEm?: string;
  atualizadoEm?: string;
};

interface DataServiceContextType {
  getTeatros: () => Promise<Teatro[]>;
  getTeatroById: (id: string) => Promise<Teatro | null>;
  createTeatro: (teatro: Omit<Teatro, 'id'>) => Promise<string>;
  updateTeatro: (id: string, teatro: Partial<Teatro>) => Promise<boolean>;
  deleteTeatro: (id: string) => Promise<boolean>;
  getEventos: () => Promise<Evento[]>;
  getEvento: (id: string) => Promise<Evento | null>;
  syncOfflineData: () => Promise<boolean>;
  syncPendingData: () => Promise<boolean>;
  hasPendingData: () => boolean;
  shouldUseOfflineMode: () => boolean;
}

// Context creation
const DataServiceContext = createContext<DataServiceContextType | null>(null);

// Provider component
export const DataServiceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize data service
    setInitialized(true);

    // Setup offline data storage if not already set up
    if (!localStorage.getItem('teatros-offline')) {
      localStorage.setItem('teatros-offline', JSON.stringify([]));
    }
  }, []);

  // Check if we should use offline mode
  const shouldUseOfflineMode = (): boolean => {
    return !navigator.onLine;
  };

  // Check if there are pending changes to sync
  const hasPendingData = (): boolean => {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
    return keys.some(key => key && (key.startsWith('teatro_update_') || key.startsWith('teatro_local_')));
  };

  // Get all teatros
  const getTeatros = async (): Promise<Teatro[]> => {
    if (!user) return [];
    
    if (shouldUseOfflineMode()) {
      // Return data from localStorage
      const offlineData = localStorage.getItem('teatros-offline');
      return offlineData ? JSON.parse(offlineData) : [];
    }

    try {
      const userTeatros: Teatro[] = [];
      
      // Get teatros where user is a participant
      const teatrosRef = collection(db, 'teatros');
      const participantQuery = query(teatrosRef, where('participantes', 'array-contains', user.uid));
      const participantSnapshot = await getDocs(participantQuery);
      
      participantSnapshot.forEach((doc) => {
        userTeatros.push({ id: doc.id, ...doc.data() } as Teatro);
      });
      
      // Get teatros where user is the creator (if not already included)
      const creatorQuery = query(teatrosRef, where('criador', '==', user.uid));
      const creatorSnapshot = await getDocs(creatorQuery);
      
      creatorSnapshot.forEach((doc) => {
        if (!userTeatros.some(t => t.id === doc.id)) {
          userTeatros.push({ id: doc.id, ...doc.data() } as Teatro);
        }
      });
      
      // Save to offline storage
      localStorage.setItem('teatros-offline', JSON.stringify(userTeatros));
      localStorage.setItem('ultima-sincronizacao', Date.now().toString());
      
      return userTeatros;
    } catch (error) {
      console.error('Error getting teatros:', error);
      
      // Try to use offline data in case of error
      const offlineData = localStorage.getItem('teatros-offline');
      return offlineData ? JSON.parse(offlineData) : [];
    }
  };

  // Get teatro by ID
  const getTeatroById = async (id: string): Promise<Teatro | null> => {
    if (!user) return null;
    
    // Check if it's a local teatro first
    if (id.startsWith('local_')) {
      const offlineData = localStorage.getItem('teatros-offline');
      if (offlineData) {
        const teatros = JSON.parse(offlineData) as Teatro[];
        const teatro = teatros.find(t => t.id === id);
        return teatro || null;
      }
      return null;
    }
    
    if (shouldUseOfflineMode()) {
      // Get from local storage
      const offlineData = localStorage.getItem('teatros-offline');
      if (offlineData) {
        const teatros = JSON.parse(offlineData) as Teatro[];
        const teatro = teatros.find(t => t.id === id);
        return teatro || null;
      }
      return null;
    }

    try {
      const teatroRef = doc(db, 'teatros', id);
      const teatroDoc = await getDoc(teatroRef);
      
      if (teatroDoc.exists()) {
        return { id: teatroDoc.id, ...teatroDoc.data() } as Teatro;
      }
      return null;
    } catch (error) {
      console.error('Error getting teatro by ID:', error);
      
      // Try offline data
      const offlineData = localStorage.getItem('teatros-offline');
      if (offlineData) {
        const teatros = JSON.parse(offlineData) as Teatro[];
        const teatro = teatros.find(t => t.id === id);
        return teatro || null;
      }
      return null;
    }
  };

  // Create a new teatro
  const createTeatro = async (teatro: Omit<Teatro, 'id'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    // Add creation timestamp
    const teatroWithTimestamp = {
      ...teatro,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    if (shouldUseOfflineMode()) {
      // Create locally
      const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newTeatro = { id: localId, ...teatroWithTimestamp };
      
      // Add to offline storage
      const offlineData = localStorage.getItem('teatros-offline');
      const teatros = offlineData ? JSON.parse(offlineData) : [];
      teatros.push(newTeatro);
      localStorage.setItem('teatros-offline', JSON.stringify(teatros));
      
      // Mark for future sync
      localStorage.setItem(`teatro_local_${localId}`, JSON.stringify(newTeatro));
      
      return localId;
    }

    try {
      const teatrosRef = collection(db, 'teatros');
      const docRef = await addDoc(teatrosRef, teatroWithTimestamp);
      
      // Update offline data
      const newTeatro = { id: docRef.id, ...teatroWithTimestamp };
      const offlineData = localStorage.getItem('teatros-offline');
      const teatros = offlineData ? JSON.parse(offlineData) : [];
      teatros.push(newTeatro);
      localStorage.setItem('teatros-offline', JSON.stringify(teatros));
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating teatro:', error);
      
      // Create locally if network error
      const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newTeatro = { id: localId, ...teatroWithTimestamp };
      
      // Add to offline storage
      const offlineData = localStorage.getItem('teatros-offline');
      const teatros = offlineData ? JSON.parse(offlineData) : [];
      teatros.push(newTeatro);
      localStorage.setItem('teatros-offline', JSON.stringify(teatros));
      
      // Mark for future sync
      localStorage.setItem(`teatro_local_${localId}`, JSON.stringify(newTeatro));
      
      return localId;
    }
  };

  // Update a teatro
  const updateTeatro = async (id: string, updates: Partial<Teatro>): Promise<boolean> => {
    if (!user) throw new Error('User not authenticated');
    
    // Add update timestamp
    const updatesWithTimestamp = {
      ...updates,
      atualizadoEm: new Date().toISOString()
    };
    
    // Update locally first
    const offlineData = localStorage.getItem('teatros-offline');
    if (offlineData) {
      const teatros = JSON.parse(offlineData) as Teatro[];
      const index = teatros.findIndex(t => t.id === id);
      
      if (index >= 0) {
        teatros[index] = { ...teatros[index], ...updatesWithTimestamp };
        localStorage.setItem('teatros-offline', JSON.stringify(teatros));
      }
    }
    
    // If it's a local teatro or we're offline, just update locally and mark for sync
    if (id.startsWith('local_') || shouldUseOfflineMode()) {
      localStorage.setItem(`teatro_update_${id}`, JSON.stringify(updatesWithTimestamp));
      return true;
    }

    try {
      const teatroRef = doc(db, 'teatros', id);
      await updateDoc(teatroRef, updatesWithTimestamp);
      return true;
    } catch (error) {
      console.error('Error updating teatro:', error);
      
      // Mark for future sync
      localStorage.setItem(`teatro_update_${id}`, JSON.stringify(updatesWithTimestamp));
      return false;
    }
  };

  // Delete a teatro
  const deleteTeatro = async (id: string): Promise<boolean> => {
    if (!user) throw new Error('User not authenticated');
    
    // Delete locally first
    const offlineData = localStorage.getItem('teatros-offline');
    if (offlineData) {
      const teatros = JSON.parse(offlineData) as Teatro[];
      const filteredTeatros = teatros.filter(t => t.id !== id);
      localStorage.setItem('teatros-offline', JSON.stringify(filteredTeatros));
    }
    
    // If it's a local teatro or we're offline, just delete locally
    if (id.startsWith('local_')) {
      localStorage.removeItem(`teatro_local_${id}`);
      localStorage.removeItem(`teatro_update_${id}`);
      return true;
    }
    
    if (shouldUseOfflineMode()) {
      localStorage.setItem(`teatro_delete_${id}`, 'true');
      return true;
    }

    try {
      const teatroRef = doc(db, 'teatros', id);
      await deleteDoc(teatroRef);
      return true;
    } catch (error) {
      console.error('Error deleting teatro:', error);
      
      // Mark for future deletion
      localStorage.setItem(`teatro_delete_${id}`, 'true');
      return false;
    }
  };

  // Implementação de getEventos
  const getEventos = async (): Promise<Evento[]> => {
    try {
      const eventosRef = collection(db, 'eventos');
      const q = query(eventosRef);
      
      const querySnapshot = await getDocs(q);
      const eventos: Evento[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        eventos.push({
          id: doc.id,
          titulo: data.titulo || '',
          descricao: data.descricao || '',
          data: data.data || '',
          local: data.local || '',
          organizador: data.organizador || '',
          criadoEm: data.criadoEm || '',
          atualizadoEm: data.atualizadoEm || ''
        });
      });
      
      return eventos;
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
  };

  // Implementação de getEvento
  const getEvento = async (id: string): Promise<Evento | null> => {
    try {
      const eventoRef = doc(db, 'eventos', id);
      const eventoSnap = await getDoc(eventoRef);
      
      if (eventoSnap.exists()) {
        const data = eventoSnap.data();
        return {
          id: eventoSnap.id,
          titulo: data.titulo || '',
          descricao: data.descricao || '',
          data: data.data || '',
          local: data.local || '',
          organizador: data.organizador || '',
          horarioInicio: data.horarioInicio || '',
          horarioFim: data.horarioFim || '',
          teatroId: data.teatroId || '',
          criadoEm: data.criadoEm || '',
          atualizadoEm: data.atualizadoEm || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Erro ao buscar evento ${id}:`, error);
      return null;
    }
  };

  // Sync offline data with Firestore
  const syncOfflineData = async (): Promise<boolean> => {
    if (!user) return false;
    if (shouldUseOfflineMode()) return false;

    try {
      let syncSuccessful = true;
      
      // Sync new teatros created offline
      const localTeatroKeys = Object.keys(localStorage).filter(key => key.startsWith('teatro_local_'));
      
      for (const key of localTeatroKeys) {
        try {
          const localTeatroStr = localStorage.getItem(key);
          if (!localTeatroStr) continue;
          
          const localTeatro = JSON.parse(localTeatroStr) as Teatro;
          const teatroId = localTeatro.id;
          
          // Remove the local ID
          const { id, ...teatroData } = localTeatro;
          
          // Create on server
          const teatrosRef = collection(db, 'teatros');
          const docRef = await addDoc(teatrosRef, teatroData);
          
          // Update references in offline data
          const offlineData = localStorage.getItem('teatros-offline');
          if (offlineData) {
            const teatros = JSON.parse(offlineData) as Teatro[];
            const updatedTeatros = teatros.map(t => {
              if (t.id === teatroId) {
                return { ...t, id: docRef.id };
              }
              return t;
            });
            localStorage.setItem('teatros-offline', JSON.stringify(updatedTeatros));
          }
          
          // Remove from pending sync
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error syncing local teatro:', error);
          syncSuccessful = false;
        }
      }
      
      // Apply updates
      const updateKeys = Object.keys(localStorage).filter(key => key.startsWith('teatro_update_'));
      
      for (const key of updateKeys) {
        try {
          const updatesStr = localStorage.getItem(key);
          if (!updatesStr) continue;
          
          const updates = JSON.parse(updatesStr);
          const teatroId = key.replace('teatro_update_', '');
          
          // Skip if it's a local teatro that hasn't been synced yet
          if (teatroId.startsWith('local_')) continue;
          
          // Apply update on server
          const teatroRef = doc(db, 'teatros', teatroId);
          await updateDoc(teatroRef, updates);
          
          // Remove from pending sync
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error applying teatro update:', error);
          syncSuccessful = false;
        }
      }
      
      // Apply deletions
      const deleteKeys = Object.keys(localStorage).filter(key => key.startsWith('teatro_delete_'));
      
      for (const key of deleteKeys) {
        try {
          const teatroId = key.replace('teatro_delete_', '');
          
          // Delete on server
          const teatroRef = doc(db, 'teatros', teatroId);
          await deleteDoc(teatroRef);
          
          // Remove from pending sync
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error deleting teatro:', error);
          syncSuccessful = false;
        }
      }
      
      // Get latest data from server if sync was successful
      if (syncSuccessful) {
        await getTeatros();
      }
      
      return syncSuccessful;
    } catch (error) {
      console.error('Error syncing offline data:', error);
      return false;
    }
  };

  // Sync pending data changes with Firestore
  const syncPendingData = async (): Promise<boolean> => {
    return await syncOfflineData();
  };

  const dataService: DataServiceContextType = {
    getTeatros,
    getTeatroById,
    createTeatro,
    updateTeatro,
    deleteTeatro,
    getEventos,
    getEvento,
    syncOfflineData,
    syncPendingData,
    hasPendingData,
    shouldUseOfflineMode
  };

  // Return the provider component with the context value
  return {
    Provider: ({ children }: { children: React.ReactNode }) => (
      React.createElement(DataServiceContext.Provider, { value: dataService }, children)
    )
  };
};

// Hook to use the data service
export const useDataService = (): DataServiceContextType => {
  const context = useContext(DataServiceContext);
  if (!context) {
    throw new Error('useDataService must be used within a DataServiceProvider');
  }
  return context;
}; 