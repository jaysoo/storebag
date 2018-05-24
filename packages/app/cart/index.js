const { pipe, forEach } = require('callbag-ext')
const api = require('./api')

module.exports = {
  state: {
    items: []
  },
  update: {
    itemsLoaded: (state, payload) => ({
      ...state,
      items: payload
    })
  },
  // This effect is called automatically upon module initialization.
  created: ({ dispatch }) => {
    // We want to fetch initial cart items as soon are this module initializes.
    dispatch('fetchItems')
  },
  effects: {
    fetchItems: ({ commit, getState }, payload) =>
      // We're able to get the current state (if we need it for effects logic).
      pipe(
        getState(), // This will get the last state value.
        forEach(state => {
          console.log(`Current payload: ${JSON.stringify(payload)}`)
          console.log(`Current state: ${JSON.stringify(state)}\n`)
          api.fetchCartItems().then(data => commit('itemsLoaded', data))
        }))
  }
}
