// src/preload.d.ts

// Define the structure for log entries received from the backend
export interface BackendLogEntry {
  type: 'stdout' | 'stderr' | string; // Allow basic types or other strings if used
  message: string;
}

// Define and export the interface for the API exposed by the preload script
export interface IElectronAPI { // Add export here if modules might import it directly
  performAction: (arg: any) => Promise<any>; // Replace 'any' with specific types if known
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  onWindowStateChange: (callback: (isMaximized: boolean) => void) => () => void; // Listener returns a cleanup function
  onBackendLog: (callback: (logEntry: BackendLogEntry) => void) => () => void; // Listener returns a cleanup function
  // Add other exposed functions/properties here if any
}

// Export an empty object to satisfy ES module requirements if needed by tsconfig
// export {}; // Keep or remove based on tsconfig strictness, often not needed if interfaces are exported 