const CoinGecko = require('coingecko-api')
const asciichart = require('asciichart')
const { printTable } = require('console-table-printer')
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

const charts = async () => {
  const { coins, fiat } = await loadSettings()
  const chartsP = coins.map(async coin => await getCoinChart(coin.coinId, fiat))
  const metaP = coins.map(async coin => {
    const meta = await getCoinMeta(coin.coinId, fiat)
    return { ...coin, ...meta }
  })
  const metas = await Promise.all(metaP)
  const charts = await Promise.all(chartsP)
  console.clear()
  const portfolio = []
  const table = charts
    .map(({ chart, coin }) => {
      const meta = JSON.parse(JSON.stringify(metas.find(c => c.coinId === coin)))
      delete meta.coinId
      const changeColor = { true: 'green', false: 'red' }[meta.change > 0]
      const hours = {}
      const qty = (meta.qty || 0)
      chart.prices
        .forEach(([time, price]) => {
          const t = new Date(time)
          const half = Math.floor(t.getMinutes() / 30) * 30
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
      return {
        Trading: tradingName,
        Value: `$${meta.price.toLocaleString()}`.yellow,
        Qty: `${qty.toLocaleString()}`.yellow,
        Diff: `${change}%`[changeColor],
        Holding: `$${portValue.toLocaleString()}`.blue,
        Delta: `$${diff.toLocaleString()}`[fiatColor]
      }
    })
  printTable(table)
  const portValue = portfolio.reduce((acum, curr) => acum + parseFloat(curr), 0)
  const d = new Date()
  const z = i => `00${i}`.slice(-2)
  const displayDate = `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`.black
  const powered = 'Powered by Coingecko.com'.black
  const fullPortfolio = `$${portValue.toLocaleString()}`.green
  process.stdout.write(` Total Portfolio: ${fullPortfolio}      ${displayDate}      ${powered}`)
}

module.exports = {
  charts
}
