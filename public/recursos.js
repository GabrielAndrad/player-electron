
function sendPin(){
  let pin = document.querySelector('input').value
  let body = {"Pin": pin }
  let statusCliente

  const {ipcRenderer} = require('electron')

  ipcRenderer.send('enviaPin',body)

  ipcRenderer.on('enviaPinResponse',(event,texto) => {
  
      console.log(texto,'texto')
      ipcRenderer.send('loadingPage',true)
      
      let tmp = 1
      const espera = setInterval(() => {
        if(tmp == 5){
          ipcRenderer.send('loopVideo',true)      
          clearInterval(espera)
        }
        else{
          tmp++
        }
      }, 1000);

  })
  // fetch('http://localhost:4000/getpin',{
  //   method: "POST",
  //   body: JSON.stringify(body),
  //   headers: {"Content-type": "application/json; charset=UTF-8"}
  // })
  // .then(resp => resp.text())
  // .then(function(texto){
   
  // })

}

  let btnEnviarPin = document.querySelector('#btnEnviarPin')
  btnEnviarPin.addEventListener('click',(e)=>{
    e.preventDefault()
    sendPin()
  })