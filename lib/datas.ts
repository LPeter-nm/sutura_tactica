// lib/datas.ts

// Uma data de calendário (como recebido_em) não tem hora — então nunca
// deveria passar por conversão de fuso horário nenhuma. Em vez de
// criar um objeto Date (que obriga a escolher ALGUM fuso pra
// interpretar o texto), a gente só lê os pedaços do texto direto.
// É mais simples, e é à prova de rodar em qualquer servidor, em
// qualquer lugar do mundo.
export function formatarDataBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

// Para os cálculos de período (hoje, semana, mês), usamos Date, mas
// sempre ancorados em UTC por dentro — isso evita que a própria
// matemática de "mais 6 dias" ou "último dia do mês" deslize por
// causa do fuso do servidor. Só na ENTRADA (saber que dia é hoje,
// de verdade, em Fortaleza) é que o fuso importa.
function hojeFortalezaISO() {
  // en-CA formata como AAAA-MM-DD, convenientemente.
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Fortaleza',
  })
}

function paraISO(data: Date) {
  return data.toISOString().slice(0, 10)
}

function somarDias(dataISO: string, dias: number) {
  const [ano, mes, dia] = dataISO.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  data.setUTCDate(data.getUTCDate() + dias)
  return paraISO(data)
}

export function periodoHoje() {
  const hoje = hojeFortalezaISO()
  return { de: hoje, ate: hoje }
}

export function periodoEstaSemana() {
  const hoje = hojeFortalezaISO()
  const [ano, mes, dia] = hoje.split('-').map(Number)
  const diaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay() // 0 = domingo
  const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana

  return {
    de: somarDias(hoje, diffParaSegunda),
    ate: somarDias(hoje, diffParaSegunda + 6),
  }
}

export function periodoEsteMes() {
  const hoje = hojeFortalezaISO()
  const [ano, mes] = hoje.split('-').map(Number)
  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  // Dia 0 do "mês seguinte" é sempre o último dia do mês atual.
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  const fim = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

  return { de: inicio, ate: fim }
}