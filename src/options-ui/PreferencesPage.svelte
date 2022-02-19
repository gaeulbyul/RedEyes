<script lang="ts">
  import browser from 'webextension-polyfill'
  import * as RedEyesStorage from '../lib/storage'
  import colorPresets from '../lib/color-presets'

  import { debounce } from 'debounce'
  import { onMount } from 'svelte'

  let currentColors: RedEyesColors = {
    ...RedEyesStorage.defaultStorage.colors
  }

  let excludedSites: string[] = [
    ...RedEyesStorage.defaultStorage.excludedSites
  ]

  $: excludedSitesAsText = (excludedSites || []).join('\n')

  function onStorageChanged(changes: any) {
    if ('colors' in changes) {
      currentColors = changes.colors.newValue
    }
    if ('excludedSites' in changes) {
      excludedSites = changes.excludedSites.newValue
    }
  }

  function onColorChanged(_event: Event) {
    RedEyesStorage.saveLocalStorage({ colors: currentColors })
  }

  function onPresetApplyButtonClicked(_event: Event, presetColors: RedEyesColors) {
    currentColors = { ...presetColors }
    RedEyesStorage.saveLocalStorage({ colors: currentColors })
  }

  const debouncedUpdateExcludedSites = debounce((text: string) => {
    const sites = text.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
    excludedSites = sites
    console.info(excludedSites)
    RedEyesStorage.saveLocalStorage({ excludedSites })
  }, 300)

  function handleExcluedSitesTextareaChange(event: Event) {
    const textarea = event.target! as HTMLTextAreaElement
    const text = textarea.value || ''
    debouncedUpdateExcludedSites(text)
  }

  onMount(async () => {
    browser.storage.onChanged.addListener(onStorageChanged)
    RedEyesStorage.loadLocalStorageOnly(['colors', 'excludedSites']).then(storage => {
      currentColors = storage.colors
      excludedSites = storage.excludedSites
    })
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  })
</script>

<div>
  <section class="preferences-page">
    <fieldset>
      <legend>Colors:</legend>
      <div class="tablewrapper">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Toxic Light</th>
              <th>Friendly Light</th>
              <th>Toxic Dark</th>
              <th>Friendly Dark</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Current:</td>
              <td>
                <input type="color" class="colorpicker"
                bind:value={currentColors.toxicLight}
                on:change={onColorChanged}
                title={currentColors.toxicLight}
                style="border-color: {currentColors.toxicLight}"
                />
              </td>
              <td>
                <input type="color" class="colorpicker"
                bind:value={currentColors.friendlyLight}
                on:change={onColorChanged}
                title={currentColors.friendlyLight}
                style="border-color: {currentColors.friendlyLight}"
                />
              </td>
              <td class="dark">
                <input type="color" class="colorpicker"
                bind:value={currentColors.toxicDark}
                on:change={onColorChanged}
                title={currentColors.toxicDark}
                style="border-color: {currentColors.toxicDark}"
                />
              </td>
              <td class="dark">
                <input type="color" class="colorpicker"
                bind:value={currentColors.friendlyDark}
                on:change={onColorChanged}
                title={currentColors.friendlyDark}
                style="border-color: {currentColors.friendlyDark}"
                />
              </td>
            </tr>
            <tr style="padding-top: 10px">
              <td colspan="5">Preset</td>
            </tr>
            {#each Object.values(colorPresets) as preset}
              <tr>
                <td>
                  <input type="button" value="Apply"
                  on:click|preventDefault={event => onPresetApplyButtonClicked(event, preset)} />
                </td>
                <td>
                  <div class="preset-color-item" style="background-color:{preset.toxicLight}">
                </td>
                <td>
                  <div class="preset-color-item" style="background-color:{preset.friendlyLight}">
                </td>
                <td class="dark">
                  <div class="preset-color-item" style="background-color:{preset.toxicDark}">
                </td>
                <td class="dark">
                  <div class="preset-color-item" style="background-color:{preset.friendlyDark}">
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </fieldset>
    <fieldset>
      <legend>Excluded Sites:</legend>
      <p>RedEyes won't run on these websites. Enter hostnames(eg. example.com) by line.</p>
      <textarea
        class="excluded-sites-textarea"
        on:change={handleExcluedSitesTextareaChange}
        value={excludedSitesAsText}
      ></textarea>
    </fieldset>
  </section>
</div>

<style>
/* @import url('./table.css'); */

.colorpicker {
  display: inline-block;
  width: 40px;
  height: 40px;
  margin: 15px 0;
  padding: 0px;
  border: 4px outset;
  border-radius: 15%;
  background-color: transparent;
  cursor: pointer;
  -webkit-appearance: none;
}

.colorpicker:active {
  border-style: inset;
}

.colorpicker::-moz-color-swatch {
  padding: 0;
  border-radius: 10%;
  border: 0;
}

.colorpicker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.colorpicker::-webkit-color-swatch {
  padding: 0;
  border: 0;
  background-color: transparent;
}

.preset-color-item {
  display: inline-block;
  width: 40px;
  height: 40px;
  margin: 6px 0;
  border: 0;
  border-radius: 100%;
  box-shadow: 0 3px 3px 0 #3333;
}

td {
  text-align: center;
}

.excluded-sites-textarea {
  width: 100%;
  min-height: 10em;
  padding: 0.5em;
  resize: vertical;
  font-size: 16px;
  font-family: monospace;
}
</style>
