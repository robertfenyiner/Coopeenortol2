import React from 'react';
import AsociadoFormExpanded from './AsociadoFormExpanded';

interface AsociadosModuleProps {
  onBack: () => void;
}

const AsociadosModule: React.FC<AsociadosModuleProps> = ({ onBack }) => {
  return (
    <div>
      <h1>Gestión de Asociados</h1>
      <button onClick={onBack}>Volver</button>
      <AsociadoFormExpanded 
        onClose={() => {}}
        onSubmit={() => {}}
      />
    </div>
  );
};

export default AsociadosModule;