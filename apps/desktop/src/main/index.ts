import { app, BrowserWindow, shell } from 'electron';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 920,
    minWidth: 800,
    minHeight: 560,
    title: 'Atlas',
    backgroundColor: '#1f1b16',
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Developer aid: ATLAS_SCREENSHOT=/path/to/file.png saves a picture of the
  // window once it has loaded. Used to check the UI without screen access.
  const screenshotPath = process.env['ATLAS_SCREENSHOT'];
  if (screenshotPath) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        const image = await win.webContents.capturePage();
        await writeFile(screenshotPath, image.toPNG());
        console.log(`[atlas] screenshot saved to ${screenshotPath}`);
      }, 1500);
    });
  }

  // Links open in the browser; the app window never navigates away.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event) => event.preventDefault());

  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devUrl) void win.loadURL(devUrl);
  else void win.loadFile(join(import.meta.dirname, '../renderer/index.html'));
}

app.setName('Atlas');
void app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
