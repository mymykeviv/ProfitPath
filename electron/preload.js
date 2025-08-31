const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
  
  // Database operations
  executeQuery: (query, params) => ipcRenderer.invoke('db:execute', query, params),
  
  // Export operations
  exportToPDF: (data) => ipcRenderer.invoke('export:pdf', data),
  exportToExcel: (data) => ipcRenderer.invoke('export:excel', data),
  
  // Print operations
  print: (data) => ipcRenderer.invoke('print:document', data),
  
  // Window operations
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  
  // Notification operations
  showNotification: (title, body) => ipcRenderer.invoke('notification:show', title, body),
  
  // System operations
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),
  
  // Event listeners
  onMenuAction: (callback) => ipcRenderer.on('menu:action', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Expose a limited set of Node.js APIs
contextBridge.exposeInMainWorld('nodeAPI', {
  platform: process.platform,
  arch: process.arch,
  versions: process.versions
});

// Security: Remove any global Node.js APIs that might have been exposed
delete window.require;
delete window.exports;
delete window.module;