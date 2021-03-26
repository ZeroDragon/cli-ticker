const CoinGecko = require('coingecko-api')
const asciichart = require('asciichart')
const { Table } = require('console-table-printer')
const { loadSettings } = require('./settings')
require('consolecolors')

const client = new CoinGecko()

const getCoinChart = async (coin, fiat) => {
  const { data: chart } = await client.coins.fetchMarketChart(coin, {
    vs_currency: fiat, days: 1
  })
  return { chart, coin }
}

const getCoinMeta = async (coin, fiat) => {
  const { data } = await client.coins.fetch(coin, {
    localization: false,
    tickers: false,
    community_data: false,
    developer_data: false
  })
  const price = data.market_data.current_price[fiat]
  const change = data.market_data.price_change_percentage_24h
  return { price, change }
}

const parseCoins = (coins, joinCoins) => {
  if (!joinCoins) return coins
  const dic = {}
  coins.forEach(coin => {
    if (!dic[coin.coinId]) {
      dic[coin.coinId] = coin
      return
    }
    const dCoin = dic[coin.coinId]
    dCoin.qty = (dCoin.qty || 0) + coin.qty
    dCoin.fiat = (dCoin.fiat || 0) + coin.fiat
  })
  return Object.values(dic)
}

const charts = async () => {
  const {
    coins: pCoins, fiat, hideColumns: hCol, joinCoins = false
  } = await loadSettings()
  const coins = parseCoins(pCoins, joinCoins)
  const hideColumns = hCol || []
  const chartsP = coins.map(async (coin, id) => {
    const chartData = await getCoinChart(coin.coinId, fiat)
    return { id, chartData }
  })
  const metaP = coins.map(async (coin, id) => {
    const meta = await getCoinMeta(coin.coinId, fiat)
    return { ...coin, ...meta, id }
  })
  const metas = await Promise.all(metaP)
  const charts = await Promise.all(chartsP)
  console.clear()
  const portfolio = []
  const cutOff = {
    0: 20,
    1: 29,
    2: 30
  }[hideColumns.length]
  const table = charts
    .map(({ id, chartData: { chart, coin } }) => {
      const meta = JSON.parse(JSON.stringify(metas.find(c => c.id === id)))
      const changeColor = { true: 'green', false: 'red' }[meta.change > 0]
      const hours = {}
      const qty = (meta.qty || 0)
      chart.prices
        .forEach(([time, price]) => {
          const t = new Date(time)
          const half = Math.floor(t.getMinutes() / cutOff) * cutOff
          hours[`${t.getDate()}${t.getHours()}${half}`] = price
        })
      const displayChart = asciichart.plot(
        Object.values(hours),
        {
          height: 5,
          colors: [asciichart[changeColor]]
        }
      )
      const portValue = meta.price * qty
      portfolio.push(portValue)
      const change = meta.change.toFixed(2)
      const diff = portValue - (meta.fiat || 0)
      const fiatColor = ({ true: 'green', false: 'red' }[diff >= 0])
      const tradingName = `${meta.name.toUpperCase()} - ${fiat.toUpperCase()}`.magenta
      if (meta.showChart) {
        console.log(tradingName)
        console.log(displayChart)
        console.log('')
      }
      const tableData = {
        Trading: tradingName,
        Value: `$${meta.price.toLocaleString()}`.yellow,
        Qty: `${qty.toLocaleString()}`.yellow,
        Diff: `${change}%`[changeColor],
        Holding: `$${portValue.toLocaleString()}`.blue,
        Investment: `$${(meta.fiat || 0).toLocaleString()}`.blue,
        Delta: `$${diff.toLocaleString()}`[fiatColor]
      }
      hideColumns.forEach(hCol => {
        delete tableData[hCol]
      })
      return tableData
    })
  const tbl = new Table()
  tbl.addRows(table)
  tbl.printTable()
  const tblWidth = tbl.table.columns
    .map(({ max_ln: size }) => size + 3)
    .reduce((acum, prev) => acum + prev)
  const portValue = portfolio.reduce((acum, curr) => acum + parseFloat(curr), 0)
  const fullPortfolio = `$${portValue.toLocaleString()}`.green
  const leftText = `Total Portfolio: ${fullPortfolio}`
  const powered = 't.me/ZeroDragon'.padStart(tblWidth + 11 - leftText.length).magenta
  process.stdout.write(`${leftText}${powered}`)
}

module.exports = {
  charts
}
