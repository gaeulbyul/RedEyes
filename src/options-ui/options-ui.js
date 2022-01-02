import * as RedEyesStorage from '../lib/storage.js'

function updateListOfBloomFilters(bfilters) {
  const listElem = document.getElementById('list-of-bloom-filters')
  listElem.innerHTML = ''
  if (bfilters.length <= 0) {
    listElem.textContent = 'There\' no filters in here. Add from the form below!'
    return
  }
  const itemTemplate = document.getElementById('filter-item-template')
  for (const item of bfilters) {
    const itemElem = document.importNode(itemTemplate.content, true)
    const nameElem = itemElem.querySelector('.name')
    const removeButtonElem = itemElem.querySelector('.actions .remove-button')
    const toggleCheckboxElem = itemElem.querySelector('.toggle-checkbox')
    nameElem.textContent = `(${item.group}) ${item.name}`
    removeButtonElem.onclick = event => {
      event.preventDefault()
      const confirmed = window.confirm(`Are you sure to remove a filter '${item.name}'?`)
      if (!confirmed) {
        return
      }
      nameElem.textContent += ' (Removing...)'
      RedEyesStorage.removeFilterById(item.id)
    }
    toggleCheckboxElem.checked = item.enabled
    toggleCheckboxElem.onchange = event => {
      event.preventDefault()
      RedEyesStorage.toggleFilter(item.id, event.target.checked)
    }
    listElem.appendChild(itemElem)
  }
}

const newBloomFilterForm = document.getElementById('new-bloom-filter-form')
newBloomFilterForm.onchange = event => {
  const form = newBloomFilterForm
  const filterNameElem = form.elements['filter-name']
  const filterDataElem = form.elements['filter-data']
  if (filterDataElem.files[0] && filterNameElem.value == '') {
      filterNameElem.value = filterDataElem.files[0].name
  }
}
newBloomFilterForm.onsubmit = event => {
  event.preventDefault()
  async function handleSubmit() {
    const form = newBloomFilterForm
    const storage = await RedEyesStorage.loadLocalStorage()
    const { filters, filterDatas } = storage
    const newFilter = {}
    newFilter.id = Math.random().toString()
    newFilter.enabled = true
    newFilter.name = form.elements['filter-name'].value
    newFilter.group = form.elements['filter-group'].value
    {
      const filterDataElem = form.elements['filter-data']
      const filterFile = filterDataElem.files[0]
      if (!filterFile) {
        return
      }
      filterDatas[newFilter.id] = await filterFile.arrayBuffer()
        .then(ab => new Uint32Array(ab))
        .then(ua => Array.from(ua))
    }
    filters.push(newFilter)
    RedEyesStorage.saveLocalStorage({ filters, filterDatas })
    form.reset()
  }
  const addingIndicator = document.getElementById('adding-indicator')
  addingIndicator.hidden = false
  handleSubmit().finally(() => {
    addingIndicator.hidden = true
  })
}

function updateFooter() {
  const { name, version_name, version } = browser.runtime.getManifest()
  const footer = document.getElementById('footer')
  footer.textContent = `${name} v${version_name || version}`
}

function listenStorageChange() {
  browser.storage.onChanged.addListener(changes => {
    if ('filters' in changes) {
      updateListOfBloomFilters(changes.filters.newValue)
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  updateFooter()
  listenStorageChange()
  RedEyesStorage.loadLocalStorage().then(storage => {
    updateListOfBloomFilters(storage.filters)
  })
})
