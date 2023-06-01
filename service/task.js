const cron = require('node-cron')
const { store,baixaTemplate,verificarUpdate } = require('../store/store')
const api = require('./api')
const socket = require('./socket')
const Track = require('./track')
const localStorage = require('localStorage')

const task = cron.schedule('* * * * *',() => {
  try {
    Track('CHECKEI NA AGENDA POR NOVAS ATUALIZACOES')
    const json = { "Pin": store.get('pin')}

      const token = store.get('token')

      // if(token){
      //   baixaTemplate(token)
      //   verificarUpdate(token) 
      // } else {
        api.post('/Login/aplicativo',json, (error, response, body) => {
          if(body){
              const UsuarioId = body.UsuarioId
        
              if(UsuarioId != 0 && !!body.Token){
                const token = body.Token.token
                
                socket.CheckSocket()            
        
                store.set('token',token)
                localStorage.setItem('token',token)
                baixaTemplate(token)
                  verificarUpdate(token)
            }
          }
        
          })
      // }
  
   
  } catch (error) {
      Track(`Falha ao checkar na agenda, ${error}`)
  }

})

const createTask = () => {
  try {
    task.start()  
  } catch (error) {
    console.log(error)
  }
}

module.exports = {createTask}
