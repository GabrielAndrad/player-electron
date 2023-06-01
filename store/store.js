const api = require('../service/api')
const Track = require('../service/track')
const Store = require('electron-store');
const socket = require('../service/socket')
const fs = require('fs')
const store = new Store();
const calendario = require('../calendario')
const express = require('express');
const appExpress = express();
const path = require("path")
const localStorage = require('localStorage')
const {app} = require('electron');

const createServer = () => {

  const publicPath = path.join(__dirname, 'public');
  // Definir o diretório de arquivos estáticos
  appExpress.use(express.static(publicPath));
  const appDirectory = path.dirname(app.getPath('exe'));

  // Defina o diretório estático usando o caminho absoluto
  console.log(appDirectory)
  appExpress.use(express.static(path.join(appDirectory, 'public'),{
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }

      if (path.endsWith('.scss')) {
        res.setHeader('Content-Type', 'text/scss');
      }
    }
  }));
  // Definir a rota inicial

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
  appExpress.use('../public/fonts', express.static('fonts'));

  // Iniciar o servidor express
  appExpress.listen(4000, () => {
    console.log('Servidor iniciado na porta 4000');
  });


}

const login = (pin, json) => {
  api.post('/Login/aplicativo', json, (error, response, body) => {
    try {
      console.log(pin,'LOGIN',body)
      if (pin) {
        socket.StartSocket(+pin)
      }

      if(body.UsuarioId){
        const UsuarioId = body.UsuarioId
        if (UsuarioId != 0 && !!body.Token) {
          const token = body.Token.token
  
          store.set('token',token)
          localStorage.setItem('token',token)
          store.set('pin',pin)
          localStorage.setItem('pin',pin)
  
          verificarUpdate(token)
          baixaTemplate(token)
  
        }
        else {
          token = 0
          store.set('token','')
          localStorage.setItem('token','')
        }
      } else {
        console.log(localStorage.getItem('token'),'TOKEN')
        if(localStorage.getItem('token')){
          verificarUpdate(localStorage.getItem('token'))
          baixaTemplate(localStorage.getItem('token'))
        }
      }

    
    } catch (err) {
      // Track(err)
      console.log(err)
    }

  })
}

const verificarUpdate = function (token, upload) {
  const arrayVideos = []
  Track("Verificando atualizacoes")
  api.requestApi(`/Video/player/sync`, token, (erro, resp, body) => {
    try {
      const lista = !!body && !body.includes('<html>') ? JSON.parse(body) : { Midias: [] }
      BuscarTemplateCorreto(upload, token)
      store.set('resolucao',{Altura:lista.Altura,Largura:lista.Largura})
      console.log('RESOLUCAO')
      setBrilho(lista.Luminosidade)
      console.log('BRILHO')
      if (lista.Midias && lista.Midias.length > 0) {

        console.log('VALIDADOS',lista.Midias.length)
        store.set('dados',lista.Midias)
        lista.Midias.forEach((l) => {
          let midiaId = l.MidiaId
          const templates = store.get('templates')
          if (!!templates && templates.length > 0) {
          }

          arrayVideos.push(l.Url.substring(l.Url.lastIndexOf('/') + 1))

          if (!l.IsClimaTempo) {
            baixarVideos(midiaId, l, upload, token,l.VideoPlayerId)
          }

        })
      } else {
        Track('Dados do sync vieram vazios')
      }
    } catch (err) {
      Track(err)
    }

  })
}

const baixaTemplate = (token, upload) => {
  Track("Baixando templates")

  api.requestApi(`/ClimaLeitura/templates`, token, (erro, resp, body) => {

    if (!!erro) {
      Track('Falha ao baixar templates',erro)
      return;
    }
    try {
      const templates = JSON.parse(body)
      store.set('templates',templates)
      if (templates.length === 0) {
        Track("Não vieram templates")
      }
      templates.forEach((l) => {
        let midiaId = l.MidiaId
        baixarVideos(midiaId, l, upload, token,l.VideoPlayerId)
      })
    } catch (err) {
      Track("FALHA AO BAIXAR TEMPLATES")
    }
  })
}

const baixarVideos = (midiaId, l, upload, token,videoPlayerId) => {
  api.requestApi(`/Player/s3midia/${midiaId}`, token,
    (erro, respInteira, urlVideo) => {
      if (urlVideo) {
        try {

          const urlJson = JSON.parse(urlVideo)
          urlFim = urlJson.FotoS3
          const nomeVideo = l.Url.substring(l.Url.lastIndexOf('/') + 1)

          const Path = require('path')
          const path = Path.join(__dirname, `../public/${nomeVideo}`)

          if (!fs.existsSync(path)) {
            /* o require não faz o download do arquivo, por isso estou usando o https aqui */
            const progress1 = require('progress-stream')
            const req = require('request')

            try {
              let str = {}
              if (l.Length === 0) {
                str = progress1({
                  time: 1000
                })
              } else {
                str = progress1({
                  length: l.Length,
                  time: 1000
                })
              }

              Track("downloading: " + midiaId +true);
              Track("downloaded: videoId -> " + videoPlayerId + 'L -> ' + l.Length);
              str.on('progress', function (progress) {
                if (Math.round(progress.percentage) >= 100) {
                  api.post(`/Log/uploadv2/${videoPlayerId}`, { p: 100 }, () => { console.log('Finalizei', progress.percentage) });
                }
                api.post(`/Log/uploadv2/${videoPlayerId}`, { p: Math.round(progress.percentage) }, () => { });

              })
              req(urlFim, (error, data, response) => {
              }).pipe(str).pipe(fs.createWriteStream(path))
            } catch (err) {
              console.log('catch1', err)
            }



          } else {
            if (upload === 'uploadAgain') {
              Track("downloadVideoQueue")
              const progress1 = require('progress-stream')
              const req = require('request')
             

                try {
                  const size = fs.statSync(path).size
                  // fs.unlink(path, function (err) {
                  //   if (err) return;
                  //   console.log('File deleted!',`../public/${nomeVideo}`);
                  // });


                  let str = {}

                  str = progress1({
                    length: size,
                    time: 1000
                  })
                  Track("downloaded: videoId -> " + midiaId);

                  str.on('progress', function (progress) {
                    if (Math.round(progress.percentage) >= 100) {
                      api.post(`/Log/uploadv2/${videoPlayerId}`, { p: Math.round(progress.percentage) }, () => { console.log('Finalizei', progress.percentage) });
                    } else {
                      api.post(`/Log/uploadv2/${videoPlayerId}`, { p: Math.round(progress.percentage) }, () => { });
                    }
                  })
                  req(urlFim, (error, tes, response) => {
                  }).pipe(str).pipe(fs.createWriteStream(path))
                } catch (err) {
                  console.log('catch', err)
                }

              

            }
          }
        } catch (error) {
          const jsonErro = {
            "VideoId": midiaId,
            "Pin": '',
            "Msg": error
          }
          console.log('ERROR', error)
          api.post(`/Log/error`, jsonErro, (erro, response, body) => {
            console.log('Erros enviados', jsonErro)
          })
        }
      }

    })
}

const BuscarTemplateCorreto = (upload,token) => {
  api.requestApi(`/ClimaLeitura/V3`, token,
  (erro, resp, body) => {
    try{
      if(!body.includes('Erro')){
        const data = !!body ? JSON.parse(body) : undefined
        console.log('TEMPLATE SELECIONADO',data.CodigoTemplate)
        if (!!data) {
            store.set('climaTempo', JSON.stringify(data))
            localStorage.setItem('climaTempo',JSON.stringify(data))
  
            baixarVideos(data.MidiaId,data,upload,token,data.VideoPlayerId)
        }
      }
    
    } catch(err) {
      Track(err)
      console.log("error")
    }
  })
}

const setBrilho = (luminosidade) => {
  let brilho = []
  if(luminosidade){
    luminosidade.Calendario.forEach(dd=>{
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
    if(luminosidade){
      luminosidade.Calendario.forEach((el) => {
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

  Track(`Brilho selecionado Inicio Hora: ${max}, Brilho: ${brilhoSelected}`,)
  store.set('brilho',brilhoSelected)
}

const logAtividade = (body) => {
  try{
    const videoId = body.midiaid
        store.set('videoAtual',videoId)
        console.log('VIDEO EXECUTADO',videoId,body.VideoPlayerId)
        api.post(`/Log/video/${videoId}/${body.VideoPlayerId}`,{}, (error, response, body) => {
      })
    
  } catch(err){
    Track(`Falha ao registrar atividade, ${err}`)
  }
}
const validaDados = (dados,climaTempo) => {
    let validados = []
      if(!!dados ){
        dados.forEach(dd=>{
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
      console.log(dados)
        if(!!climaTempo){
          climaTempo.Variaveis = climaTempo.Variaveis.filter((el) => {
             return el.Exibe
          })
     
            validados = validados.map(el => {
              
              let clima = climaTempo
              if(el.IsClimaTempo){
                clima = climaTempo
              } else {
                clima = el
              }
              return {
                ...clima,
                Ordem: el.Ordem,
                VideoPlayerId: el.VideoPlayerId
              }
            })
        } 

        return validados.sort((a,b) => a.Ordem - b.Ordem)

     
}


module.exports = { createServer, login,verificarUpdate,baixaTemplate,baixarVideos,store,logAtividade,validaDados}

