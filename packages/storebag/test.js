const { pipe, forEach } = require('callbag-ext')
const storebag = require('./readme')

const inventory = {
  state: { items: {} },
  update: {
    inventoryAdded: (state, { payload }) => {
      const existing = state.items[payload.sku]
      return {
        items: {
          ...state.items,
          [payload.sku]: {
            sku: payload.sku,
            quantity: existing ? existing.quantity + payload.quantity : payload.quantity
          }
        }
      }
    },
    inventoryRemoved: (state, { payload }) => {
      const existing = state.items[payload.sku]
      return {
        items: {
          ...state.items,
          [payload.sku]: {
            sku: payload.sku,
            quantity: existing ? existing.quantity - payload.quantity : -payload.quantity
          }
        }
      }
    },
    inventoryLoaded: (state, { payload }) => ({
      items: payload.reduce((acc, item) => {
        acc[item.sku] = item
        return acc
      }, {})
    })
  },
  effects: {
    fetchInventory: ({ commit }) => {
      commit('inventoryLoaded', [
        {
          sku: '1',
          quantity: 10
        },
        {
          sku: '2',
          quantity: 0
        }
      ])
    },
    addInventory: ({ commit }, payload) => commit('inventoryAdded', payload),
    removeInventory: ({ commit }, payload) => commit('inventoryRemoved', payload)
  }
}

test('store effects', done => {
  const store = storebag.makeStore(inventory)

  store.dispatch('fetchInventory')
  store.dispatch('addInventory', { sku: '2', quantity: 5 })
  store.dispatch('addInventory', { sku: '2', quantity: 1 })
  store.dispatch('removeInventory', { sku: '1', quantity: 3 })

  pipe(
    store.getState(),
    forEach(state => {
      expect(state.items).toEqual({
        1: { sku: '1', quantity: 7 },
        2: { sku: '2', quantity: 6 }
      })
      done()
    })
  )
})

test('combine stores', done => {
  const a = storebag.makeStore(inventory)
  const b = storebag.makeStore(inventory)
  const c = storebag.combineStores({
    local: {},
    nested: {
      a,
      b
    }
  })
  const eventsA = []
  const eventsB = []
  const eventsC = []
  const fxC = []

  pipe(a.streams.evt, forEach(evt => eventsA.push(evt)))
  pipe(b.streams.evt, forEach(evt => eventsB.push(evt)))
  pipe(c.streams.evt, forEach(evt => eventsC.push(evt)))
  pipe(c.streams.fx, forEach(evt => fxC.push(evt)))

  a.dispatch('addInventory', { sku: '2', quantity: 10 })
  c.dispatch('b/addInventory', { sku: '2', quantity: 5 })
  c.dispatch('b/removeInventory', { sku: '2', quantity: 3 })
  c.dispatch('a/addInventory', { sku: '2', quantity: 7 })
  c.dispatch('a/addInventory', { sku: '2', quantity: 10 })

  pipe(
    c.getState(),
    forEach(state => {
      expect(state).toEqual({
        a: { items: { '2': { quantity: 27, sku: '2' } } },
        b: { items: { '2': { quantity: 2, sku: '2' } } }
      })

      expect(eventsA).toEqual([
        { payload: { quantity: 10, sku: '2' }, type: 'inventoryAdded' },
        { payload: { quantity: 7, sku: '2' }, type: 'inventoryAdded' },
        { payload: { quantity: 10, sku: '2' }, type: 'inventoryAdded' }
      ])
      expect(eventsB).toEqual([
        { payload: { quantity: 5, sku: '2' }, type: 'inventoryAdded' },
        { payload: { quantity: 3, sku: '2' }, type: 'inventoryRemoved' }
      ])
      expect(eventsC).toEqual([
        { payload: { quantity: 10, sku: '2' }, type: 'a/inventoryAdded' },
        { payload: { quantity: 5, sku: '2' }, type: 'b/inventoryAdded' },
        { payload: { quantity: 3, sku: '2' }, type: 'b/inventoryRemoved' },
        { payload: { quantity: 7, sku: '2' }, type: 'a/inventoryAdded' },
        { payload: { quantity: 10, sku: '2' }, type: 'a/inventoryAdded' }
      ])
      expect(fxC).toEqual([
        { payload: { quantity: 10, sku: '2' }, type: 'a/addInventory' },
        { payload: { quantity: 5, sku: '2' }, type: 'b/addInventory' },
        { payload: { quantity: 3, sku: '2' }, type: 'b/removeInventory' },
        { payload: { quantity: 7, sku: '2' }, type: 'a/addInventory' },
        { payload: { quantity: 10, sku: '2' }, type: 'a/addInventory' }
      ])
      done()
    })
  )
})
