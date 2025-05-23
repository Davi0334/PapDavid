import React from 'react';
import { Route } from 'react-router-dom';
import AdminTest from '../components/AdminTest';
import CriarGrupoOffline from '../components/CriarGrupoOffline';

const Routes = () => {
  return (
    <>
      <Route path="/admin-config" element={<AdminTest />} />
      <Route path="/criar-grupo-offline" element={<CriarGrupoOffline />} />

      {/* Rotas protegidas - COM layout e menu */}
    </>
  );
};

export default Routes; 