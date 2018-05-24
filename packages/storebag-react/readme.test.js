import * as React from 'react'
import { mount } from 'enzyme'
import { makeComponent, StoreConsumer, StoreProvider } from './readme'
import { pipe, forEach } from 'callbag-ext'


describe('makeComponent', () => {
  test('component renders and reacts to changes', () => {
    const Component = makeComponent({
      state: { todos: [] },
      update: {
        todosLoaded: (state, evt) => {
          return { ...state, todos: evt.todos }
        },
        todoAdded: (state, evt) => {
          return { ...state, todos: state.todos.concat([evt.payload]) }
        },
        todoComplete: (state, evt) => {
          const todo = state.todos.find(t => t.id === evt.payload)
          if (todo) {
            return {
              ...state,
              todos: state.todos.map(t => {
                if (t === todo) {
                  return { ...t, completed: true }
                } else return t
              })
            }
          } else {
            return state
          }
        }
      },
      effects: {
        loadTodos: ({ commit }) => commit({ type: 'todosLoaded', todos: [{ id: 1, text: 'do this', completed: false }] }),
        addTodo: ({ commit }, text) => commit('todoAdded', { id: next(), text, completed: false }),
        markComplete: ({ commit }, id) => commit('todoComplete', id)
      },
      render: props =>
        <div>
          <ul>
            {props.state.todos.map(todo => <li key={todo.id} className={todo.completed ? 'js-completed' : ''}>
              {todo.text}
              <a onClick={() => props.dispatch('markComplete', todo.id)}>x</a>
            </li>)}
          </ul>
          <button onClick={(() => props.dispatch('addTodo', 'Hello'))}>
            Add
          </button>
        </div>
    })

    const wrapper = mount(<Component />)

    expect(wrapper.text()).toEqual('Add')

    wrapper.find('button').simulate('click')
    expect(wrapper.html()).toMatch(/Hello/)
    expect(wrapper.html()).not.toMatch(/js-completed/)

    wrapper.find('a').simulate('click')
    expect(wrapper.html()).toMatch(/js-completed/)
  })
})

let id = 1
function next() {
  return id++
}

function toJSON(c) {
  if (typeof c === 'string') {
    return c
  } else {
    return { type: c.type, className: c.props.className, children: c.children.map(toJSON) }
  }
}
