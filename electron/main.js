/* 梦语 —— Electron 桌面版主进程
   加载 app/index.html（由 npm run copy 从仓库根目录 index.html 复制而来，保持单文件唯一来源）
   安全基线：contextIsolation + 无 node 集成 + 沙箱 */
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;

function createWindow() {
  const iconPath = path.join(__dirname, 'build', 'icon.ico');
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    title: '梦语',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#ffffff',   // 与开屏页白底一致，避免启动白闪
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });

  // 去掉默认菜单栏，桌面端直接用页面内的界面
  Menu.setApplicationMenu(null);

  // 「关于」面板里的 GitHub / 哔哩等链接交给系统默认浏览器打开，不占应用窗口
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (/^https?:/.test(url)) { e.preventDefault(); shell.openExternal(url); }
  });

  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  // 冒烟测试钩子：DREAMCHAT_SMOKE=1 时加载完成后自检开屏页是否存在，然后退出
  if (process.env.DREAMCHAT_SMOKE === '1') {
    win.webContents.once('did-finish-load', async () => {
      try {
        const r = await win.webContents.executeJavaScript(
          "document.getElementById('splash') && document.querySelector('.splash-name') ? 'SPLASH_OK' : 'SPLASH_MISS'"
        );
        console.log('SMOKE_RESULT:' + r);
        app.exit(r === 'SPLASH_OK' ? 0 : 2);
      } catch (err) {
        console.log('SMOKE_RESULT:ERROR:' + err.message);
        app.exit(2);
      }
    });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
