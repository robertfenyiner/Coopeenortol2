import React, { useState } from 'react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    password_actual: '',
    password_nueva: '',
    confirmar_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones del frontend
    if (formData.password_nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (formData.password_nueva !== formData.confirmar_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password_actual === formData.password_nueva) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/auth/cambiar-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Limpiar formulario
        setFormData({
          password_actual: '',
          password_nueva: '',
          confirmar_password: ''
        });
        
        alert('Contraseña actualizada exitosamente');
        onSuccess?.();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '28rem',
          margin: '0 1rem'
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b border-gray-200"
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div 
            className="flex items-center justify-between"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <h3 
              className="text-lg font-semibold text-gray-900"
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827'
              }}
            >
              🔐 Cambiar Contraseña
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              style={{
                color: '#9ca3af',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4" style={{ padding: '1rem 1.5rem' }}>
          {error && (
            <div 
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #f87171',
                color: '#b91c1c',
                borderRadius: '0.25rem'
              }}
            >
              {error}
            </div>
          )}

          {/* Contraseña Actual */}
          <div className="mb-4" style={{ marginBottom: '1rem' }}>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Contraseña Actual *
            </label>
            <div className="relative" style={{ position: 'relative' }}>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                required
                value={formData.password_actual}
                onChange={(e) => setFormData({ ...formData, password_actual: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                style={{
                  width: '100%',
                  padding: '0.5rem 2.5rem 0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="Ingresa tu contraseña actual"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  paddingRight: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                {showPasswords.current ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div className="mb-4" style={{ marginBottom: '1rem' }}>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Nueva Contraseña *
            </label>
            <div className="relative" style={{ position: 'relative' }}>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                required
                minLength={8}
                value={formData.password_nueva}
                onChange={(e) => setFormData({ ...formData, password_nueva: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                style={{
                  width: '100%',
                  padding: '0.5rem 2.5rem 0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  paddingRight: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                {showPasswords.new ? '🙈' : '👁️'}
              </button>
            </div>
            <p 
              className="text-xs text-gray-500 mt-1"
              style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.25rem'
              }}
            >
              La contraseña debe tener al menos 8 caracteres
            </p>
          </div>

          {/* Confirmar Contraseña */}
          <div className="mb-6" style={{ marginBottom: '1.5rem' }}>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Confirmar Nueva Contraseña *
            </label>
            <div className="relative" style={{ position: 'relative' }}>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                required
                value={formData.confirmar_password}
                onChange={(e) => setFormData({ ...formData, confirmar_password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                style={{
                  width: '100%',
                  padding: '0.5rem 2.5rem 0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="Repite la nueva contraseña"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  paddingRight: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                {showPasswords.confirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div 
            className="flex justify-end space-x-3"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                color: '#374151',
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                fontSize: '0.875rem'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#16a34a',
                color: 'white',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;