const {app, Tray, Menu, BrowserWindow} = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');
//const Renderer = require('electron/renderer');
const rpc = require('./rpc');

let tray = null;
let isPaused = false;

const presenceAppAutoLauncher = new AutoLaunch({
    name: 'PresencePulse',
    path: process.execPath
});

app.whenReady().then(()=>{
    presenceAppAutoLauncher.isEnabled().then((isEnabled)=>{
        if(!isEnabled) presenceAppAutoLauncher.enable();
    });
    createTray();
    createWindow();
});
function createWindow(){
    const win = new BrowserWindow({
        width:300,
        height:200,
        show:false,
    });

    //win.loadFile('renderer.html'); //personal note: UI for future
}
function createTray(){
        tray = new Tray(path.join(__dirname,'icon.ico'));
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Pause Detection',
                type: 'checkbox',
                checked: isPaused,
                click: ()=>{
                    isPaused = !isPaused;
                    rpc.setPaused(isPaused);
                    console.log('Detection paused:', isPaused);
                }
            },
            {
                label: 'Quit',
                click: ()=>{
                    app.quit();
                }
            }
        ]);
        tray.setToolTip('PresencePulse - YT/Spotify Presence Tracker');
        tray.setContextMenu(contextMenu);
}


/*
app.on('window-all-closed', () => {
    app.quit();
});
*/ // Personal note: future UI  
