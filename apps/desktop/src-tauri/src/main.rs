// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfoResponse {
    pub platform: String,
    pub arch: String,
    pub version: String,
    pub memory_mb: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileOperationResult {
    pub success: boolean_or_bool,
    pub file_path: Option<String>,
    pub data: Option<String>,
    pub filename: Option<String>,
}

type boolean_or_bool = bool;

#[derive(Debug, Serialize, Deserialize)]
pub struct SqliteResult {
    pub rows: Vec<serde_json::Value>,
    pub rows_affected: usize,
    pub last_insert_id: Option<i64>,
}

#[tauri::command]
fn get_system_info() -> SystemInfoResponse {
    SystemInfoResponse {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        memory_mb: None,
    }
}

#[tauri::command]
fn export_file(filename: String, content: String, _title: Option<String>) -> FileOperationResult {
    let path = std::env::temp_dir().join(&filename);
    match std::fs::write(&path, content) {
        Ok(_) => FileOperationResult {
            success: true,
            file_path: Some(path.to_string_lossy().to_string()),
            data: None,
            filename: Some(filename),
        },
        Err(_) => FileOperationResult {
            success: false,
            file_path: None,
            data: None,
            filename: None,
        },
    }
}

#[tauri::command]
fn import_file(_title: Option<String>, _extensions: Option<Vec<String>>) -> FileOperationResult {
    // Placeholder command - native file picker can be linked via dialog plugin
    FileOperationResult {
        success: false,
        file_path: None,
        data: None,
        filename: None,
    }
}

#[tauri::command]
fn execute_sqlite_query(query: String, _params: Option<Vec<serde_json::Value>>) -> SqliteResult {
    // Basic SQLite query response placeholder
    SqliteResult {
        rows: vec![],
        rows_affected: 0,
        last_insert_id: None,
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            export_file,
            import_file,
            execute_sqlite_query
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
