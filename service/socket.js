const signalR = require('@microsoft/signalr');
const baseUrl = require('../settings').baseUrl;
const post = require('./api').post
const https = require('https')
const fs = require('fs')
const localStorage = require('localStorage')
const api = require('./api');

class SocketClass {

    Local;
    message;
    hubConnection;
    chatId;

    StartSocket = (pin) => {
        this.sendLog("Creating Socket...");
        this.openSocketChannel(pin);
    }


    openSocketChannel = (pin) => {
        //Propria documentacao fala pra ignorar esse erro
         
            console.log('PIN',pin)
        
            this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(baseUrl + "/playerhubopen/?pin=" + pin,{
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .build();
        
            this.hubConnection.on('ReceiveMessage', message => {
                const text = `${message}`;
                const args = message.split(';')
                console.log('text',text,args);
                alteraBrilho(args)
                const {store} = require('../store/store')
                console.log(store.get('fetch'))

                if(text == "clear"){
                    console.log('clear')
                    store.set('clear',true)
                }
                if(text == "fetch" && !store.get('fetch')){
                    console.log('entrei aqui')
                    const json = { "Pin": localStorage.getItem('pin')?localStorage.getItem('pin'):store }
                    console.log(json)
                    store.set('fetch',true)
                    setTimeout(() => {
                        store.set('fetch',false)
                    },10000)
                    
                    // if(token){
                    //     const {verificarUpdate,baixaTemplate} = require('../store/store')
                    //     baixaTemplate(token,'uploadAgain')
                    //     verificarUpdate(token,'uploadAgain') 
                    // } else {
                        api.post('/Login/aplicativo',json, (error, response, body) => {
                            if(body){
                                const UsuarioId = body.UsuarioId
                          
                                if(UsuarioId != 0 && !!body.Token){
                                  const token = body.Token.token
                                  const {verificarUpdate,baixaTemplate} = require('../store/store')
                                  baixaTemplate(token,'uploadAgain')
                                  localStorage.setItem('token',token)
                                  verificarUpdate(token,'uploadAgain') 
                                  }
                            }
                          
                            })
                    // }
                    
                }
               
            });

            this.hubConnection.on('Disconnected', () => {
                this.sendLog(this.hubConnection.lastError.message);
            });

            this.hubConnection.onreconnecting((error) => {
                this.sendLog("reconectando...");
            });

            this.start(pin);
}
    

    start = (pin) => {
        console.log('START',pin)
        this.hubConnection.start()
            .then((response) =>  {
                this.sendLog("socket connected")
            })
            .catch(err => { 
                console.log(err,JSON.stringify(err))
                post(`Log/error`, { Pin: pin, VideoId: 0, Msg: "Error Socket: " + JSON.stringify(err) }, () => {})
            });
    }

    sendLog = async (text) => {

        try {
            const msg = JSON.stringify(text);

            if(this.hubConnection == undefined){
                this.logLocal(msg);
                return;
            }

            if(!this.chatId){
                this.logLocal(msg);
                return;
            }

            if(this.hubConnection == undefined){
                this.logLocal(msg);
                return;
            }

            this.logLocal(msg);
            this.hubConnection.invoke("SendMessageToPlayer", this.chatId, msg).catch(err => console.error(err));
            
        } catch (err) {
            console.error(err);
        }
    }

    logLocal = (msg) => {
        console.log(msg);
    }

    CheckSocket(pin){
        const { store } = require('../store/store')
        const { pinCliente } = store.get('pin')?store.get('pin'):localStorage.getItem('pin')?localStorage.getItem('pin'):''

       Track(`Checkei o socket - ${this.hubConnection.connectionId} - ${this.hubConnection.state}`)
        if(this.hubConnection == null){
            this.sendLog("socket is null")
            this.StartSocket(pinCliente);
            return;
        }

        if( this.hubConnection.state == 'Connecting' || 
            this.hubConnection.state == 'Connected' || 
            this.hubConnection.state == 'Disconnecting' || 
            this.hubConnection.state == 'Reconnecting' ){
            return;
        }

        if(this.hubConnection.connectionId == null){   
            this.sendLog("socket connectionId is null")
            this.StartSocket(pinCliente);
            return;
        }

        
    }
}

const alteraBrilho = (args) => {
    if(args[0] == "brilho"){
        // const brightness = require('brightness');
       
        // const brilho = `0.${args[1] == '100'?99:args[1]}`
        // brightness.set(+brilho).then(() => {
        //     console.log(`Changed brightness to ${args[1]}`);
        // });
        localStorage.setItem('brilho',args[1])
    }
      
}
let socket = new SocketClass();

module.exports = socket;