// eSports CEO — versão de PC (Electron).
// Serve a pasta app/ (cópia do build web) num protocolo próprio, app://jogo/,
// para os caminhos absolutos (/logos, /fotos...) funcionarem e o save (localStorage) ficar guardado no PC.
const { app, BrowserWindow, protocol, net, shell, Menu } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

const RAIZ = path.join(__dirname, 'app');

function criarJanela() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#0d1320',
    title: 'eSports CEO',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  win.maximize();
  win.loadURL('app://jogo/index.html');
  // ESC_SHOT=arquivo.png: tira um print da janela e fecha (usado para testar o empacotamento)
  if (process.env.ESC_SHOT) win.webContents.once('did-finish-load', () => setTimeout(async () => {
    require('node:fs').writeFileSync(process.env.ESC_SHOT, (await win.webContents.capturePage()).toPNG()); app.quit();
  }, 3000));
  // links externos abrem no navegador
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  // F11 = tela cheia, F12 = ferramentas
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.key === 'F12') { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.handle('app', req => {
    const { pathname } = new URL(req.url);
    let arq = path.normalize(path.join(RAIZ, decodeURIComponent(pathname)));
    if (!arq.startsWith(RAIZ)) return new Response('proibido', { status: 403 });
    if (pathname === '/' || pathname === '') arq = path.join(RAIZ, 'index.html');
    return net.fetch(pathToFileURL(arq).toString());
  });
  criarJanela();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) criarJanela(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
