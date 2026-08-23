import { useState } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { apiClient } from '../../lib/api';
import { parseCsvString } from '../../lib/csvParser';

export function CsvImportModal({
  isOpen,
  onClose,
  onImportComplete,
  salespeople = [],
  clients = [],
  isGlobal = false,
}) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [defaultSalespersonId, setDefaultSalespersonId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setErrorMessage('');
    setImportResult(null);

    if (!selectedFile) return;

    if (selectedFile.size > 1024 * 1024) {
      setErrorMessage('El archivo supera el tamaño máximo permitido de 1 MB.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const parseResult = parseCsvString(text, { maxRows: 500, maxBytes: 1024 * 1024 });

        if (parseResult.error) {
          setErrorMessage(parseResult.error);
          setParsedData(null);
          return;
        }

        if (parseResult.rows.length === 0) {
          setErrorMessage('El archivo CSV no contiene registros válidos.');
          setParsedData(null);
          return;
        }

        setParsedData(parseResult.rows);
      } catch (err) {
        setErrorMessage('Error al leer el archivo CSV: ' + err.message);
        setParsedData(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleExecuteImport = async () => {
    if (!parsedData || parsedData.length === 0) return;

    const validRows = parsedData.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('No hay filas válidas para importar.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const batchTimestamp = Date.now();
      const payloadLeads = validRows.map((r) => ({
        name: r.name,
        email: r.email || null,
        phone: r.phone || null,
        assignedSalespersonEmail: r.assignedSalespersonEmail || null,
        notes: r.notes || null,
        valueEstimateMinor: r.valueEstimateMinor || 0,
        ingestionKey: `csv_${batchTimestamp}_row_${r.rowNumber}`,
      }));

      const data = await apiClient('/api/leads/import', {
        method: 'POST',
        body: JSON.stringify({
          leads: payloadLeads,
          batchId: batchTimestamp,
          ...(isGlobal ? { clientId: selectedClientId } : {}),
          ...(defaultSalespersonId ? { defaultAssignedToUserId: defaultSalespersonId } : {}),
        }),
      });

      setImportResult(data.summary || data);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error en el servidor al procesar la importación.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedData(null);
    setImportResult(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetModal}
      title="Importación Masiva de Prospectos (CSV)"
      description="Cargá hasta 500 contactos en lote con detección de duplicados y asignación de vendedores."
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {errorMessage && (
          <Alert variant="danger">
            {errorMessage}
          </Alert>
        )}

        {importResult ? (
          <div className="p-5 bg-[#F7F6F2] border border-brand-border rounded-lg space-y-4 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>¡Importación finalizada con éxito!</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white border border-brand-border rounded">
                <span className="text-brand-text-secondary block font-semibold">Creados</span>
                <strong className="text-lg font-mono text-emerald-700">{importResult.createdCount || 0}</strong>
              </div>
              <div className="p-3 bg-white border border-brand-border rounded">
                <span className="text-brand-text-secondary block font-semibold">Advertencias / Duplicados</span>
                <strong className="text-lg font-mono text-amber-700">{importResult.duplicateWarningCount || 0}</strong>
              </div>
              <div className="p-3 bg-white border border-brand-border rounded">
                <span className="text-brand-text-secondary block font-semibold">Errores</span>
                <strong className="text-lg font-mono text-rose-700">{importResult.errorCount || 0}</strong>
              </div>
            </div>

            {importResult.errors?.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto border-t border-brand-border pt-2 text-rose-700">
                <span className="font-semibold block">Detalle de incidencias:</span>
                {importResult.errors.map((err, i) => (
                  <div key={i}>&bull; Fila {err.row}: {err.error}</div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={resetModal}>
                Finalizar y Ver Leads
              </Button>
            </div>
          </div>
        ) : (
          <>
            {isGlobal && clients.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                  Empresa Destino *
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-brand-border bg-white text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                Vendedor Asignado por Defecto
              </label>
              <select
                value={defaultSalespersonId}
                onChange={(e) => setDefaultSalespersonId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-brand-border bg-white text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">-- Sin asignar (o usar columna del CSV) --</option>
                {salespeople.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.displayName || sp.email}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload Box */}
            <div className="p-6 border-2 border-dashed border-brand-border rounded-lg text-center bg-gray-50 hover:bg-gray-100/60 transition-colors">
              <Upload className="w-8 h-8 text-brand-primary mx-auto mb-2" />
              <p className="text-xs font-semibold text-brand-text-primary mb-1">
                {file ? file.name : 'Arrastrá o seleccioná tu archivo CSV'}
              </p>
              <p className="text-[11px] text-brand-text-secondary mb-3">
                Máximo 500 filas. Columnas: Nombre, Email, Teléfono, Vendedor, Notas, Valor Estimado.
              </p>
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="px-3 py-1.5 bg-white border border-brand-border text-brand-text-primary text-xs font-bold rounded cursor-pointer hover:bg-gray-50">
                  Seleccionar Archivo
                </span>
              </label>
            </div>

            {/* Table Preview */}
            {parsedData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-brand-text-secondary">
                  <span>Previsualización ({parsedData.length} filas detectadas)</span>
                  <span className="text-emerald-700">
                    {parsedData.filter((r) => r.isValid).length} filas listas para importar
                  </span>
                </div>

                <div className="border border-brand-border rounded-lg max-h-48 overflow-y-auto text-xs bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F7F6F2] sticky top-0 border-b border-brand-border text-[11px] font-bold text-brand-text-secondary uppercase">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Nombre</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Teléfono</th>
                        <th className="p-2">Vendedor</th>
                        <th className="p-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      {parsedData.slice(0, 50).map((row) => (
                        <tr key={row.rowNumber} className={row.isValid ? '' : 'bg-rose-50/60'}>
                          <td className="p-2 font-mono text-brand-text-secondary">{row.rowNumber}</td>
                          <td className="p-2 font-medium text-brand-text-primary">{row.name || '-'}</td>
                          <td className="p-2 font-mono text-brand-text-secondary">{row.email || '-'}</td>
                          <td className="p-2 font-mono text-brand-text-secondary">{row.phone || '-'}</td>
                          <td className="p-2 text-brand-text-secondary">{row.assignedSalespersonEmail || '-'}</td>
                          <td className="p-2">
                            {row.isValid ? (
                              <span className="text-emerald-700 font-bold text-[10px]">Válido</span>
                            ) : (
                              <span className="text-rose-700 font-bold text-[10px]">Falta contacto</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
              <Button type="button" variant="secondary" onClick={resetModal}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleExecuteImport}
                disabled={!parsedData || parsedData.filter((r) => r.isValid).length === 0}
                isLoading={isProcessing}
              >
                Confirmar Importación
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
