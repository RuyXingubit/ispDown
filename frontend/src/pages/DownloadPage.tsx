import { useParams } from 'react-router-dom';

export default function DownloadPage() {
  const { fileId } = useParams();

  const handleDownload = () => {
    window.location.href = `/api/files/download/${fileId}`;
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Baixar Arquivo</h2>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', opacity: 0.8, fontSize: '0.9rem' }}>Código do arquivo:<br/><strong>{fileId}</strong></p>
      <button className="btn btn-block" onClick={handleDownload}>
        Iniciar Download Seguro
      </button>
    </div>
  );
}
