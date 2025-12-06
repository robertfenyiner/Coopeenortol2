import { useState } from 'react';
import { X, Upload, FileText, Image, File as FileIcon } from 'lucide-react';
import Button from './ui/Button';
import Select from './ui/Select';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/axios';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  asociadoId?: number;
  creditoId?: number;
  onUploadSuccess: () => void;
}

const TIPOS_DOCUMENTO = [
  { value: 'cedula', label: 'Cédula de Ciudadanía' },
  { value: 'certificado_bancario', label: 'Certificado Bancario' },
  { value: 'certificado_laboral', label: 'Certificado Laboral' },
  { value: 'certificado_estudio', label: 'Certificado de Estudios' },
  { value: 'declaracion_renta', label: 'Declaración de Renta' },
  { value: 'referencias', label: 'Referencias' },
  { value: 'comprobante_ingresos', label: 'Comprobante de Ingresos' },
  { value: 'otro', label: 'Otro Documento' },
];

export default function DocumentUploadModal({
  isOpen,
  onClose,
  asociadoId,
  creditoId,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Generar preview si es imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !tipoDocumento) {
      showToast('error', 'Seleccione un archivo y tipo de documento');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (asociadoId) {
      formData.append('asociado_id', asociadoId.toString());
    }
    if (creditoId) {
      formData.append('credito_id', creditoId.toString());
    }
    formData.append('tipo_documento', tipoDocumento);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    try {
      await api.post('/documentos/subir', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showToast('success', 'Documento subido correctamente');
      onUploadSuccess();
      handleClose();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTipoDocumento('');
    setDescripcion('');
    setPreview(null);
    onClose();
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="w-12 h-12 text-gray-400" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <Image className="w-12 h-12 text-blue-500" />;
    } else if (selectedFile.type === 'application/pdf') {
      return <FileText className="w-12 h-12 text-red-500" />;
    }
    return <FileIcon className="w-12 h-12 text-gray-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose}></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Subir Documento</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 rounded mb-4" />
                ) : (
                  getFileIcon()
                )}
                
                {selectedFile ? (
                  <div className="text-center mt-2">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-center mt-2">
                    <p className="text-sm text-gray-600">
                      Haz clic para seleccionar un archivo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG (máx. 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Tipo de Documento */}
            <Select
              label="Tipo de Documento *"
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              required
              options={TIPOS_DOCUMENTO}
            />

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (Opcional)
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Agrega una descripción del documento..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || !tipoDocumento || uploading}
              isLoading={uploading}
            >
              {uploading ? 'Subiendo...' : 'Subir Documento'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
