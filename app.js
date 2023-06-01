const express = require('express');
const appExpress = express();
const open = require('open')

const fs = require('fs')
const https = require('https')

const verificarUpdate = require('./verificaUpdate')
const calendario = require('./calendario')
const cron = require('node-cron')
const api = require('./service/api')
const socket = require('./service/socket')
const controlarVigencia = require('./app/vigencia')
const tokenCliente = require('./tokenCliente')
const cliente = require('./pin')
const localStorage = require('localStorage')
const Track = require('./service/track')

const { app, BrowserWindow } = require('electron');
const path = require('path');
const childProcess = require('child_process');

// Este método será chamado quando o Electron terminar de inicializar e estiver pronto para criar janelas do navegador.

const task = cron.schedule('* * * * *',() => {
  try {
    Track('CHECKEI NA AGENDA POR NOVAS ATUALIZACOES',tokenCliente.UsuarioId != 0)
 
    const json = { "Pin": localStorage.getItem('pin') }
    api.post('/Login/aplicativo',json, (error, response, body) => {
        if(body){
            const UsuarioId = body.UsuarioId
      
            if(UsuarioId != 0 && !!body.Token){
              const token = body.Token.token
              
              socket.CheckSocket()            
      
              localStorage.setItem('token',token)
               verificarUpdate.baixaTemplate(token)
               verificarUpdate.verificarUpdate(token) 
              }
        }
      
        })
  } catch (error) {
      Track(`Falha ao checkar na agenda, ${error}`)
  }

})

// appExpress.use(express.static('public'));
appExpress.use(express.json())
appExpress.use(express.static('public', { 
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }

    if (path.endsWith('.scss')) {
      res.setHeader('Content-Type', 'text/scss');
    }
  }
}));
appExpress.use('./public/fonts', express.static('fonts'));
/* Rotas */ 


appExpress.get('/loading',(req,res) => {
  const html = require('./loopVideoHTML')
 
  res.send(html.existPin())
})

appExpress.get('/getpin', function (req, res) {
  const pin = require('./pin.js')

  if(!!pin && pin.pinCliente){
    const json = { "Pin": pin.pinCliente}
    const html = require('./loopVideoHTML')
 
    res.send(html.existPin())
    login(json,pin,req)
  } else {
    const html = require('./loopVideoHTML')
    res.send(html.enviaPin)
  }

})

try {
  task.start()  
} catch (error) {
  console.log(error)
}

const login = (json,pin,req) => {
  api.post('/Login/aplicativo',json, (error, response, body) => {
   
    try {
      if(!!req && req.body){
        socket.StartSocket(+pin.pinCliente)
      }
      const UsuarioId = body.UsuarioId
      if(UsuarioId != 0 && !!body.Token){
        const token = body.Token.token
        
       
        let criarToken = `const UsuarioId = ${UsuarioId}; const tokenCliente = "${token}"; module.exports = { tokenCliente, UsuarioId } `
        fs.writeFile('tokenCliente.js', criarToken, function (err) {
          if (err) return console.log(err);
        })

        localStorage.setItem('token',token)
        localStorage.setItem('pin',pin.pinCliente)
         verificarUpdate.verificarUpdate(token) 
         verificarUpdate.baixaTemplate(token)
      }
      else{
        token = 0
        localStorage.setItem('token','')
        let criarToken = `const UsuarioId = 0; const tokenCliente = " ${token} "; module.exports = { tokenCliente, UsuarioId } `
        console.log('TROQUEI O TOKEN NO ELSE DO appExpress')
        fs.writeFile('tokenCliente.js', criarToken, function (err) {
          if (err) return console.log(err);
        })
        let dados = ""
        fs.writeFile('dados.json', dados, function (err) {
          if (err) return console.log(err);
        })
      }
      res.send(UsuarioId.toString())
    } catch(err){
      Track(err)
    }
    
})
}

appExpress.post('/getpin', function (req, res) {
  try {
    let pin = '"' + req.body.Pin + '"'
    let criarPin = `const pinCliente = ${pin}; module.exports = { pinCliente } `
    fs.writeFile('pin.js', criarPin, function (err) {
      if (err) return console.log(err);
    })
    const json = { "Pin": req.body.Pin }
    api.post('/Login/aplicativo',json, (error, response, body) => {
   
      try {
        if(!!req && req.body){
          socket.StartSocket(+req.body.Pin)
        }
        // if(!!JSON.parse(req.body)){
        //   console.log(JSON.parse(req.body))
        //   createWindow(JSON.parse(req.body).Altura,JSON.parse(req.body).Largura);
        //  }
        const UsuarioId = body.UsuarioId
        if(UsuarioId != 0 && !!body.Token){
          const token = body.Token.token
          
         
          let criarToken = `const UsuarioId = ${UsuarioId}; const tokenCliente = "${token}"; module.exports = { tokenCliente, UsuarioId } `
          fs.writeFile('tokenCliente.js', criarToken, function (err) {
            if (err) return console.log(err);
          })
  
          localStorage.setItem('token',token)
          localStorage.setItem('pin',req.body.Pin)
           verificarUpdate.verificarUpdate(token) 
           verificarUpdate.baixaTemplate(token)
            console.log(JSON.parse(body))
         
          let tmp = 1
          const espera = setInterval(() => {
          if(tmp == 5){
            const dados = fs.readFileSync('dados.json')
            const lista = body && body.Midias?JSON.parse(body):[{Midias:[]}]
            const arrayVideos = []
            if(lista.Midias && lista.Midias.length > 0){
              lista.Midias.forEach(l => {
                let midiaId = l.MidiaId
                arrayVideos.push(l.Url.substring(l.Url.lastIndexOf('/')+1))
               
                api.requestApi('/Player/s3midia/',token,(erro,respInteira,urlVideo)=>{
                  const urlJson = JSON.parse(urlVideo)
                  urlFim = urlJson.FotoS3 
                  const nomeVideo = l.VideoPlayerId+'-'+l.Url.substring(l.Url.lastIndexOf('/') + 1)
                  try {
                    const Path = require('path')
                    const path = Path.join(__dirname, `./public/${nomeVideo}`)
              
                    // let bytes = 0
                    // let size = fs.lstatSync(path).size;
                    if(!fs.existsSync(path) ){
                      /* o require não faz o download do arquivo, por isso estou usando o https aqui */
                      https.get( urlFim, (response)=> {
                        if(response != null){
                          const file = fs.createWriteStream(`./public/${nomeVideo}`)       
                          response.pipe(file)
                        }
                      })
                    }
                 
                  } catch (error) {
                      const jsonErro = {
                        "VideoId" : midiaId,
                        "Pin" : cliente.pinCliente,
                        "Msg" : error
                      }
                    api.post('/Log/error',jsonErro, (erro, response, body) => {
                      console.log('Erros enviados')
                    })
                  }
                })
              })
            }
          
              clearInterval(espera)
            }
            else{
              tmp++
            }
          }, 1000);
        }
        else{
          token = 0
          localStorage.setItem('token','')
          let criarToken = `const UsuarioId = 0; const tokenCliente = " ${token} "; module.exports = { tokenCliente, UsuarioId } `
          console.log('TROQUEI O TOKEN NO ELSE DO appExpress')
          fs.writeFile('tokenCliente.js', criarToken, function (err) {
            if (err) return console.log(err);
          })
          let dados = ""
          fs.writeFile('dados.json', dados, function (err) {
            if (err) return console.log(err);
          })
        }
        res.send(UsuarioId.toString())
      } catch(err){
        Track(err)
      }
      
  })
  } catch (err) {
    Track(err)
  }

})

appExpress.get('/exibir', function (req, res) {

  try {
    const dados = fs.readFileSync('dados.json')
    let validados = []
  
      if(!!dados && !!JSON.parse(dados).Midias){
        JSON.parse(dados).Midias.forEach(dd=>{
          const midia = calendario.calendario(dd)
          switch (midia){
            case  undefined :
              console.log('Calendário inválido ou inexistente')
              break
            case false: 
              console.log('Não é tempo de exibir o vídeo')
              break
            default:   
              validados.push(dd) 
              break
            }
        })
    
      }
   
      const html = require('./loopVideoHTML')
       
        const climaTempo = JSON.parse(localStorage.getItem('climaTempo'))

        if(!!climaTempo){
          climaTempo.Variaveis = climaTempo.Variaveis.filter((el) => {
             return el.Exibe
          })
          if(validados.filter((el) =>el.IsClimaTempo).length === 0){
             validados.push(climaTempo)
          } else {
            validados = validados.map(el => {
              if(el.IsClimaTempo){
                el = climaTempo
              }
              return el
            })
          }
        }

      let brilho = []

      if(JSON.parse(dados) && JSON.parse(dados).Luminosidade){
        JSON.parse(dados).Luminosidade.Calendario.forEach(dd=>{
          const midia = calendario.calendarioInicioHora(dd)
          switch (midia){
            case  undefined :
              console.log('Sem brilho definido')
              break
            case false: 
              console.log('Brilho fora do calendario')
              break
            default:   
              brilho.push(dd) 
              break
            }
        })
      } 
     
   
     let max = 0
     let min = 0
     let brilhoSelected = 100
      if(brilho.length > 0){
        brilho.forEach((el) => {
          if(el.InicioHora > max){
            max = el.InicioHora
            min - el.InicioMinuto
            brilhoSelected = el.Brilho
          } else {
            if(el.InicioHora === max){
              if(el.InicioMinuto > min){
                max = el.InicioHora
                min - el.InicioMinuto
                brilhoSelected = el.Brilho
              }
            }
          }
         })
      } else {
        if(JSON.parse(dados).Luminosidade){
          JSON.parse(dados).Luminosidade.Calendario.forEach((el) => {
            const dias = calendario.diasSemana(el)
  
            if(!!dias){
              if(el.InicioHora > max){
                max = el.InicioHora
                min - el.InicioMinuto
                brilhoSelected = el.Brilho
              } else {
                if(el.InicioHora === max){
                  if(el.InicioMinuto > min){
                    max = el.InicioHora
                    min - el.InicioMinuto
                    brilhoSelected = el.Brilho
                  }
                }
              }
            }
          })
        }
     
      }
    
      const resolucao = {Altura:JSON.parse(dados).Altura,Largura:JSON.parse(dados).Largura}

      
      res.send(html.loopVideo(JSON.stringify(validados),brilhoSelected,resolucao))
  } catch (err) {
      Track(`Falha ao exibir video, ${err}`)
      const html = require('./loopVideoHTML')
      res.send(html.loopVideo([],0,{Altura:0,Largura:0}))
  }

  })

appExpress.post('/atividade', function (req, res) {
  try{
    const data = req.body.Data
    const video = req.body.midia.substring(req.body.midia.lastIndexOf('/') +1)
    const videoId = req.body.midiaid
  
    console.log('TENTEI EXECUTAR O VIDEO')
    const dados = fs.readFileSync('dados.json')
    const lista = dados?JSON.parse(dados):[{Midias:[]}]
    if(lista && lista.Midias && lista.Midias.length > 0){
      lista.Midias.filter((el) => {
        if(videoId === el.MidiaId){
          if(!el.Delete){
            console.log('EXECUTADO',videoId)
            localStorage.setItem('videoAtual',videoId)
            api.post(`/Log/video/${videoId}`,{}, (error, response, body) => {
              res.sendStatus(200)
            })
          }
        }
      })
    }
  } catch(err){
    Track(`Falha ao registrar atividade, ${err}`)
  }


  
})

appExpress.get('',(req,res) => {
  res.redirect('http://localhost:4000/getPin')          
})

appExpress.listen(4000,(req,res) => {
  console.log("Player Versão 1.2.0 rodando na porta", 4000);
  open(`http://localhost:4000/getPin`)
});

app.on('ready', () => {
  // Instale as dependências do projeto usando o npm
  const projectPath = path.join(__dirname, ''); // Diretório do seu projeto
  const npmInstallProcess = childProcess.spawn('npm', ['install'], { cwd: projectPath });

  // Registre a saída do processo de instalação
  npmInstallProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  // Registre os erros do processo de instalação
  npmInstallProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  // Quando o processo de instalação for concluído, crie a janela do Electron
  npmInstallProcess.on('close', () => {
    createWindow(300,900)
  });
});

function createWindow(altura,largura) {
  // Crie uma nova janela do navegador.
  const win = new BrowserWindow({
    width: largura,
    height: altura,
    frame: false,
    x:0,
    y:0,
    webPreferences: {
      nodeIntegration: true,
      navigateOnDragDrop:true
    }
  });

  // Carregue o arquivo HTML do seu aplicativo.
  win.loadURL('http://localhost:4000/getpin');

  win.setPosition(0,0)


}


 
// require('update-electron-app')()

