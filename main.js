const Track = require('./service/track')

const { login,store, createServer, logAtividade } = require('./store/store');
const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const {createTask} = require('./service/task')
const localStorage = require('localStorage')

const createWindow = () => {
  const win = new BrowserWindow({
    width: store.get('resolucao') && store.get('resolucao').Largura !== 0?store.get('resolucao').Largura:900,
    height: store.get('resolucao') && store.get('resolucao').Altura !== 0?store.get('resolucao').Altura:300,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
			contextIsolation: false,
    }
  })

  createServer()
  createTask()

  win.webContents.openDevTools();
  
  ipcMain.on('reload',() => {
    win.webContents.reload();
  })
  
  if(!!store.get('pin')){
    win.loadFile('pages/loadingPage.html')
    setTimeout(() => {
      win.loadFile('pages/loopVideo.html')
    },5000)
    const json = { "Pin": store.get('pin') }
    
    login(store.get('pin'),json)
  } else {
    win.loadFile('pages/enviaPin.html')
  }

  win.setPosition(0,0)

  ipcMain.on('loadingPage',(event,req) => {
    win.loadFile('pages/loadingPage.html')
  })
  
  ipcMain.on('loopVideo',(event,req) => {
    win.loadFile('pages/loopVideo.html')
  })

  ipcMain.on('getPin',(event,req) => {
    console.log('getpIN')
    win.loadFile('pages/enviaPin.html')
  })

  ipcMain.on('enviaPin',(event,req) => {
    try {
      store.set('pin',req.Pin)
      localStorage.setItem('pin',req.Pin)
      const json = { "Pin": req.Pin }
      console.log(req.Pin,json)
      login(req.Pin,json)
    } catch (err) {
      Track(err)
    }
  
    event.reply('enviaPinResponse',req.Pin)
  })
  
  ipcMain.on('setStoreValue',(event,args) => {
   
    store.set(args.key,args.data)
  })

  ipcMain.on('getStoreValue',(event,args) => {
    if(store.get('clear')){
      win.loadFile('pages/enviaPin.html')
      store.clear()
    } 
    event.reply(`storeValue${args}`,store.get(args))
  } )

  ipcMain.on('atividade',(event,args) => {
    logAtividade(args)
  })
}
//////







app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})



