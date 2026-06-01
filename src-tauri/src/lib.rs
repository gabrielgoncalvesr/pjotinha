use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
struct InvoiceFile {
    name: String,
    path: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct TaskState {
    tasks: Vec<serde_json::Value>,
    done_by_month: serde_json::Value,
}

fn invoices_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Nao foi possivel localizar a pasta home")?;
    Ok(home.join("Documents").join("pjotinha").join("invoices"))
}

fn app_data_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not locate home directory")?;
    Ok(home.join("Documents").join("pjotinha"))
}

fn db_path() -> Result<PathBuf, String> {
    Ok(app_data_dir()?.join("pjotinha.db"))
}

fn ensure_db() -> Result<Connection, String> {
    let dir = app_data_dir()?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let conn = Connection::open(db_path()?).map_err(|e| e.to_string())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            tasks_json TEXT NOT NULL,
            done_by_month_json TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn)
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '.' || *c == '-' || *c == '_')
        .collect()
}

#[tauri::command]
fn load_task_state() -> Result<Option<TaskState>, String> {
    let conn = ensure_db()?;
    let mut stmt = conn
        .prepare("SELECT tasks_json, done_by_month_json FROM app_state WHERE id = 1")
        .map_err(|e| e.to_string())?;

    let row = stmt
        .query_row([], |row| {
            let tasks_json: String = row.get(0)?;
            let done_json: String = row.get(1)?;
            Ok((tasks_json, done_json))
        })
        .optional()
        .map_err(|e| e.to_string())?;

    let Some((tasks_json, done_json)) = row else {
        return Ok(None);
    };

    let tasks = serde_json::from_str::<Vec<serde_json::Value>>(&tasks_json).map_err(|e| e.to_string())?;
    let done_by_month = serde_json::from_str::<serde_json::Value>(&done_json).map_err(|e| e.to_string())?;

    Ok(Some(TaskState { tasks, done_by_month }))
}

#[tauri::command]
fn save_task_state(tasks_json: String, done_by_month_json: String) -> Result<(), String> {
    let conn = ensure_db()?;

    conn.execute(
        "INSERT INTO app_state (id, tasks_json, done_by_month_json, updated_at)
         VALUES (1, ?1, ?2, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           tasks_json = excluded.tasks_json,
           done_by_month_json = excluded.done_by_month_json,
           updated_at = datetime('now')",
        params![tasks_json, done_by_month_json],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn ensure_invoices_dir() -> Result<String, String> {
    let dir = invoices_dir()?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
fn list_invoices() -> Result<Vec<InvoiceFile>, String> {
    let dir = invoices_dir()?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let mut files = vec![];
    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            let name = entry.file_name().to_string_lossy().to_string();
            files.push(InvoiceFile {
                name,
                path: path.to_string_lossy().to_string(),
            });
        }
    }

    files.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(files)
}

#[tauri::command]
fn save_invoice(source_path: String) -> Result<InvoiceFile, String> {
    let source = Path::new(&source_path);
    if !source.exists() {
        return Err("Arquivo de invoice nao encontrado".to_string());
    }

    let original_name = source
        .file_name()
        .ok_or("Nome de arquivo invalido")?
        .to_string_lossy()
        .to_string();

    let filename = sanitize_filename(&original_name);
    if filename.is_empty() {
        return Err("Nome de arquivo invalido".to_string());
    }

    let dir = invoices_dir()?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let target = dir.join(&filename);
    fs::copy(source, &target).map_err(|e| e.to_string())?;

    Ok(InvoiceFile {
        name: filename,
        path: target.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn open_invoice(filename: String) -> Result<(), String> {
    let safe = sanitize_filename(&filename);
    if safe.is_empty() {
        return Err("Nome de arquivo invalido".to_string());
    }

    let full = invoices_dir()?.join(safe);
    if !full.exists() {
        return Err("Invoice nao encontrada".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(full)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Abrir arquivo suportado apenas no macOS neste MVP".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            load_task_state,
            save_task_state,
            ensure_invoices_dir,
            list_invoices,
            save_invoice,
            open_invoice
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
