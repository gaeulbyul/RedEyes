<script lang="ts">
  import browser from 'webextension-polyfill'
  import * as RedEyesStorage from '../lib/storage'

  import { onMount } from 'svelte'

  let manuallyIdentified: RedEyesManuallyIdentifiedEntries = {}
  // let initialLoading = true

  const validGroup: RedEyesFilterGroup[] = ['toxic', 'friendly', 'neutral']

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
    RedEyesStorage.loadLocalStorageOnly('manuallyIdentified').then(storage => {
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
      <legend>Manually Identified:</legend>
      <div class="tablewrapper">
        <table class="zebra radius">
          <thead>
            <tr>
              <th>Identifier</th>
              <th>Treat as...</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each Object.entries(manuallyIdentified) as [identifier, group] (identifier)}
              <tr>
                <td class="identifier-cell" title={identifier}>
                  {identifier}
                </td>
                <td>
                  <select
                    value={group}
                    on:change|preventDefault={event => handleGroupChange(event, identifier)}
                  >
                    <option value="toxic">Toxic</option>
                    <option value="friendly">Friendly</option>
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
            {:else}
              <tr>
                <td colspan="3"><center>(Nothing here)</center></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="please-refresh">
        Note: You need to refresh the tabs after changing something from here.
      </p>
    </fieldset>
  </section>
</div>

<style>
  @import url('./table.css');
  .identifier-cell {
    overflow-wrap: anywhere;
    white-space: normal;
  }
  .please-refresh {
    font-size: smaller;
  }
</style>
