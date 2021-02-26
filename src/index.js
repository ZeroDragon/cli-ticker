const { charts } = require('./miner')

let timer
const intervaler = async () => {
  clearTimeout(timer)
  await charts()
  timer = setTimeout(intervaler, 60000)
}

intervaler()
