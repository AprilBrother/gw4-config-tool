const {
    app, 
    BrowserWindow, 
    dialog,
    ipcMain
} = require('electron')
let fs = require('fs')
let url = require('url'), 
    path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let outPath = 'log.csv'

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1920,
        height: 1280,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    win.setMenu(null);
    win.maximize();

    var locale=app.getLocale();

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        search: "?locale="+locale,
        protocol: 'file:',
        slashes: true
    }))

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
    
    ipcMain.on('showDownload', function() {
        let savePath = dialog.showSaveDialogSync({
            defaultPath: "adv.csv"
        })

        console.log("savePath:", savePath)
        if (savePath) {
            fs.rename(outPath, savePath, function(err) {
                console.log("saved:", savePath)
            })
        }
    })

    ipcMain.on('showAppVersion', () => {
        var ver = app.getVersion();
        dialog.showMessageBox({
            message: `
                Version: ${ver}
            `
        });
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

