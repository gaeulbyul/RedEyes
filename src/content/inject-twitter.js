const name2Ids = {
  obj: Object.create(null),
  ids: new Set(),
  insert(id, name) {
    const loweredName = name.toLowerCase()
    this.ids.add(id)
    this.obj[loweredName] = id
  },
  hasId(id) {
    return this.ids.has(id)
  },
  clear() {
    this.obj = Object.create(null)
    this.ids.clear()
  },
  toJSON() {
    return this.obj
  },
}

function getReactEventHandlers(elem) {
  for (const key in elem) {
    if (key.startsWith('__reactEventHandlers$')) {
      return elem[key]
    }
  }
  return null
}

function initialize() {
  const reactRoot = document.getElementById('react-root')
  if ('_reactRootContainer' in reactRoot) {
    const store = getReactEventHandlers(reactRoot.children[0]).children.props.children.props.store
    store.subscribe(() => {
      const state = store.getState()
      const userEntities = state.entities.users.entities
      const userIds = Object.keys(userEntities)
      let mapModified = false
      for (const id of userIds) {
        if (name2Ids.hasId(id)) {
          continue
        }
        name2Ids.insert(id, userEntities[id].screen_name)
        mapModified = true
      }
      if (mapModified) {
        const customEvent = new CustomEvent('RedEyes<-UserIds', {
          detail: name2Ids.toJSON(),
        })
        document.body.dispatchEvent(customEvent)
      }
    })
  } else {
    setTimeout(initialize, 500)
  }
}

requestIdleCallback(initialize, {
  timeout: 10000,
})
