import { useState } from 'react';
import { Camera, User } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/axios';

interface ProfilePhotoProps {
  asociadoId: number;
  fotoUrl: string | null;
  onPhotoUpdate: () => void;
  editable?: boolean;
}

export default function ProfilePhoto({
  asociadoId,
  fotoUrl,
  onPhotoUpdate,
  editable = false,
}: ProfilePhotoProps) {
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'La imagen no debe superar 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/asociados/${asociadoId}/foto`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showToast('success', 'Foto de perfil actualizada');
      onPhotoUpdate();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Error al subir foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      {/* Foto de Perfil */}
      <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt="Foto de perfil"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <User className="w-16 h-16 mb-1" />
            <span className="text-xs font-medium">Sin Foto</span>
          </div>
        )}
      </div>

      {/* Botón de carga (solo si es editable) */}
      {editable && (
        <>
          <input
            type="file"
            id="photo-upload"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={uploading}
          />
          <label
            htmlFor="photo-upload"
            className={`absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Camera className="w-5 h-5" />
          </label>
        </>
      )}

      {/* Loading overlay */}
      {uploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}
