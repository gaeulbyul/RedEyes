<script lang="ts">
  import browser from 'webextension-polyfill'
  import * as RedEyesStorage from '../lib/storage'

  import { onMount } from 'svelte'

  let manuallyIdentified: RedEyesManuallyIdentifiedEntry[] = []
  // let initialLoading = true

  function handleRemoveButtonClick(_event: MouseEvent, item: RedEyesManuallyIdentifiedEntry) {
    const confirmed = window.confirm(`Are you sure to remove a identifier '${item.identifier}'?`)
    if (!confirmed) {
      return
    }
    //nameElem.textContent += ' (Removing...)'
    manuallyIdentified = manuallyIdentified.filter(mi => mi.identifier !== item.identifier)
    RedEyesStorage.saveLocalStorage({ manuallyIdentified })
  }

  function handleGroupChange(event: Event, item: RedEyesManuallyIdentifiedEntry) {
    const { target } = event
    if (!(target instanceof HTMLSelectElement)) {
      throw new Error('unreachable')
    }
    const newGroup = target.value
    const miToChange = manuallyIdentified.find(mi => mi.identifier === item.identifier)
    if (!miToChange) {
      return
    }
    miToChange.group = newGroup
    manuallyIdentified = manuallyIdentified
    RedEyesStorage.saveLocalStorage({ manuallyIdentified })
  }

  function onStorageChanged(changes: any) {
    if ('manuallyIdentified' in changes) {
      manuallyIdentified = changes.manuallyIdentified.newValue
    }
  }

  onMount(async () => {
    browser.storage.onChanged.addListener(onStorageChanged)
    RedEyesStorage.loadLocalStorage().then(storage => {
      manuallyIdentified = storage.manuallyIdentified
      // initialLoading = false
    })
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  })
</script>

<div>
  <section class="manually-identified-accounts">
    <fieldset>
      <legend>M.I.:</legend>
      <div class="tablewrapper">
        <table>
          <thead>
            <tr>
              <th>Identifier</th>
              <th>Treat as...</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each manuallyIdentified as item}
              <tr>
                <td>{item.identifier}</td>
                <td>
                  <select
                    value={item.group}
                    on:change|preventDefault={event => handleGroupChange(event, item)}
                  >
                    <option value="transphobic">Transphobic</option>
                    <option value="trans_friendly">Trans-Friendly</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </td>
                <td>
                  <input
                    type="button"
                    value="Remove"
                    on:click|preventDefault={event => handleRemoveButtonClick(event, item)}
                  />
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </fieldset>
  </section>
</div>

<style>
  .tablewrapper {
    padding: 5px;
    border: 1px solid grey;
    border-radius: 4px;
  }
  table {
    width: 100%;
    border: 0;
    border-collapse: collapse;
  }

  td:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  td:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  tr:nth-of-type(even) {
    background-color: wheat;
  }

  th {
    border-bottom: 3px double grey;
  }

  th,
  td {
    padding: 0 0.5em;
  }
</style>
