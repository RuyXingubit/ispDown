import React, { useState, useEffect } from 'react';

interface Client {
  ID: number;
  Name: string;
  CPF: string;
  IsActive: boolean;
}

interface Props {
  token: string;
  onLogout: () => void;
}

export default function AdminDashboard({ token, onLogout }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal novo cliente
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal confirmação de exclusão
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao carregar clientes');
      const data = await res.json();
      setClients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [token]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, cpf: newCpf, pin: newPin })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar cliente');
      }

      setShowModal(false);
      setNewName('');
      setNewCpf('');
      setNewPin('');
      fetchClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (client: Client) => {
    const newStatus = !client.IsActive;
    try {
      const res = await fetch(`/api/admin/clients/${client.ID}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      });
      if (!res.ok) throw new Error('Erro ao atualizar status');
      // Atualiza localmente sem recarregar tudo
      setClients(prev => prev.map(c => c.ID === client.ID ? { ...c, IsActive: newStatus } : c));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientToDelete.ID}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao excluir cliente');
      setClientToDelete(null);
      fetchClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Painel do Provedor</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={() => setShowModal(true)}>+ Adicionar Cliente</button>
          <button className="btn btn-secondary" onClick={onLogout}>Sair</button>
        </div>
      </div>

      {error && <div style={{ color: '#f44336', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(244,67,54,0.1)', borderRadius: '8px' }}>{error}</div>}

      <div className="card">
        <h3>Lista de Clientes</h3>
        {loading ? (
          <p>Carregando...</p>
        ) : clients.length === 0 ? (
          <p style={{ marginTop: '1rem', color: '#888' }}>Nenhum cliente cadastrado ainda.</p>
        ) : (
          <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>ID</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Nome</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>CPF</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.ID} style={{ borderBottom: '1px solid #222', opacity: c.IsActive ? 1 : 0.6 }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{c.ID}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{c.Name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace' }}>{c.CPF}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{
                        color: c.IsActive ? '#4caf50' : '#f44336',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}>
                        {c.IsActive ? '● Ativo' : '● Suspenso'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          title={c.IsActive ? 'Suspender cliente e bloquear todos os seus links' : 'Reativar cliente e liberar os links'}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: c.IsActive ? 'rgba(255,152,0,0.15)' : 'rgba(76,175,80,0.15)',
                            color: c.IsActive ? '#ff9800' : '#4caf50',
                          }}
                        >
                          {c.IsActive ? 'Suspender' : 'Reativar'}
                        </button>
                        <button
                          onClick={() => setClientToDelete(c)}
                          title="Excluir cliente e todos os seus arquivos permanentemente"
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: 'rgba(244,67,54,0.15)',
                            color: '#f44336',
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Novo Cliente */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="card" style={{ maxWidth: 400, width: '100%' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Novo Cliente</h3>
            <form onSubmit={handleCreateClient}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nome Completo</label>
                <input required type="text" className="input" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>CPF (apenas números)</label>
                <input required type="text" className="input" value={newCpf} onChange={e => setNewCpf(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>PIN (4 dígitos)</label>
                <input required type="password" maxLength={4} className="input" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão */}
      {clientToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="card" style={{ maxWidth: 420, width: '100%' }}>
            <h3 style={{ marginBottom: '1rem', color: '#f44336' }}>⚠️ Excluir Cliente</h3>
            <p style={{ marginBottom: '0.5rem' }}>
              Tem certeza que deseja excluir <strong>{clientToDelete.Name}</strong>?
            </p>
            <p style={{ marginBottom: '1.5rem', color: '#aaa', fontSize: '0.9rem' }}>
              Essa ação é <strong>irreversível</strong>. Todos os arquivos e links deste cliente serão deletados permanentemente do servidor.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setClientToDelete(null)} disabled={deleting}>
                Cancelar
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={deleting}
                style={{
                  padding: '0.6rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  background: '#f44336',
                  color: '#fff',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
