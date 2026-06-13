import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

interface FileInfo {
  ID: string;
  OriginalName: string;
  Size: number;
  AccessLink: string;
  CreatedAt: string;
}

export default function ClientDashboard() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('clientToken');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchFiles();
  }, [token, navigate]);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data || []);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    navigate('/');
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFileToUpload(e.dataTransfer.files[0]);
      setError('');
      setProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
      setError('');
      setProgress(0);
    }
  };

  const generateIdentifier = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const startUpload = async () => {
    if (!fileToUpload || !token) return;
    setUploading(true);
    setError('');
    
    const fileIdentifier = generateIdentifier();
    const totalChunks = Math.ceil(fileToUpload.size / CHUNK_SIZE);
    
    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileToUpload.size);
        const chunk = fileToUpload.slice(start, end);
        
        const formData = new FormData();
        formData.append('fileIdentifier', fileIdentifier);
        formData.append('chunkIndex', i.toString());
        formData.append('chunk', chunk);

        const res = await fetch('/api/files/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (!res.ok) {
          throw new Error('Falha ao enviar pedaço do arquivo');
        }

        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      const res = await fetch('/api/files/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fileIdentifier,
          originalName: fileToUpload.name,
          totalChunks,
          totalSize: fileToUpload.size
        })
      });
      
      if (!res.ok) {
        throw new Error('Falha ao finalizar o upload');
      }
      
      setFileToUpload(null);
      setProgress(0);
      fetchFiles(); // Recarrega a lista
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante o upload.');
    } finally {
      setUploading(false);
    }
  };

  const copyLink = (accessLink: string) => {
    const url = `${window.location.origin}/download/${accessLink}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado!');
  };

  const regenerateLink = async (id: string) => {
    if (!confirm('Deseja realmente gerar um novo link? O link anterior deixará de funcionar imediatamente.')) return;
    try {
      const res = await fetch(`/api/files/${id}/regenerate-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchFiles();
      } else {
        alert('Erro ao regenerar link');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFile = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar este arquivo permanentemente?')) return;
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchFiles();
      } else {
        alert('Erro ao apagar arquivo');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Área do Cliente</h2>
        <button className="btn btn-secondary" onClick={handleLogout}>Sair</button>
      </div>

      <div className="card" style={{ maxWidth: '1000px', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Enviar Novo Arquivo</h3>
        
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            border: `2px dashed ${fileToUpload ? 'var(--primary-color)' : 'var(--border-color)'}`, 
            padding: '2rem', 
            textAlign: 'center', 
            borderRadius: '12px',
            marginBottom: '1rem',
            cursor: 'pointer',
            backgroundColor: fileToUpload ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileSelect} 
          />
          {fileToUpload ? (
            <div>
              <strong>{fileToUpload.name}</strong>
              <p>{(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <div>
              <p>Arraste seu arquivo gigante aqui ou clique para selecionar</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Uploads grandes serão divididos automaticamente em pedaços.</p>
            </div>
          )}
        </div>

        {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}

        {uploading && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Enviando...</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginTop: '0.5rem' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.2s' }}></div>
            </div>
          </div>
        )}

        <button 
          className="btn" 
          onClick={startUpload} 
          disabled={!fileToUpload || uploading}
          style={{ opacity: (!fileToUpload || uploading) ? 0.5 : 1 }}
        >
          {uploading ? 'Processando...' : 'Iniciar Upload'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: '1000px', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3>Meus Arquivos</h3>
        </div>
        
        {files.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>
            Nenhum arquivo enviado ainda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Nome</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Tamanho</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', width: '300px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.ID} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 500 }}>{f.OriginalName}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{new Date(f.CreatedAt).toLocaleString()}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>{(f.Size / (1024 * 1024)).toFixed(2)} MB</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => copyLink(f.AccessLink)}>Copiar Link</button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => regenerateLink(f.ID)}>Novo Link</button>
                        <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => deleteFile(f.ID)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
