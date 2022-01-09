<script>
  import browser from 'webextension-polyfill'
  import * as RedEyesStorage from '../lib/storage.js'

  import { onMount } from 'svelte'

  let draftFilterFileInput,
    initialLoading = true,
    installedBloomFilters = [],
    showAddingIndicator = false,
    draftFilter = {
      name: '',
      group: 'transphobic',
    }

  function handleRemoveButtonClick(event, item) {
    const confirmed = window.confirm(`Are you sure to remove a filter '${item.name}'?`)
    if (!confirmed) {
      return
    }
    //nameElem.textContent += ' (Removing...)'
    installedBloomFilters = installedBloomFilters.filter((bf) => bf.id !== item.id)
    RedEyesStorage.removeFilterById(item.id)
  }

  function handleCheckboxToggle(event, item) {
    const enabled = event.target.checked
    RedEyesStorage.toggleFilter(item.id, enabled)
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
      const newFilter = Object.assign(Object.create(null), draftFilter)
      newFilter.id = Math.random().toString()
      newFilter.enabled = true
      installedBloomFilters = [...installedBloomFilters, newFilter]
      const storage = await RedEyesStorage.loadLocalStorage()
      const { filters, filterDatas } = storage
      {
        const filterFile = draftFilterFileInput.files[0]
        if (!filterFile) {
          return
        }
        filterDatas[newFilter.id] = await filterFile
          .arrayBuffer()
          .then((ab) => new Uint32Array(ab))
          .then((ua) => Array.from(ua))
      }
      filters.push(newFilter)
      RedEyesStorage.saveLocalStorage({ filters, filterDatas })
      form.reset()
    }
    showAddingIndicator = true
    doSubmit().finally(() => {
      showAddingIndicator = false
    })
  }

  function footerText() {
    const { name, version_name, version } = browser.runtime.getManifest()
    return `${name} v${version_name || version}`
  }

  onMount(async () => {
    browser.storage.onChanged.addListener(onStorageChanged)
    RedEyesStorage.loadLocalStorage().then((storage) => {
      installedBloomFilters = storage.filters
      initialLoading = false
    })
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  })
</script>

<div class="app">
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
                on:change|preventDefault={(event) => handleCheckboxToggle(event, item)}
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
                on:click|preventDefault={(event) => handleRemoveButtonClick(event, item)}
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
  <footer id="footer">
    {footerText()}
  </footer>
</div>
