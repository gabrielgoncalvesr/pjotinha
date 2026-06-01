import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

interface InvoiceFile {
  name: string;
  path: string;
}

export function InvoicesView({ compact = false }: { compact?: boolean }) {
  const [files, setFiles] = useState<InvoiceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedPath, setSelectedPath] = useState("");

  async function loadInvoices() {
    try {
      setLoading(true);
      await invoke("ensure_invoices_dir");
      const list = await invoke<InvoiceFile[]>("list_invoices");
      setFiles(list);
    } catch (error) {
      setMessage(String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInvoices();
  }, []);

  async function handleSaveInvoice() {
    if (!selectedPath) {
      setMessage("Selecione um arquivo antes de salvar.");
      return;
    }
    try {
      await invoke("save_invoice", { sourcePath: selectedPath });
      setMessage("Invoice salva com sucesso.");
      setSelectedPath("");
      await loadInvoices();
    } catch (error) {
      setMessage(String(error));
    }
  }

  async function handleOpen(name: string) {
    try {
      await invoke("open_invoice", { filename: name });
    } catch (error) {
      setMessage(String(error));
    }
  }

  return (
    <section className="card page-panel">
      {!compact && (
        <div className="page-panel-head">
          <h2>Invoices</h2>
          <p>Upload e consulta de invoices em Documents/pjotinha/invoices.</p>
        </div>
      )}

      <div className="invoice-upload-row">
        <label className="upload-box">
          <span>Selecionar arquivo</span>
          <input
            type="file"
            onChange={(event) => {
              const picked = event.target.files?.[0];
              const sourcePath = (picked as File & { path?: string })?.path ?? "";
              setSelectedPath(sourcePath);
            }}
          />
        </label>
        <button className="toggle-btn" onClick={handleSaveInvoice}>Salvar invoice</button>
      </div>

      {message && <p className="inline-message">{message}</p>}

      <ul className="invoice-list">
        {loading && <li className="invoice-item">Carregando...</li>}
        {!loading && files.length === 0 && <li className="invoice-item">Nenhuma invoice ainda.</li>}
        {!loading && files.map((file) => (
          <li key={file.path} className="invoice-item">
            <div>
              <strong>{file.name}</strong>
              <p>{file.path}</p>
            </div>
            <button className="toggle-btn" onClick={() => handleOpen(file.name)}>Abrir</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
