const fs = require('fs')
const { join } = require('path')
const yaml = require('yaml')

const defaults = {
  coins: [{ name: 'Bitcoin', coinId: 'bitcoin' }],
  fiat: 'usd'
}

const getFile = async () => {
  const dataFile = join(__dirname, '../settings.yaml')
  return new Promise(resolve => {
    fs.readFile(dataFile, { encoding: 'utf8' }, (err, string) => {
      if (err) return resolve('{}')
      return resolve(string)
    })
  })
}

const loadSettings = async () => {
  const stringSettings = await getFile()
  const settings = yaml.parse(stringSettings)
  const customSettings = Object.assign(
    JSON.parse(JSON.stringify(defaults)),
    settings
  )
  return customSettings
}

module.exports = {
  loadSettings
}
