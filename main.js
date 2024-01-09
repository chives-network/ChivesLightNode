import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import isDev from 'electron-is-dev'
import { server, getPort } from './expressApp.js';
import syncing from './src/syncing.js';
import settings from 'electron-settings';


const PORT = getPort();

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  //Start Setting Page
  mainWindow.loadFile('src/settings/index.html');

  //Start Chives Light Node
  ipcMain.on('start-chives-light-node', async (event, data) => {
    const ChivesLightNodeSetting = await settings.get('chives-light-node');
    console.log("ChivesLightNodeSetting main.js", ChivesLightNodeSetting)
    syncing.initChivesLightNode(ChivesLightNodeSetting);
    mainWindow.loadURL('http://localhost:' + PORT);
    setTimeout(intervalTaskShortTime, 5 * 1000);
    setTimeout(intervalTaskLongTime, 30 * 1000);
  });

  const template = [
    {
      label: 'About',
      submenu: [
        {
          label: 'Website',
          click: () => {
            openNewURL('https://chivesweave.org/');
          }
        },
        {
          label: 'Github',
          click: () => {
            openNewURL('https://github.com/chives-network');
          }
        },
        {
          label: 'Discord',
          click: () => {
            openNewURL('https://discord.com/invite/8KrtgBRjZn');
          }
        },
        {
          label: 'Twitter',
          click: () => {
            openNewURL('https://twitter.com/chivesweave');
          }
        },
        {
          label: 'Task To Earn',
          click: () => {
            openNewURL('https://chivesweave.org/task-to-earn/');
          }
        }
      ]
    },
    // 其他菜单...
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

function openNewURL(url) {
  const newWindow = new BrowserWindow({ width: 800, height: 600 });
  newWindow.loadURL(url);
}

async function intervalTaskShortTime() {
  try {
    console.log('Executing intervalTaskShortTime tasks...');
    const startTime = Date.now();
    await Promise.all([
      syncing.syncingBlockPromiseAll(20),
      syncing.syncingTxPromiseAll(10),
      syncing.syncingChunksPromiseAll(5),
      syncing.syncingTxParseBundle(1),
      syncing.syncingTxWaitDoingAction(10)
    ]);
    const executionTime = Date.now() - startTime;
    console.log(`All syncing tasks completed in ${executionTime} ms. Waiting for next interval...`);
    console.log('Resuming interval tasks.');
    const nextInterval = 10 * 1000;
    setTimeout(intervalTaskShortTime, nextInterval);
  } catch (error) {
    console.error('Error in intervalTaskShortTime:', error);
  }
}

async function intervalTaskLongTime() {
  try {
    console.log('Executing intervalTaskLongTime tasks...');
    const startTime = Date.now();
    await Promise.all([
      syncing.resetTx404(),
      syncing.syncingBlockAndTxStatAllDates(),
      syncing.deleteBlackTxsAndAddress(),
      syncing.deleteLog()
    ]);
    const executionTime = Date.now() - startTime;
    console.log(`All syncing tasks completed in ${executionTime} ms. Waiting for next interval...`);
    console.log('Resuming interval tasks.');
    const nextInterval = 1800 * 1000;
    setTimeout(intervalTaskLongTime, nextInterval);
  } catch (error) {
    console.error('Error in intervalTaskLongTime:', error);
  }
}

app.whenReady().then(()=>{
  createMainWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    server.close();
    app.quit();
  }
});

ipcMain.on('open-folder-dialog', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    event.reply('selected-folder', result.filePaths[0]);
  }
});

ipcMain.on('save-chives-light-node', async (event, data) => {
  await settings.set('chives-light-node', data);
  console.log("save-chives-light-node", data);
  //mainWindow.webContents.send('data-chives-light-node', data);
});

ipcMain.on('get-chives-light-node', async (event) => {
  const data = await settings.get('chives-light-node');
  console.log("get-chives-light-node", data);
  event.reply('data-chives-light-node', data);
});
