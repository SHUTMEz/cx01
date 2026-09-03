use std::{io::{BufRead, BufReader, Write}, path::{Path, PathBuf}, process::{Child, ChildStdin, Command, Stdio}, sync::{Mutex, OnceLock}};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

#[cfg(test)]
mod tests {
    use super::line_script_candidates;
    use std::path::Path;

    #[test]
    fn bundled_line_script_is_checked_before_development_paths() {
        let candidates = line_script_candidates(Path::new("C:\\app\\resources"), Path::new("C:\\app"));
        assert_eq!(candidates[0], Path::new("C:\\app\\resources\\line-service.exe"));
        assert_eq!(candidates[1], Path::new("C:\\app\\resources\\scripts\\line-service.mjs"));
        assert_eq!(candidates[2], Path::new("C:\\app\\scripts\\line-service.mjs"));
        assert_eq!(candidates[3], Path::new("C:\\scripts\\line-service.mjs"));
    }
}

static LINE_PROCESS: OnceLock<Mutex<Option<(Child, ChildStdin)>>> = OnceLock::new();

fn line_process() -> &'static Mutex<Option<(Child, ChildStdin)>> {
    LINE_PROCESS.get_or_init(|| Mutex::new(None))
}

fn line_script_candidates(resource_dir: &Path, current_dir: &Path) -> Vec<PathBuf> {
    vec![
        resource_dir.join("line-service.exe"),
        resource_dir.join("scripts").join("line-service.mjs"),
        current_dir.join("scripts").join("line-service.mjs"),
        current_dir.parent().unwrap_or(current_dir).join("scripts").join("line-service.mjs"),
    ]
}

#[derive(Serialize, Clone)]
struct LineServiceEvent { event_type: String, payload: serde_json::Value }

#[tauri::command]
fn start_line_service(app: AppHandle) -> Result<(), String> {
    let mut process = line_process().lock().map_err(|error| error.to_string())?;
    if let Some((child, _)) = process.as_mut() {
        if child.try_wait().map_err(|error| error.to_string())?.is_none() { return Ok(()); }
        *process = None;
    }

    let current_dir = std::env::current_dir().map_err(|error| error.to_string())?;
    let resource_dir = app.path().resource_dir().map_err(|error| error.to_string())?;
    let worker = line_script_candidates(&resource_dir, &current_dir)
        .into_iter()
        .find(|path| path.exists())
        .ok_or_else(|| "LINE worker script was not found".to_string())?;
    let storage = app.path().app_data_dir().map_err(|error| error.to_string())?.join("line").join("account.json");
    let mut command = if worker.extension().and_then(|extension| extension.to_str()) == Some("exe") {
        Command::new(worker)
    } else {
        let mut command = Command::new("node");
        command.arg(worker);
        command
    };
    let mut child = command
        .arg("--storage")
        .arg(storage)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("Unable to start LINE service: {error}"))?;
    let stdin = child.stdin.take().ok_or_else(|| "LINE service stdin unavailable".to_string())?;
    let stdout = child.stdout.take().ok_or_else(|| "LINE service stdout unavailable".to_string())?;
    let stderr = child.stderr.take().ok_or_else(|| "LINE service stderr unavailable".to_string())?;
    let app_handle = app.clone();
    let error_handle = app.clone();
    std::thread::spawn(move || {
        for line in BufReader::new(stdout).lines().flatten() {
            if let Ok(value) = serde_json::from_str::<serde_json::Value>(&line) {
                let event_type = value.get("type").and_then(|item| item.as_str()).unwrap_or("unknown").to_string();
                let payload = value.as_object().map(|object| object.iter().filter(|(key, _)| key.as_str() != "type").map(|(key, value)| (key.clone(), value.clone())).collect::<serde_json::Map<String, serde_json::Value>>()).map(serde_json::Value::Object).unwrap_or(serde_json::Value::Null);
                let _ = app_handle.emit("line-service-event", LineServiceEvent { event_type, payload });
            }
        }
        let _ = app_handle.emit("line-service-event", LineServiceEvent { event_type: "stopped".to_string(), payload: serde_json::json!({}) });
    });
    std::thread::spawn(move || {
        for line in BufReader::new(stderr).lines().flatten() {
            let _ = error_handle.emit("line-service-event", LineServiceEvent { event_type: "log".to_string(), payload: serde_json::json!({ "message": line }) });
        }
    });
    *process = Some((child, stdin));
    Ok(())
}

#[tauri::command]
fn stop_line_service() -> Result<(), String> {
    let mut process = line_process().lock().map_err(|error| error.to_string())?;
    if let Some((mut child, mut stdin)) = process.take() {
        stdin.write_all(b"stop\n").map_err(|error| error.to_string())?;
        let _ = child.kill();
        let _ = child.wait();
    }
    Ok(())
}

#[tauri::command]
fn start_line_listener() -> Result<(), String> {
    let mut process = line_process().lock().map_err(|error| error.to_string())?;
    if let Some((_, stdin)) = process.as_mut() {
        stdin.write_all(b"start\n").map_err(|error| error.to_string())?;
        stdin.flush().map_err(|error| error.to_string())?;
    } else {
        return Err("LINE service is not running".to_string());
    }
    Ok(())
}

#[tauri::command]
fn start_drag(window: tauri::WebviewWindow, paths: Vec<String>) -> Result<(), String> {
    let file_paths: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();

    let item = drag::DragItem::Files(file_paths);
    let image = drag::Image::Raw(vec![0, 0, 0, 0]);

    drag::start_drag(&window, item, image, |_result, _cursor_pos| {}, drag::Options::default())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Not supported on this OS".into())
    }
}

#[tauri::command]
fn delete_folder(path: String) -> Result<(), String> {
    if std::path::Path::new(&path).exists() {
        std::fs::remove_dir_all(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .invoke_handler(tauri::generate_handler![start_drag, open_folder, delete_folder, start_line_service, start_line_listener, stop_line_service])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
