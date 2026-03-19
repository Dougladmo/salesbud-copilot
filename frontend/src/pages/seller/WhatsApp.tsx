import { useState, useCallback, useEffect } from 'react';
import { sellers } from '../../api/client';
import { useSeller } from '../../context/SellerContext';
import type { QrCodeResponse } from '../../types';

export default function WhatsApp() {
  const { seller, reload } = useSeller();
  const [qrData, setQrData] = useState<QrCodeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);

  if (!seller) return null;

  const fetchQr = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await sellers.getQrCode(seller.id);
      setQrData(data);
    } catch {
      setError('Erro ao gerar QR Code');
    } finally {
      setLoading(false);
    }
  }, [seller.id]);

  const checkStatus = useCallback(async () => {
    try {
      const status = await sellers.getConnectionStatus(seller.id);
      if (status.connected) {
        setQrData(null);
        reload();
      }
    } catch { /* ignore */ }
  }, [seller.id, reload]);

  useEffect(() => {
    if (!qrData?.base64) return;
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [qrData, checkStatus]);

  const handleDisconnect = async () => {
    if (!confirm('Desconectar WhatsApp?')) return;
    try {
      await sellers.logout(seller.id);
      reload();
    } catch {
      setError('Erro ao desconectar');
    }
  };

  const toggleActive = async () => {
    setToggling(true);
    try {
      await sellers.toggleActive(seller.id, !seller.isActive);
      reload();
    } catch {
      setError('Erro ao alterar status');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy mb-1">WhatsApp</h2>
      <p className="text-text-muted text-sm mb-6">Gerencie a conexão e o status do seu agente no WhatsApp.</p>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {/* Connection Status */}
      <section className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">Status da Conexão</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${seller.whatsappConnected ? 'bg-success' : 'bg-text-muted'}`}></span>
            <div>
              <p className="text-sm font-medium text-navy">
                {seller.whatsappConnected ? 'Conectado' : 'Desconectado'}
              </p>
              <p className="text-xs text-text-muted">Instância: {seller.evolutionInstance}</p>
            </div>
          </div>
          {seller.whatsappConnected ? (
            <button
              onClick={handleDisconnect}
              className="bg-danger text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-danger-hover transition cursor-pointer"
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={fetchQr}
              disabled={loading}
              className="bg-navy-dark text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-navy-light transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Gerando...' : 'Gerar QR Code'}
            </button>
          )}
        </div>
      </section>

      {/* QR Code */}
      {qrData?.base64 && (
        <section className="bg-surface border border-border rounded-xl p-5 mb-6">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">Escaneie o QR Code</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <img src={qrData.base64} alt="QR Code WhatsApp" className="w-64 h-64 object-contain" />
            </div>
            <p className="text-xs text-text-muted">Abra o WhatsApp → Menu → Dispositivos conectados → Conectar dispositivo</p>
            <button
              onClick={fetchQr}
              disabled={loading}
              className="bg-surface-hover text-text-muted px-4 py-2 rounded-full text-xs font-medium hover:bg-border transition cursor-pointer"
            >
              Atualizar QR Code
            </button>
          </div>
        </section>
      )}

      {qrData?.status === 'already_connected' && (
        <section className="bg-success/10 border border-success rounded-xl p-5 mb-6 text-center">
          <p className="text-success font-semibold text-sm">WhatsApp já está conectado!</p>
        </section>
      )}

      {/* Copilot Toggle */}
      <section className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">Copilot (Agente IA)</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy">
              {seller.isActive ? 'Agente ativo' : 'Agente desligado'}
            </p>
            <p className="text-xs text-text-muted">
              {seller.isActive
                ? 'O agente está respondendo mensagens automaticamente.'
                : 'O agente não está respondendo mensagens.'}
            </p>
          </div>
          <button
            onClick={toggleActive}
            disabled={toggling}
            className={`px-5 py-2 rounded-full text-sm font-bold transition cursor-pointer disabled:opacity-50 ${
              seller.isActive
                ? 'bg-success text-white hover:bg-success-hover'
                : 'bg-text-muted text-white hover:bg-gray-500'
            }`}
          >
            {seller.isActive ? 'ON' : 'OFF'}
          </button>
        </div>
      </section>
    </div>
  );
}
