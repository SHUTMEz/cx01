use std::path::PathBuf;

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
    .invoke_handler(tauri::generate_handler![start_drag, open_folder, delete_folder])
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
