/*
 * Functions for creating stores, and managing modules.
 */
const { map, merge, makeSubject, makeBehaviorSubject, forEach, filter, pipe, scan, take } = require('callbag-ext')

const ofType = type => filter(x => x.type === type)

const makeStore = module => {
  const state = makeBehaviorSubject(module.state)
  const fx = makeSubject()
  const evt = makeSubject()

  const commit = (type, payload) => evt(1, { type, payload })

  const dispatch = (type, payload) => fx(1, { type, payload })

  // Gets the last state value once.
  const getState = () => pipe(state, take(1))

  return {
    module,
    commit,
    dispatch,
    getState,
    streams: {
      state,
      fx,
      evt
    }
  }
}

const startStore = store => {
  const { streams, dispatch, module } = store
  const { state, evt, fx } = streams
  const {
    effects,
    update,
    created = () => {},
    state: initialState
  } = module
  const registered = []

  if (effects) {
    Object.keys(effects).forEach(type => {
      const run = effects[type]
      registered.push(pipe(fx, ofType(type), forEach(fx => run(store, fx.payload))))
    })
  }

  if (update) {
    const fold = (state, evt) => {
      const nextState = update[evt.type]

      if (nextState) {
        return nextState(state, evt)
      } else {
        return state
      }
    }

    const scanner = scan(fold, initialState)
    const sink = forEach(s => state(1, s))

    registered.push(pipe(evt, scanner, sink))
  }

  // Informs module that it is created.
  created(store)
}

const combineModules = modules => {}

const mapString = prefix => map(x => `[${prefix}] ${JSON.stringify(x, null, 2)}`)

const makeLogger = ({ streams: { fx, evt, state } }) =>
  pipe(
    merge(mapString('fx')(fx), mapString('evt')(evt), mapString('state')(state)),
    forEach(msg => {
      console.log(msg)
      console.log()
    })
  )

module.exports = {
  makeStore,
  startStore,
  ofType,
  combineModules,
  makeLogger
}
