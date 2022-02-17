<script lang="ts">
  import browser from 'webextension-polyfill'
  // import * as RedEyesStorage from '../lib/storage.js'
  import BloomFiltersManagementPage from './BloomFiltersManagementPage.svelte'
  import ManuallyIdentifiedAccounts from './ManuallyIdentifiedAccounts.svelte'
  import PreferencesPage from './PreferencesPage.svelte'

  import { onMount } from 'svelte'

  const validTab = ['filters', 'manually-identified', 'preferences'] as const
  type TabPage = typeof validTab[number]
  let activatedTab = 'filters' // 'filters' | 'manually-identified'

  function switchTab(page: TabPage) {
    if (!validTab.includes(page)) {
      throw new Error(`error: page "%s" is not valid!`)
    }
    activatedTab = page
  }

  function footerText() {
    const { name, version_name, version } = browser.runtime.getManifest()
    return `${name} v${version_name || version}`
  }

  onMount(async () => {
    // does something
    return () => {
      // cleanup
    }
  })
</script>

<div class="app">
  <nav class="tabbar">
    <input
      type="button"
      class="tab"
      value="Filters"
      class:activated={activatedTab == 'filters'}
      on:click|preventDefault={() => switchTab('filters')}
    />
    <input
      type="button"
      class="tab"
      value="M.I."
      class:activated={activatedTab == 'manually-identified'}
      on:click|preventDefault={() => switchTab('manually-identified')}
    />
    <input
      type="button"
      class="tab"
      value="Preferences"
      class:activated={activatedTab == 'preferences'}
      on:click|preventDefault={() => switchTab('preferences')}
    />
  </nav>
  <div class="tabpage" class:activated={activatedTab == 'filters'}>
    <BloomFiltersManagementPage />
  </div>
  <div class="tabpage" class:activated={activatedTab == 'manually-identified'}>
    <ManuallyIdentifiedAccounts />
  </div>
  <div class="tabpage" class:activated={activatedTab == 'preferences'}>
    <PreferencesPage />
  </div>
  <footer id="footer">
    {footerText()}
  </footer>
</div>

<style>
  .tabbar {
    display: flex;
    margin: 4px 5px 0;
  }
  .tab {
    flex: 1;
    border: 0;
    margin: 0;
    padding: 0.5em 0;
    font-size: larger;
    background-color: transparent;
    border-bottom: 2px solid grey;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    transition: background-color 0.2s;
  }
  .tab:hover {
    background-color: lightgrey;
  }
  .tab.activated {
    border-top: 2px solid grey;
    border-left: 2px solid grey;
    border-right: 2px solid grey;
    border-bottom: 0;
    background-color: lightgrey;
    font-weight: bold;
  }
  .tabpage {
    padding: 5px 10px;
    display: none;
  }
  .tabpage.activated {
    display: block;
  }
</style>
