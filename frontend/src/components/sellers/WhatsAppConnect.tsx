import { useEffect, useState, useRef, useCallback } from 'react';
import { sellers } from '../../api/client';

type ConnectionStatus = 'loading' | 'waiting' | 'connected' | 'error';

export function WhatsAppConnect({
  sellerId,
  onConnected,
  onClose,
}: {
  sellerId: string;
  onConnected?: () => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [qrData, setQrData] = useState<{ base64?: string; pairingCode?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchQrCode = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await sellers.getQrCode(sellerId);
      setQrData(data);
      setStatus('waiting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar QR Code');
      setStatus('error');
    }
  }, [sellerId]);

  const pollConnectionState = useCallback(async () => {
    try {
      const { state } = await sellers.getConnectionState(sellerId);
      if (state === 'open') {
        stopPolling();
        setStatus('connected');
        onConnected?.();
      }
    } catch {
      // ignore polling errors
    }
  }, [sellerId, stopPolling, onConnected]);

  useEffect(() => {
    fetchQrCode();
    return stopPolling;
  }, [fetchQrCode, stopPolling]);

  useEffect(() => {
    if (status === 'waiting') {
      pollRef.current = setInterval(pollConnectionState, 3000);
      return stopPolling;
    }
  }, [status, pollConnectionState, stopPolling]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
            Conectar WhatsApp
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-navy text-lg leading-none cursor-pointer bg-transparent border-none"
          >
            &times;
          </button>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center py-8">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-text-muted">Gerando QR Code...</p>
          </div>
        )}

        {status === 'waiting' && qrData && (
          <div className="flex flex-col items-center">
            {qrData.base64 ? (
              <img
                src={qrData.base64.startsWith('data:') ? qrData.base64 : `data:image/png;base64,${qrData.base64}`}
                alt="QR Code WhatsApp"
                className="w-64 h-64 rounded-lg border border-border"
              />
            ) : qrData.pairingCode ? (
              <div className="bg-surface-hover border border-border rounded-lg px-6 py-4 text-center">
                <p className="text-xs text-text-muted mb-1">Codigo de pareamento</p>
                <p className="text-2xl font-bold text-navy tracking-widest">{qrData.pairingCode}</p>
              </div>
            ) : (
              <p className="text-sm text-text-muted">Nenhum QR Code disponivel</p>
            )}
            <p className="text-xs text-text-muted mt-3 text-center">
              Abra o WhatsApp no celular e escaneie o QR Code
            </p>
            <button
              onClick={fetchQrCode}
              className="mt-3 text-accent text-xs font-medium hover:text-accent-hover transition cursor-pointer bg-transparent border-none"
            >
              Gerar novo QR Code
            </button>
          </div>
        )}

        {status === 'connected' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-navy">WhatsApp conectado!</p>
            <button
              onClick={onClose}
              className="mt-4 bg-navy-dark text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy-light transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-6">
            <p className="text-sm text-danger mb-3">{error}</p>
            <button
              onClick={fetchQrCode}
              className="bg-navy-dark text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy-light transition cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
