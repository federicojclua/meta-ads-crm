import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDate, formatCurrency, formatNumber } from '../../lib/utils';

export function SaleModal({
  isOpen,
  onClose,
  onSaveSale,
  onCollectPayment,
  onCancelSale,
  lead = null,
  sale = null,
  userRole = 'client',
  defaultCurrency = 'ARS',
  isLoading = false,
}) {
  const { t, language } = useLanguage();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [collectedAmount, setCollectedAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('1.0');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isCollecting = Boolean(sale);
  const canCollect = userRole !== 'salesperson';

  useEffect(() => {
    if (sale) {
      setAmount((sale.amountMinor / 100).toString());
      setCurrency(sale.currency || defaultCurrency);
      setCollectedAmount('');
      setExchangeRate(sale.exchangeRateToDefault ? sale.exchangeRateToDefault.toString() : '1.0');
      setNotes(sale.notes || '');
    } else {
      setAmount('');
      setCurrency(defaultCurrency);
      setCollectedAmount('');
      setExchangeRate('1.0');
      setNotes('');
    }
    setErrorMessage('');
  }, [sale, isOpen, defaultCurrency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isCollecting) {
      // Collect payment on existing sale
      const parsedCollect = parseFloat(collectedAmount.replace(',', '.'));
      if (isNaN(parsedCollect) || parsedCollect <= 0) {
        setErrorMessage('Ingrese un monto a cobrar válido mayor a 0.');
        return;
      }
      const collectedAmountMinor = Math.round(parsedCollect * 100);

      const remainingMinor = sale.amountMinor - (sale.collectedAmountMinor || 0);
      if (collectedAmountMinor > remainingMinor) {
        setErrorMessage(`El importe a cobrar no puede superar el saldo pendiente ($${(remainingMinor / 100).toFixed(2)} ${sale.currency}).`);
        return;
      }

      try {
        await onCollectPayment(sale.id, {
          collectedAmountMinor,
          exchangeRateToDefault: parseFloat(exchangeRate) || 1.0,
        });
        onClose();
      } catch (err) {
        setErrorMessage(err.message || 'Error al registrar el cobro.');
      }
    } else {
      // Create new sale
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage('El importe total de la venta debe ser mayor a 0.');
        return;
      }
      const amountMinor = Math.round(parsedAmount * 100);

      let initialCollectedMinor = 0;
      if (canCollect && collectedAmount) {
        const parsedInitial = parseFloat(collectedAmount.replace(',', '.'));
        if (!isNaN(parsedInitial) && parsedInitial > 0) {
          if (parsedInitial > parsedAmount) {
            setErrorMessage('El cobro inicial no puede superar el total de la venta.');
            return;
          }
          initialCollectedMinor = Math.round(parsedInitial * 100);
        }
      }

      try {
        await onSaveSale({
          leadId: lead?.id,
          amountMinor,
          currency,
          collectedAmountMinor: initialCollectedMinor,
          exchangeRateToDefault: parseFloat(exchangeRate) || 1.0,
          notes: notes.trim() || null,
        });
        onClose();
      } catch (err) {
        setErrorMessage(err.message || 'Error al registrar la venta.');
      }
    }
  };

  const handleCancelClick = async () => {
    if (!sale) return;
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta venta? No sumará ingresos en el Dashboard.')) {
      return;
    }
    try {
      await onCancelSale(sale.id);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error al cancelar la venta.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCollecting ? 'Registrar Cobro de Venta' : 'Nueva Venta Comercial'}
      description={lead ? `Prospecto: ${lead.name}` : ''}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="danger">
            {errorMessage}
          </Alert>
        )}

        {isCollecting ? (
          <div className="p-3.5 bg-[#F7F6F2] border border-brand-border rounded-lg text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Importe Total Venta:</span>
              <strong className="text-brand-text-primary font-mono">{formatCurrency(sale.amountMinor / 100, sale.currency, language === 'es' ? 'es-AR' : 'en-US')}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Cobrado Hasta Ahora:</span>
              <strong className="text-emerald-700 font-mono">{formatCurrency(sale.collectedAmountMinor / 100, sale.currency, language === 'es' ? 'es-AR' : 'en-US')}</strong>
            </div>
            <div className="flex justify-between border-t border-brand-border/60 pt-1.5">
              <span className="text-brand-text-secondary font-semibold">Saldo Pendiente:</span>
              <strong className="text-amber-700 font-mono">
                {formatCurrency(((sale.amountMinor - sale.collectedAmountMinor) || 0) / 100, sale.currency, language === 'es' ? 'es-AR' : 'en-US')}
              </strong>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Importe Total de la Venta *"
              type="number"
              step="0.01"
              placeholder="Ej: 150000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                Moneda de la Venta *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-brand-border bg-white text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="ARS">ARS (Pesos Argentinos)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
          </div>
        )}

        {canCollect && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isCollecting ? 'Monto a Cobrar Ahora *' : 'Cobro Inicial (Opcional)'}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={collectedAmount}
              onChange={(e) => setCollectedAmount(e.target.value)}
              required={isCollecting}
            />

            {currency !== defaultCurrency && (
              <Input
                label={`Tipo de Cambio a ${defaultCurrency}`}
                type="number"
                step="0.0001"
                placeholder="Ej: 1250.00"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                helperText="Cotización histórica utilizada para consolidación."
              />
            )}
          </div>
        )}

        {!isCollecting && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
              Notas de la Venta
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle de productos, servicios o condiciones de pago..."
              className="w-full p-2.5 rounded-md border border-brand-border bg-white text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-brand-border">
          <div>
            {isCollecting && canCollect && sale.status !== 'cancelled' && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelClick}
                className="text-xs text-rose-700 hover:bg-rose-50"
              >
                Cancelar Venta
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {isCollecting ? 'Confirmar Cobro' : 'Guardar Venta'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
