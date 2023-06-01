const { ipcRenderer } = require('electron')


function logAtividade() {
  let atividade = { "Data": Date.now(), "midia": nomeMidia, 'midiaid': midiaid,'VideoPlayerId':videoPlayerId }
  ipcRenderer.send('atividade', atividade)
}



ipcRenderer.send('getStoreValue', 'brilho')
ipcRenderer.send('getStoreValue', 'resolucao')
ipcRenderer.send('getStoreValue', 'climaTempo')
ipcRenderer.send('getStoreValue', 'dados')



let brilho = 100
let dados = {}
let climaTempo = {}
let resolucao = { Altura: 300, Largura: 900 }

ipcRenderer.on('storeValuebrilho', (event, response) => {
  brilho = response + '%'
  console.log(brilho)
})

ipcRenderer.on('storeValueclimaTempo', (event, response) => {
  climaTempo = response
})

ipcRenderer.on('storeValueresolucao', (event, response) => {
  resolucao = response
  console.log(resolucao)
})
let idx = 0
let ordenados = []
ipcRenderer.on('storeValuedados', (event, response) => {

  const { validaDados } = require('../store/store')
  dados = response ? response : []

  ordenados = validaDados(dados.sort((a, b) => a.Ordem - b.Ordem).filter(el => !el.Delete), climaTempo ? JSON.parse(climaTempo) : undefined)

  res = { Altura: resolucao && resolucao.Altura > 30 ? resolucao.Altura : 192, Largura: resolucao && resolucao.Largura > 30 ? resolucao.Largura : 576 }

 
  atualizaMidia()

})

const atualizaMidia = () => {
  try {
    console.log(idx, ordenados)
    if (document && document.body) {
      if (idx < ordenados.length) {
        // if (idx - 1 >= 0) {
        //   ordenados[idx - 1].Variaveis.forEach((el) => {
        //     if (document.getElementById(((el.Prefixo ? el.Prefixo : '') + el.Value).replaceAll(' ', ''))){
        //       document.getElementById(((el.Prefixo ? el.Prefixo : '') + el.Value).replaceAll(' ', '')).parentNode.remove();
        //     }
            
        //   })
        // }

        let drt = ordenados[idx].Duracao !== 0?ordenados[idx].Duracao:10
        let urlMidia = ordenados[idx].Url
        tipoMidia = urlMidia.substring(urlMidia.lastIndexOf('.') + 1)
        nomeMidia = urlMidia.substring(urlMidia.lastIndexOf('/'))
        midiaid = ordenados[idx].MidiaId
        videoPlayerId = ordenados[idx].VideoPlayerId
        // const altura = window.screen.height
        // const largura = window.screen.width
        const altura = res ? res.Altura : ordenados[idx].Altura
        const largura = res ? res.Largura : ordenados[idx].Largura
        const orientacao = ordenados[idx].Orientacao
        document.body.style.width = orientacao === 'Retrato' ? altura + 'px' : largura + 'px'
        document.body.style.height = orientacao === 'Retrato' ? largura + 'px' : altura + 'px'
        document.body.style.opacity = brilho
        document.body.style.background = '#000'
        const path = require('path')
        if (tipoMidia == 'mp4') {
          document.querySelector('img.midia').style.display = 'none'
          document.querySelector('video.midia').style.display = 'block'
          const midiaAtual = document.querySelector('video.midia')
          
          ordenados[idx].Variaveis.map(variavel => {
            const px = variavel.PositionX
            const py = variavel.PositionY

            const calcx = (px / 100) * (orientacao === 'Retrato' ? altura : largura)
            const calcy = ((py / 100) * (orientacao === 'Retrato' ? largura : altura))

            const texto = (variavel.Prefixo ? variavel.Prefixo : '') + variavel.Value
            const caixaTexto = document.createElement('div')

            const fonteSize = (Number(variavel.Tamanho) * largura) / 800
            const cor = variavel.Cor
            const fonte = variavel.Fonte
            const bold = variavel.Bold == 'true' ? true : false

            if (variavel.Name.includes('ICON') || variavel.Name.includes('ICONE')) {
              caixaTexto.innerHTML = `
                  <div id=${texto.replaceAll(' ', '')}> <div style="background-size: 100%;
                  background-repeat: no-repeat;
                  background-image: url(${variavel.Value});
                  width: ${fonteSize}px;
                  height: ${fonteSize}px;" 
                  width="${fonteSize}px" 
                  height="${fonteSize}px"
                  
                  ></div></div>
  `
            } else {
              caixaTexto.innerHTML = `
  <div id=${texto.replaceAll(' ', '')}>${texto}</div>
  `
            }
            caixaTexto.style = `
              position: absolute;
              top: ${calcy}px;
              left: ${calcx}px;
              font-size: ${fonteSize}px;
              color: ${cor};    
              font-weight: ${bold?'bold':'none'};   
              line-height:0;  
  `

            if (fonte != null) {
              caixaTexto.style.fontFamily = fonte ? fonte : 'Roboto'

            }


            const starts = variavel.Start ? variavel.Start * 1000 : 0
            const ends = variavel.End ? variavel.End * 1000 : null
            setTimeout(() => {
              document.body.appendChild(caixaTexto)
            }, starts);

            if (ends)
              setTimeout(() => {
                document.body.removeChild(caixaTexto)
              }, ends);
          })

          midiaAtual.setAttribute('src', path.join(__dirname +'/../public' + nomeMidia))
          // midiaAtual.addEventListener('ended', atualizaMidia)
          const ind = idx
        setTimeout(function () {
            ipcRenderer.send('getStoreValue', 'brilho')
            ipcRenderer.send('getStoreValue', 'resolucao')
            ipcRenderer.send('getStoreValue', 'climaTempo')
            ipcRenderer.send('getStoreValue', 'dados')
            console.log('att video',ind)
            ordenados[ind].Variaveis.forEach((el) => {
              if (document.getElementById(((el.Prefixo ? el.Prefixo : '') + el.Value).replaceAll(' ', ''))){
                document.getElementById(((el.Prefixo ? el.Prefixo : '') + el.Value).replaceAll(' ', '')).parentNode.remove();
              }
              
            })
          }, drt * 1000)
          
          midiaAtual.style = `
                  background:#000;
                  width:100%;
                  position: absolute;
                  top: 0;
                  left: 0;
                  bottom: 0;
                  right: 0;
                  height:100%;
                  object-fit:fill;
          `
          logAtividade()
        }
        else {
          document.querySelector('video.midia').style.display = 'none'
          document.querySelector('img.midia').style.display = 'block'
          const midiaAtual = document.querySelector('img.midia')


          midiaAtual.setAttribute('src', path.join(__dirname +'/../public' + nomeMidia))

          midiaAtual.style = `
          background:#000;
          width:100%;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          height:100%;
          object-fit:fill;
          `
          ordenados[idx].Variaveis.map(variavel => {
            const px = variavel.PositionX
            const py = variavel.PositionY

            const calcx = (px / 100) * (orientacao === 'Retrato' ? altura : largura)
            const calcy = ((py / 100) * (orientacao === 'Retrato' ? largura : altura))
            const larguraOriented = (orientacao === 'Retrato' ? altura : largura)
            const alturaOriented = (orientacao === 'Retrato' ? largura : altura)

            const tituloTexto = variavel.Name
            const texto = (variavel.Prefixo ? variavel.Prefixo : '') + variavel.Value
            const caixaTexto = document.createElement('div')

            const fonteSize = (Number(variavel.Tamanho) * largura) / 850
            const cor = variavel.Cor
            const fonte = variavel.Fonte
            const bold = variavel.Bold == 'true' ? true : false



            if (variavel.Name.includes('ICON') || variavel.Name.includes('ICONE')) {
              caixaTexto.innerHTML = `
                <div id=${texto.replaceAll(' ', '')}>
                <div style="background-size: 100%;
                background-repeat: no-repeat;
                background-image: url(${variavel.Value});
                width: ${fonteSize}px;
                height: ${fonteSize}px;" 
                width="${fonteSize}px" 
                height="${fonteSize}px"></div></div>
              `
            } else {
              caixaTexto.innerHTML = `
        <div id=${texto.replaceAll(' ', '')}>${texto}</div>
  `
            }
            caixaTexto.style = `
                  position: absolute;
                  top: ${calcy}px;
                  left: ${calcx}px;
                  font-size: ${fonteSize}px;
                  color: ${cor};
                  font-weight: ${bold?'bold':'none'};  
                  line-height:0;
  `
            if (fonte != null) {
              caixaTexto.style.fontFamily = fonte ? fonte : 'Roboto'
            }
            const starts = variavel.Start ? variavel.Start * 1000 : 0
            const ends = variavel.End ? variavel.End * 1000 : null
            setTimeout(() => {
              document.body.appendChild(caixaTexto)
            }, starts);

            if (ends)
              setTimeout(() => {
                document.body.removeChild(caixaTexto)
              }, ends);

          })
          const ind = idx
          const tempo = setTimeout(function () {
            ipcRenderer.send('getStoreValue', 'brilho')
            ipcRenderer.send('getStoreValue', 'resolucao')
            ipcRenderer.send('getStoreValue', 'climaTempo')
            ipcRenderer.send('getStoreValue', 'dados')
            console.log(ind,'att imagem')
            ordenados[ind].Variaveis.forEach((el) => {
              if (document.getElementById(((el.Prefixo ? el.Prefixo : '') + el.Value).replaceAll(' ', ''))){
                document.getElementById(((el.Prefixo ? el.Prefixo : '') + el.Value).replaceAll(' ', '')).parentNode.remove();
              }
              
            })
          }, drt * 1000)
          logAtividade()
        }
        idx++
      }
      else {
        if (ordenados.length > 0 && ordenados[idx-1] && idx !== 0) {
          ordenados[idx-1].Variaveis.forEach((el) => {
            if (document.getElementById(((el.Prefixo ? el.Prefixo : '') + el.Value).replaceAll(' ', ''))){
              console.log('removi',)
              document.getElementById(((el.Prefixo ? el.Prefixo : '') + el.Value).replaceAll(' ', '')).parentNode.remove();
            }
          })
        } else {
          document.querySelector('video.midia').style.display = 'none'
          document.querySelector('img.midia').style.display = 'block'

          const midiaAtual = document.querySelector('img.midia')
          midiaAtual.setAttribute('src', path.join(__dirname +'/../public/assets/01.jpeg'))
          midiaAtual.style = `
            min-width: 100vw;
            height: 100vh;
            min-height: 100vh;
            position:absolute;
            top:0;

           `
        }


        idx = 0
        ipcRenderer.send('getStoreValue', 'brilho')
        ipcRenderer.send('getStoreValue', 'resolucao')
        ipcRenderer.send('getStoreValue', 'climaTempo')
        ipcRenderer.send('getStoreValue', 'dados')
        console.clear();


      }
    }

  } catch (error) {
    console.log(error)
  }

}
