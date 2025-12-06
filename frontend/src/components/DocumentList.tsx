import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Eye, Image, File as FileIcon, CheckCircle, XCircle, Upload } from 'lucide-react';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/axios';
import DocumentUploadModal from './DocumentUploadModal';

interface Documento {
  id: number;
  nombre_archivo: string;
  tipo_documento: string;
  mime_type: string;
  tamano_bytes: number;
  descripcion?: string;
  fecha_subida: string;
  es_valido: boolean;
}

interface DocumentListProps {
  documentos: Documento[];
  onDocumentDeleted: () => void;
  editable?: boolean;
  asociadoId?: number;
  creditoId?: number;
}

// Modal de preview
function DocumentPreviewModal({
  documento,
  onClose,
}: {
  documento: Documento;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Cargar el documento
  useEffect(() => {
    const loadDocument = async () => {
      try {
        const response = await api.get(`/documentos/${documento.id}/descargar`, {
          responseType: 'blob',
        });
        const url = URL.createObjectURL(response.data);
        setPreviewUrl(url);
      } catch (error) {
        console.error('Error cargando documento:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDocument();
  }, [documento.id]);

  const isImage = documento.mime_type.startsWith('image/');
  const isPdf = documento.mime_type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h3 className="text-lg font-medium">{documento.nombre_archivo}</h3>
              {documento.descripcion && (
                <p className="text-sm text-gray-500">{documento.descripcion}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Preview */}
          <div className="p-6 max-h-[70vh] overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : isImage ? (
              <img src={previewUrl} alt={documento.nombre_archivo} className="max-w-full mx-auto" />
            ) : isPdf ? (
              <iframe
                src={previewUrl}
                className="w-full h-[60vh]"
                title={documento.nombre_archivo}
              />
            ) : (
              <div className="text-center py-12">
                <FileIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Vista previa no disponible</p>
                <a
                  href={previewUrl}
                  download={documento.nombre_archivo}
                  className="text-green-600 hover:underline mt-2 inline-block"
                >
                  Descargar archivo
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentList({ documentos, onDocumentDeleted, editable = false, asociadoId, creditoId }: DocumentListProps) {
  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { showToast } = useToast();

  const handleDownload = async (documento: Documento) => {
    try {
      const response = await api.get(`/documentos/${documento.id}/descargar`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', documento.nombre_archivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast('error', 'Error al descargar documento');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este documento?')) {
      return;
    }

    try {
      await api.delete(`/documentos/${id}`);
      showToast('success', 'Documento eliminado');
      onDocumentDeleted();
    } catch (error) {
      showToast('error', 'Error al eliminar documento');
    }
  };

  const handleValidate = async (id: number, esValido: boolean) => {
    const mensaje = esValido 
      ? '¿Marcar este documento como válido?' 
      : '¿Marcar este documento como NO válido?';
    
    if (!window.confirm(mensaje)) {
      return;
    }

    try {
      await api.post(`/documentos/${id}/validar`, {
        es_valido: esValido,
        notas_validacion: esValido ? 'Documento aprobado' : 'Documento rechazado'
      });
      showToast('success', esValido ? 'Documento validado' : 'Documento marcado como no válido');
      onDocumentDeleted(); // Recargar lista
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Error al validar documento');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <FileIcon className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Agrupar documentos por tipo
  const groupedDocs = documentos.reduce((acc, doc) => {
    if (!acc[doc.tipo_documento]) {
      acc[doc.tipo_documento] = [];
    }
    acc[doc.tipo_documento].push(doc);
    return acc;
  }, {} as Record<string, Documento[]>);

  const tipoLabels: Record<string, string> = {
    cedula: 'Cédula de Ciudadanía',
    certificado_bancario: 'Certificados Bancarios',
    certificado_laboral: 'Certificados Laborales',
    certificado_estudio: 'Certificados de Estudios',
    declaracion_renta: 'Declaración de Renta',
    referencias: 'Referencias',
    comprobante_ingresos: 'Comprobantes de Ingresos',
    otro: 'Otros Documentos',
  };

  return (
    <>
      {/* Botón para subir documentos */}
      {editable && (asociadoId || creditoId) && (
        <div className="mb-4">
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Subir Documento
          </Button>
        </div>
      )}

      {documentos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">No hay documentos subidos</p>
          <p className="text-sm text-gray-500 mt-1">
            {editable && (asociadoId || creditoId) ? 'Haz clic en "Subir Documento" para agregar archivos' : 'No hay documentos disponibles'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocs).map(([tipo, docs]) => (
          <div key={tipo} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h4 className="font-medium text-gray-900">
                {tipoLabels[tipo] || tipo} ({docs.length})
              </h4>
            </div>
            <div className="divide-y">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                    !doc.es_valido ? 'border-l-4 border-orange-400 bg-orange-50/30' : 'border-l-4 border-transparent'
                  }`}
                >
                  {/* Info del documento */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(doc.mime_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {doc.nombre_archivo}
                        </p>
                        {/* Badge de estado */}
                        {doc.es_valido ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Válido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <XCircle className="w-3 h-3" />
                            Pendiente validación
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span>{formatFileSize(doc.tamano_bytes)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.fecha_subida)}</span>
                      </div>
                      {doc.descripcion && (
                        <p className="text-sm text-gray-600 mt-1">{doc.descripcion}</p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setPreviewDoc(doc)}
                      className="!p-2"
                      title="Vista previa"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleDownload(doc)}
                      className="!p-2"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {editable && (
                      <>
                        {/* Botón de validación */}
                        {doc.es_valido ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleValidate(doc.id, false)}
                            className="!p-2 !text-orange-600 hover:!bg-orange-50"
                            title="Marcar como NO válido"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleValidate(doc.id, true)}
                            className="!p-2 !text-green-600 hover:!bg-green-50"
                            title="Validar documento"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {/* Botón de eliminar */}
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleDelete(doc.id)}
                          className="!p-2 !text-red-600 hover:!bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Modal de preview */}
      {previewDoc && (
        <DocumentPreviewModal
          documento={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Modal de subir documento */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        asociadoId={asociadoId}
        creditoId={creditoId}
        onUploadSuccess={() => {
          setShowUploadModal(false);
          onDocumentDeleted(); // Recargar lista
        }}
      />
    </>
  );
}
