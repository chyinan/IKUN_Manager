const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Function to create the main application window
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200, // Initial window width
    height: 800, // Initial window height
    frame: process.platform === 'darwin' ? true : false, // Use standard frame on macOS for hidden titleBarStyle, frameless on others
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default', // Use hidden title bar on macOS
    titleBarOverlay: process.platform === 'win32' ? { // Windows specific overlay for controls
        color: 'rgba(0,0,0,0)', // Transparent background
        symbolColor: '#747474', // Color of the symbols (min, max, close)
        height: 30 // Adjust height if needed
    } : undefined,
    webPreferences: {
      nodeIntegration: false, // Disable Node.js integration in renderer process for security
      contextIsolation: true, // Enable context isolation for security
      preload: path.join(__dirname, 'preload.js') // Path to the preload script
    }
  });

  // Hide the default menu bar only if NOT on macOS (macOS uses the standard menu bar)
  if (process.platform !== 'darwin') {
    mainWindow.setMenuBarVisibility(false);
  }

  // Determine the URL to load based on environment
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../dist/index.html'), // Points to the built Vue app's index.html
    protocol: 'file:',
    slashes: true
  });

  console.log(`[Electron Main] Loading URL: ${startUrl}`);

  // Load the determined URL (Vue dev server or built file)
  mainWindow.loadURL(startUrl);

  // Open the DevTools automatically if running in development
  // if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL) {
  //   mainWindow.webContents.openDevTools();
  // }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// --- Preload Script (Placeholder - We'll create this file next) ---
// The preload script runs before your web page is loaded into the browser window.
// It has access to both DOM APIs and Node.js environment, and is the ideal place
// to expose specific Node.js functionalities to your renderer process (Vue app)
// in a controlled way using contextBridge.

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Example of IPC handling (listening for messages from renderer/preload)
ipcMain.handle('perform-action', async (event, someArgument) => {
  console.log('[Electron Main] Received perform-action with arg:', someArgument);
  // Example: Access Node.js APIs or interact with the OS
  // const result = await someNodeJsFunction(someArgument);
  // return result;
  return { success: true, message: 'Action handled in main process.' };
});

// IPC handlers for custom window controls
ipcMain.on('minimize-window', () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) window.minimize();
});

ipcMain.on('maximize-window', () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) window.close();
}); 