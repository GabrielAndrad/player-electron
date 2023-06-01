module.exports.calendario = function (dados) {
  let validado = false
  const semana = {
    "Dom": 0,
    "Seg": 1,
    "Ter": 2,
    "Qua": 3,
    "Qui": 4,
    "Sex": 5,
    "Sab": 6
  }
  
  if(dados.Calendario.length === 0){
    validado = true
  } else {
    if(dados.Delete){
      validado = false
    } else {
      dados.Calendario.forEach(cal => {
        const diaSemana = cal.DiasSemana.substring(0, cal.DiasSemana.lastIndexOf(';')).split(';')
        const hoje = Object.keys(semana).find(key => semana[key] === (new Date().getDay()));
        const hora = new Date().getHours()
        const minuto = new Date().getMinutes()
    
        
        diaSemana.forEach(dia => {
          if (dia == hoje) {
            if (hora >= cal.InicioHora && hora <= cal.FimHora) {
              if (cal.InicioHora === cal.FimHora) {
                if (minuto >= cal.InicioMinuto && minuto <= cal.FimMinuto) {
                  validado = true
                  return validado
                }
              } else {
                if (hora === cal.InicioHora) {
                       30
                  if (minuto >= cal.InicioMinuto) {
                    validado = true
                    return validado
                  }
                } else {
                  if (hora === cal.FimHora) {
                    if (minuto <= cal.FimMinuto) {
                      validado = true
                      return validado
                    }
                  } else {
                    validado = true
                    return validado
                  }
    
                }
              }
            }
          }
        })
      })
    }
   
  }
   
  return validado
}

module.exports.diasSemana = function (cal) {
  const semana = {
    "Dom": 0,
    "Seg": 1,
    "Ter": 2,
    "Qua": 3,
    "Qui": 4,
    "Sex": 5,
    "Sab": 6
  }
  const hoje = Object.keys(semana).find(key => semana[key] === (new Date().getDay()));
  const diaSemana = cal.DiasSemana.substring(0, cal.DiasSemana.lastIndexOf(';')).split(';')


  let validado = false
  diaSemana.forEach(dia => {
    if (dia == hoje) {
      validado = true
    }
  })

  return validado
}
module.exports.calendarioInicioHora = function (cal) {
  let validado = false
  const semana = {
    "Dom": 0,
    "Seg": 1,
    "Ter": 2,
    "Qua": 3,
    "Qui": 4,
    "Sex": 5,
    "Sab": 6
  }
 
  if(!cal){
    validado = true
  } else {
        const diaSemana = cal.DiasSemana.substring(0, cal.DiasSemana.lastIndexOf(';')).split(';')
        const hoje = Object.keys(semana).find(key => semana[key] === (new Date().getDay()));
        const hora = new Date().getHours()
        const minuto = new Date().getMinutes()
    
        
        diaSemana.forEach(dia => {
          if (dia == hoje) {
            if (hora >= cal.InicioHora) {
              
                if (hora === cal.InicioHora) {
                  if (minuto >= cal.InicioMinuto) {
                    validado = true
                    return validado
                  }
                } else {
                      validado = true
                      return validado
                }
            } else {
              validado = false
              return validado
            }
          }
        })
  }
   
  return validado
}