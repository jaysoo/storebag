const { makeStore, startStore, makeLogger } = require('storebag')
const cart = require('./cart')

global.fetch = require('isomorphic-fetch')

const store = makeStore(cart)

makeLogger(store)

startStore(store)
