const express = require('express');
const app = express();
const fs = require('fs')
const https = require('https')
const tokenCliente = require('./tokenCliente')
const token = tokenCliente.tokenCliente


module.exports.controlarVigencia = function(){
  const dados = JSON.parse(fs.readFileSync('dados.json'))
  dados.Midias.forEach(vg=>{
    const FimVigencia = vg.FimVigencia
    const dataAtual = new Date()
    if (dataAtual < FimVigencia){
      console.log('excluir arquivo')
         
      // fs.unlink(`./public/${video}` ,err =>{
      //   if(err){
      //     throw err
      //   }
      // })
      // vg.Calendario = []

       return false
    }
    else{
      return true
    }
  })
}