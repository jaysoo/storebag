/*
 * Combines useful callbags functions + new utilities.
 */
const basics = require('callbag-basics')
const makeSubject = require('callbag-subject')
const makeBehaviorSubject = require('callbag-behavior-subject')
const dropRepeats = require('callbag-drop-repeats')

module.exports = {
  ...basics,
  makeSubject,
  makeBehaviorSubject,
  dropRepeats,
  tap: f => basics.map(x => (f(x), x)),
  flatMap: f => src => basics.pipe(src, basics.map(f), basics.flatten)
}
