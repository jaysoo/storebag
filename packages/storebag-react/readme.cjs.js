'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');

/*
 * React bindings for storebag.
 */

const StoreContext = React.createContext(null);

class StoreProvider extends React.Component {
  render() {
    return React.createElement(StoreContext.Provider, { value: this.props.value });
  }
}

const StoreConsumer = StoreContext.Consumer;

exports.StoreProvider = StoreProvider;
exports.StoreConsumer = StoreConsumer;
