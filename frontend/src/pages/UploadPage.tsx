import React, { useState, useRef } from 'react';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB por pedaço

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError('');
      setLink('');
      setProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
      setLink('');
      setProgress(0);
    }
  };

  const generateIdentifier = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const startUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    
    const fileIdentifier = generateIdentifier();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    // Pegaria o JWT do localStorage na vida real:
    // const token = localStorage.getItem('token');
    
    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append('fileIdentifier', fileIdentifier);
        formData.append('chunkIndex', i.toString());
        formData.append('chunk', chunk);

        // Simulando a requisição para o nosso backend Go
        // await fetch('/api/files/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
        
        // Simulação de tempo para não ir rápido demais no mock (remover em prod)
        await new Promise(r => setTimeout(r, 100));

        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      // Finalizar upload
      /*
      const res = await fetch('/api/files/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fileIdentifier,
          originalName: file.name,
          totalChunks,
          totalSize: file.size
        })
      });
      const data = await res.json();
      */
      
      // Mock do link gerado
      const mockFileId = "arquivo-teste-" + fileIdentifier;
      setLink(`${window.location.origin}/download/${mockFileId}`);
      
    } catch (err) {
      setError('Ocorreu um erro durante o upload.');
    } finally {
      setUploading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    alert('Link copiado!');
  };

  return (
    <div className="card" style={{ maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Transferir Arquivo</h2>
      
      {!link && (
        <>
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              border: `2px dashed ${file ? 'var(--primary-color)' : 'var(--border-color)'}`, 
              padding: '3rem', 
              textAlign: 'center', 
              borderRadius: '8px',
              marginBottom: '1rem',
              cursor: 'pointer',
              backgroundColor: file ? 'rgba(0,112,243,0.05)' : 'transparent'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileSelect} 
            />
            {file ? (
              <div>
                <strong>{file.name}</strong>
                <p>{(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB</p>
              </div>
            ) : (
              <div>
                <p>Arraste seu arquivo gigante aqui ou clique para selecionar</p>
                <p style={{ fontSize: '0.8rem', color: 'gray' }}>Até 20GB permitidos.</p>
              </div>
            )}
          </div>

          {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

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
            disabled={!file || uploading}
            style={{ opacity: (!file || uploading) ? 0.5 : 1 }}
          >
            {uploading ? 'Processando...' : 'Iniciar Upload'}
          </button>
        </>
      )}

      {link && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <h3 style={{ color: 'green', marginBottom: '1rem' }}>Upload Concluído!</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>O arquivo será apagado em 24h ou quando o disco encher.</p>
          <input 
            type="text" 
            value={link} 
            readOnly 
            style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center' }}
          />
          <button className="btn" onClick={copyLink}>Copiar Link Mágico</button>
          <button 
            className="btn" 
            style={{ marginTop: '1rem', backgroundColor: 'transparent', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }}
            onClick={() => { setLink(''); setFile(null); setProgress(0); }}
          >
            Enviar outro arquivo
          </button>
        </div>
      )}
    </div>
  );
}
