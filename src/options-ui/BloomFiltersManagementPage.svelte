<script>
  import browser from 'webextension-polyfill'
  import * as RedEyesStorage from '../lib/storage.js'

  import { onMount } from 'svelte'

  const initialDraftFilter = {
    name: '',
    group: 'transphobic',
  }

  let draftFilterFileInput,
    initialLoading = true,
    installedBloomFilters = [],
    showAddingIndicator = false,
    draftFilter = {
      name: '',
      group: 'transphobic',
    }

  function handleRemoveButtonClick(event, item) {
    async function removeFilterById(filterId) {
      installedBloomFilters = installedBloomFilters.filter(bf => {
        return bf.id !== filterId
      })
      const storage = await RedEyesStorage.loadLocalStorage()
      delete storage.filterDatas[filterId]
      return RedEyesStorage.saveLocalStorage({
        filters: installedBloomFilters,
        filterDatas: storage.filterDatas,
      })
    }
    const confirmed = window.confirm(`Are you sure to remove a filter '${item.name}'?`)
    if (!confirmed) {
      return
    }
    //nameElem.textContent += ' (Removing...)'
    removeFilterById(item.id)
  }

  function handleCheckboxToggle(event, item) {
    const enabled = event.target.checked
    const filterToToggle = installedBloomFilters.find(function (f) {
      return f.id === item.id
    })
    if (filterToToggle) {
      filterToToggle.enabled = enabled
    }
    //installedBloomFilters = installedBloomFilters
    RedEyesStorage.saveLocalStorage({
      filters: installedBloomFilters,
    })
  }

  function onStorageChanged(changes) {
    if ('filters' in changes) {
      installedBloomFilters = changes.filters.newValue
    }
  }

  function handleFileChange(event) {
    const { target } = event
    const file = target.files[0]
    if (!file) {
      return
    }
    if (draftFilter.name == '') {
      draftFilter.name = file.name
    }
  }

  function handleFormSubmit(event) {
    const form = event.target
    async function doSubmit() {
      const filterFile = draftFilterFileInput.files[0]
      if (!filterFile) {
        return
      }
      const newFilter = Object.assign(Object.create(null), draftFilter)
      newFilter.id = (Date.now() + Math.random()).toString(36)
      newFilter.enabled = true
      const promise = RedEyesStorage.loadLocalStorage().then(async storage => {
        const { filters, filterDatas } = storage 
        filterDatas[newFilter.id] = await filterFile
          .arrayBuffer()
          .then(ab => new Uint32Array(ab))
          .then(ua => Array.from(ua))
        filters.push(newFilter)
        return RedEyesStorage.saveLocalStorage({ filters, filterDatas })
      })
      draftFilter = Object.assign(Object.create(null), initialDraftFilter)
      form.reset()
      promise.then(() => {
        installedBloomFilters = [...installedBloomFilters, newFilter]
      })
    }
    showAddingIndicator = true
    doSubmit().finally(() => {
      showAddingIndicator = false
    })
  }

  onMount(async () => {
    browser.storage.onChanged.addListener(onStorageChanged)
    RedEyesStorage.loadLocalStorage().then(storage => {
      installedBloomFilters = storage.filters
      initialLoading = false
    })
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  })
</script>

<div>
  <section class="installed-bloom-filters">
    <fieldset>
      <legend>Installed Bloom-filters:</legend>
      <div id="list-of-bloom-filters">
        {#each installedBloomFilters as item (item.id)}
          <div class="filter-item">
            <div class="toggle">
              <input
                type="checkbox"
                class="toggle-checkbox"
                checked={item.enabled}
                on:change|preventDefault={event => handleCheckboxToggle(event, item)}
              />
            </div>
            <div class="name">
              &lt;{item.group}&gt;
              {item.name}
            </div>
            <div class="actions">
              <input
                type="button"
                class="remove-button"
                value="Remove"
                on:click|preventDefault={event => handleRemoveButtonClick(event, item)}
              />
            </div>
          </div>
        {:else}
          {#if initialLoading}
            Loading...
          {:else}
            There\' no filters in here. Add from the form below!
          {/if}
        {/each}
      </div>
    </fieldset>
  </section>
  <section class="new-bloom-filter">
    <fieldset>
      <legend>New Bloom-filter:</legend>
      <form id="new-bloom-filter-form" on:submit|preventDefault={handleFormSubmit}>
        <label>
          File:
          <br />
          <input
            type="file"
            name="filter-data"
            required
            on:change={handleFileChange}
            bind:this={draftFilterFileInput}
          />
        </label>
        <br />
        <label>
          Name:
          <br />
          <input type="text" name="filter-name" required size="30" bind:value={draftFilter.name} />
        </label>
        <br />
        <label>
          Group:
          <br />
          <select name="filter-group" required bind:value={draftFilter.group}>
            <option value="transphobic"> Transphobic </option>
            <option value="trans_friendly"> Trans-Friendly </option>
          </select>
        </label>
        <hr />
        <div class="new-filter-actions">
          <input type="submit" value="Add" />
          <input type="reset" value="Clear form" />
          {#if showAddingIndicator}
            <div id="adding-indicator">Adding...</div>
          {/if}
        </div>
      </form>
    </fieldset>
  </section>
</div>
