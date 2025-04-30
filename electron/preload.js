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

    // You can expose other Node.js modules or custom functions here
    // Be very selective about what you expose for security reasons.
    // For example, to expose a specific Node.js module:
    // path: require('path') // Be cautious with exposing entire modules

    // A better practice is to expose only the needed functions:
    // joinPath: (...args) => require('path').join(...args)
  }
); 