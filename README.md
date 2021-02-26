Cli Ticker
======================

# Requeriments:
- Node 14

# Installation
- Clone this repo
- `npm install`

# Settings
All settings are done using a `settings.yaml` file in the root of the repo
There is a `settings.example.yaml` that you can copy and use.

```yaml
fiat: usd
coins:
  - name: Bitcoin
    coinId: bitcoin
    qty: 1
    fiat: 45000
    showChart: true
```

fiat: is the fiat reference to cross the price of all coins selected
inside coins, you must select at last the name and the coinID

name: the name of the coin to show
coinId: must be the same as used in coingecko
qty: How many of this coins you have on your portfolio
fiat: How much fiat you invest so far on this coin
showChart: true or false to show the last 24hrs of data for this coin

# Start
just type `npm start`

# Screenshot


Any questions, t.me/zerodragon
Powered by coingecko
