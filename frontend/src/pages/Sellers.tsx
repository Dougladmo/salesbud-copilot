import { useEffect, useState, useCallback } from 'react';
import { sellers, companies } from '../api/client';
import type { Seller, CreateSellerDto, Company, QrCodeResponse } from '../types';

const empty: CreateSellerDto = {
  companyId: '',
  name: '',
  agentName: '',
};

export default function Sellers() {
  const [list, setList] = useState<Seller[]>([]);
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [form, setForm] = useState<CreateSellerDto>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  // QR Code modal state
  const [qrSeller, setQrSeller] = useState<Seller | null>(null);
  const [qrData, setQrData] = useState<QrCodeResponse | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const load = () => {
    sellers.list().then(setList).catch((e) => setError(e.message));
    companies.list().then(setCompanyList).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        const { companyId: _, ...rest } = form;
        await sellers.update(editId, rest);
      } else {
        await sellers.create(form);
      }
      setForm(empty);
      setEditId(null);
      setShowAdvanced(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const startEdit = (s: Seller) => {
    setEditId(s.id);
    setShowAdvanced(true);
    setForm({
      companyId: s.companyId,
      name: s.name,
      agentName: s.agentName,
      pineconeNamespace: s.pineconeNamespace || undefined,
      traitFormality: s.traitFormality,
      traitHumor: s.traitHumor,
      traitCommunication: s.traitCommunication,
      traitEmpathy: s.traitEmpathy,
      traitSelling: s.traitSelling,
      customPrompt: s.customPrompt || undefined,
      voiceId: s.voiceId || undefined,
      timeoutMs: s.timeoutMs,
      timePerCharMs: s.timePerCharMs,
      maxMemoryMessages: s.maxMemoryMessages,
      audioThreshold: s.audioThreshold,
      isActive: s.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir? A instância WhatsApp será removida.')) return;
    await sellers.delete(id);
    load();
  };

  const toggleCopilot = async (s: Seller) => {
    try {
      await sellers.toggleActive(s.id, !s.isActive);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status');
    }
  };

  const openQrModal = useCallback(async (s: Seller) => {
    setQrSeller(s);
    setQrLoading(true);
    setQrData(null);
    try {
      const data = await sellers.getQrCode(s.id);
      setQrData(data);
    } catch {
      setQrData({ status: 'error' });
    }
    setQrLoading(false);
  }, []);

  const refreshQr = useCallback(async () => {
    if (!qrSeller) return;
    setQrLoading(true);
    try {
      const data = await sellers.getQrCode(qrSeller.id);
      setQrData(data);
    } catch {
      setQrData({ status: 'error' });
    }
    setQrLoading(false);
  }, [qrSeller]);

  const checkStatus = useCallback(async () => {
    if (!qrSeller) return;
    try {
      const status = await sellers.getConnectionStatus(qrSeller.id);
      if (status.connected) {
        setQrSeller(null);
        setQrData(null);
        load();
      }
    } catch { /* ignore */ }
  }, [qrSeller]);

  const disconnectWhatsApp = async (s: Seller) => {
    if (!confirm('Desconectar WhatsApp deste vendedor?')) return;
    try {
      await sellers.logout(s.id);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao desconectar');
    }
  };

  // Auto-check connection status while QR modal is open
  useEffect(() => {
    if (!qrSeller || qrData?.status === 'already_connected') return;
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [qrSeller, qrData, checkStatus]);

  const traitLabel: Record<string, string> = {
    formal: 'Formal', informal: 'Informal',
    humorous: 'Humorístico', serious: 'Sério',
    direct: 'Direto', detailed: 'Detalhado',
    empathetic: 'Empático', objective: 'Objetivo',
    consultive: 'Consultivo', aggressive: 'Agressivo',
  };

  return (
    <div>
      <h2>Vendedores</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="form-card">
        <h3>{editId ? 'Editar Vendedor' : 'Novo Vendedor'}</h3>
        <div className="form-grid">
          <label>
            Empresa
            <select
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              required
              disabled={!!editId}
            >
              <option value="">Selecione...</option>
              {companyList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Nome
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Nome do Agente
            <input value={form.agentName} onChange={(e) => setForm({ ...form, agentName: e.target.value })} required />
          </label>
        </div>

        <button type="button" className="btn-link" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? '▼ Ocultar' : '▶ Configurações avançadas'}
        </button>

        {showAdvanced && (
          <>
            <div className="form-grid">
              <label>
                Pinecone Namespace
                <input value={form.pineconeNamespace || ''} onChange={(e) => setForm({ ...form, pineconeNamespace: e.target.value || undefined })} />
              </label>
              <label>
                Voice ID (ElevenLabs)
                <input value={form.voiceId || ''} onChange={(e) => setForm({ ...form, voiceId: e.target.value || undefined })} />
              </label>
            </div>

            <h4>Personalidade</h4>
            <div className="form-grid">
              <label>
                Formalidade
                <select value={form.traitFormality || 'informal'} onChange={(e) => setForm({ ...form, traitFormality: e.target.value as 'formal' | 'informal' })}>
                  <option value="formal">Formal</option>
                  <option value="informal">Informal</option>
                </select>
              </label>
              <label>
                Humor
                <select value={form.traitHumor || 'humorous'} onChange={(e) => setForm({ ...form, traitHumor: e.target.value as 'humorous' | 'serious' })}>
                  <option value="humorous">Humorístico</option>
                  <option value="serious">Sério</option>
                </select>
              </label>
              <label>
                Comunicação
                <select value={form.traitCommunication || 'direct'} onChange={(e) => setForm({ ...form, traitCommunication: e.target.value as 'direct' | 'detailed' })}>
                  <option value="direct">Direto</option>
                  <option value="detailed">Detalhado</option>
                </select>
              </label>
              <label>
                Empatia
                <select value={form.traitEmpathy || 'empathetic'} onChange={(e) => setForm({ ...form, traitEmpathy: e.target.value as 'empathetic' | 'objective' })}>
                  <option value="empathetic">Empático</option>
                  <option value="objective">Objetivo</option>
                </select>
              </label>
              <label>
                Estilo de Venda
                <select value={form.traitSelling || 'consultive'} onChange={(e) => setForm({ ...form, traitSelling: e.target.value as 'consultive' | 'aggressive' })}>
                  <option value="consultive">Consultivo</option>
                  <option value="aggressive">Agressivo</option>
                </select>
              </label>
            </div>

            <h4>Configurações de Timing</h4>
            <div className="form-grid">
              <label>
                Timeout (ms)
                <input type="number" min={1000} value={form.timeoutMs || 5000} onChange={(e) => setForm({ ...form, timeoutMs: +e.target.value })} />
              </label>
              <label>
                Tempo/Char (ms)
                <input type="number" min={10} value={form.timePerCharMs || 50} onChange={(e) => setForm({ ...form, timePerCharMs: +e.target.value })} />
              </label>
              <label>
                Máx. Mensagens Memória
                <input type="number" min={1} value={form.maxMemoryMessages || 7} onChange={(e) => setForm({ ...form, maxMemoryMessages: +e.target.value })} />
              </label>
              <label>
                Limiar de Áudio (chars)
                <input type="number" min={100} value={form.audioThreshold || 500} onChange={(e) => setForm({ ...form, audioThreshold: +e.target.value })} />
              </label>
            </div>

            <label className="full-width">
              Prompt Customizado
              <textarea
                rows={3}
                value={form.customPrompt || ''}
                onChange={(e) => setForm({ ...form, customPrompt: e.target.value || undefined })}
              />
            </label>
          </>
        )}

        <div className="form-actions">
          <button type="submit">{editId ? 'Salvar' : 'Criar'}</button>
          {editId && (
            <button type="button" className="btn-secondary" onClick={() => { setEditId(null); setForm(empty); setShowAdvanced(false); }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Agente</th>
            <th>Empresa</th>
            <th>WhatsApp</th>
            <th>Copilot</th>
            <th>Personalidade</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.agentName}</td>
              <td>{s.company?.name || s.companyId.slice(0, 8)}</td>
              <td>
                {s.whatsappConnected ? (
                  <span className="badge badge-active" title="Conectado" style={{ cursor: 'pointer' }} onClick={() => disconnectWhatsApp(s)}>
                    Conectado
                  </span>
                ) : (
                  <button className="btn-sm btn-connect" onClick={() => openQrModal(s)}>
                    Conectar
                  </button>
                )}
              </td>
              <td>
                <button
                  className={`btn-toggle ${s.isActive ? 'btn-toggle-on' : 'btn-toggle-off'}`}
                  onClick={() => toggleCopilot(s)}
                  title={s.isActive ? 'Clique para desligar' : 'Clique para ligar'}
                >
                  {s.isActive ? 'ON' : 'OFF'}
                </button>
              </td>
              <td className="traits">
                <span className="tag">{traitLabel[s.traitFormality]}</span>
                <span className="tag">{traitLabel[s.traitHumor]}</span>
                <span className="tag">{traitLabel[s.traitSelling]}</span>
              </td>
              <td className="actions">
                <button className="btn-sm" onClick={() => startEdit(s)}>Editar</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Excluir</button>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr><td colSpan={7} className="empty">Nenhum vendedor cadastrado</td></tr>
          )}
        </tbody>
      </table>

      {/* QR Code Modal */}
      {qrSeller && (
        <div className="modal-overlay" onClick={() => { setQrSeller(null); setQrData(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Conectar WhatsApp — {qrSeller.name}</h3>
            <p className="modal-subtitle">Escaneie o QR Code com o WhatsApp do vendedor</p>

            <div className="qr-container">
              {qrLoading && <div className="qr-loading">Carregando...</div>}
              {!qrLoading && qrData?.base64 && (
                <img src={qrData.base64} alt="QR Code WhatsApp" className="qr-image" />
              )}
              {!qrLoading && qrData?.status === 'already_connected' && (
                <div className="qr-connected">WhatsApp já conectado!</div>
              )}
              {!qrLoading && qrData?.status === 'error' && (
                <div className="qr-error">Erro ao gerar QR Code</div>
              )}
              {!qrLoading && !qrData?.base64 && !qrData?.status && (
                <div className="qr-error">QR Code não disponível</div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={refreshQr} disabled={qrLoading}>Atualizar QR Code</button>
              <button className="btn-secondary" onClick={() => { setQrSeller(null); setQrData(null); }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
