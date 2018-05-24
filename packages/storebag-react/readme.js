/*
 * React bindings for storebag.
 */
import * as React from 'react'
import { makeStore, startStore } from 'storebag'
import { map, pipe, forEach, tap } from 'callbag-ext'

const makeComponent = ({ render: Render, ...module }) => {
  const store = makeStore(module)
  class StoreAdapter extends React.Component {
    constructor(props) {
      super(props)
      this.state = store.module.state
    }

    componentWillMount() {
      pipe(store.streams.state, forEach(state => this.setState(state)))
    }

    render() {
      return <Render {...this.props} state={this.state} dispatch={store.dispatch}/>
    }
  }

  startStore(store)

  return props =>
    <StoreAdapter {...props} />
}

export { makeComponent }
