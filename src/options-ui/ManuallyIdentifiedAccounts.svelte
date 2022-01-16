<script lang="ts">
  import browser from 'webextension-polyfill'
  import * as RedEyesStorage from '../lib/storage'

  import { onMount } from 'svelte'

  let manuallyIdentified: RedEyesManuallyIdentifiedEntries = {}
  // let initialLoading = true
  
  const validGroup: RedEyesFilterGroup[] = ['transphobic', 'trans_friendly', 'neutral']

  function handleRemoveButtonClick(_event: MouseEvent, identifier: string) {
    const confirmed = window.confirm(`Are you sure to remove a identifier '${identifier}'?`)
    if (!confirmed) {
      return
    }
    //nameElem.textContent += ' (Removing...)'
    delete manuallyIdentified[identifier]
    manuallyIdentified = manuallyIdentified
    RedEyesStorage.saveLocalStorage({ manuallyIdentified })
  }

  function handleGroupChange(event: Event, identifier: string) {
    const { target } = event
    if (!(target instanceof HTMLSelectElement)) {
      throw new Error('unreachable')
    }
    const newGroup = target.value as RedEyesFilterGroup
    if (!validGroup.includes(newGroup)) {
      throw new Error(`unknown group: "${newGroup}"`)
    }
    manuallyIdentified[identifier] = newGroup
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
            {#each Object.entries(manuallyIdentified) as [identifier, group]}
              <tr>
                <td>{identifier}</td>
                <td>
                  <select
                    value={group}
                    on:change|preventDefault={event => handleGroupChange(event, identifier)}
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
                    on:click|preventDefault={event => handleRemoveButtonClick(event, identifier)}
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
