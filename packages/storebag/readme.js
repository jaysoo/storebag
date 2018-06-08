/*
 * Functions for creating stores, and managing modules.
 */
const {
  map,
  merge,
  makeSubject,
  makeBehaviorSubject,
  forEach,
  filter,
  pipe,
  scan,
  take
} = require('callbag-ext')

const ofType = type => filter(x => x.type === type)

const makeStore = module => {
  const state = makeBehaviorSubject(module.state)
  const fx = makeSubject()
  const evt = makeSubject()
  const streams = {
    state,
    fx,
    evt
  }
  const commit = (type, payload) => evt(1, { type, payload })
  const dispatch = (type, payload) => fx(1, { type, payload })
  const getState = () => pipe(state, take(1))

  const store = {
    commit,
    dispatch,
    getState,
    streams
  }

  start(store, module)

  return store
}

const start = (store, module) => {
  const { streams } = store
  const { state, evt, fx } = streams
  const { effects, update, created = () => {}, state: initialState } = module

  if (effects) {
    Object.keys(effects).forEach(type => {
      const run = effects[type]
      pipe(fx, ofType(type), forEach(fx => run(store, fx.payload)))
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
    pipe(evt, scanner, sink)
  }

  // Informs module that it is created.
  created(store)
}

const combineStores = ({ nested, local }) => {
  const state = makeBehaviorSubject({})
  const fx = makeSubject()
  const evt = makeSubject()
  let lastState = {}

  Object.keys(nested).forEach(namespace => {
    pipe(
      nested[namespace].streams.state,
      forEach(slice => {
        lastState = {
          ...lastState,
          [namespace]: slice
        }
        state(1, lastState)
      })
    )

    pipe(
      nested[namespace].streams.evt,
      forEach(e => evt(1, { type: `${namespace}/${e.type}`, payload: e.payload }))
    )

    pipe(
      nested[namespace].streams.fx,
      forEach(f => fx(1, { type: `${namespace}/${f.type}`, payload: f.payload }))
    )
  })

  const streams = { state, evt, fx }

  const commit = (type, payload) => {
    const [ns, t] = type.split('/')
    nested[ns].commit(t, payload)
  }

  const dispatch = (type, payload) => {
    const [ns, t] = type.split('/')
    nested[ns].dispatch(t, payload)
  }

  const getState = () => pipe(state, take(1))

  return {
    commit,
    dispatch,
    getState,
    streams
  }
}

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
  ofType,
  combineStores,
  makeLogger
}
