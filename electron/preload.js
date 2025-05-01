// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('[Electron Preload] Script loaded.');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', // This name will be available on window.electronAPI in the renderer process (Vue app)
  {
    // Example: Function to send a message to the main process and get a response
    performAction: (arg) => {
      console.log('[Electron Preload] Sending perform-action with arg:', arg);
      return ipcRenderer.invoke('perform-action', arg);
    },
    // Example: Function to receive messages from the main process
    // handleUpdate: (callback) => ipcRenderer.on('update-available', callback),

    // Window control functions
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),

    // Function to listen for window state changes from main process
    onWindowStateChange: (callback) => {
        // Ensure we only attach one listener, or clean up previous ones if needed
        // For simplicity, this example assumes it's called once.
        ipcRenderer.on('window-state-changed', (event, data) => {
            console.log('[Electron Preload] Received window-state-changed:', data);
            callback(data.isMaximized);
        });
        // Return a function to remove the listener
        return () => ipcRenderer.removeAllListeners('window-state-changed');
    },

    // Function to listen for backend log messages from main process
    onBackendLog: (callback) => {
      const listener = (event, logEntry) => {
        // logEntry should be { type: 'stdout' | 'stderr', message: string }
        console.log('[Electron Preload] Received backend-log:', logEntry);
        callback(logEntry);
      };
      ipcRenderer.on('backend-log', listener);

      // Return a cleanup function to remove the listener when the component unmounts
      return () => {
        console.log('[Electron Preload] Removing backend-log listener.');
        ipcRenderer.removeListener('backend-log', listener);
      };
    },

    // You can expose other Node.js modules or custom functions here
    // Be very selective about what you expose for security reasons.
    // For example, to expose a specific Node.js module:
    // path: require('path') // Be cautious with exposing entire modules

    // A better practice is to expose only the needed functions:
    // joinPath: (...args) => require('path').join(...args)
  }
); 