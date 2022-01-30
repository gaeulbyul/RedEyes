import browser from 'webextension-polyfill'

import { loadLocalStorageOnly, defaultStorage } from '../lib/storage'

// https://davidwalsh.name/css-variables-javascript

const currentColors: RedEyesColors = {
  ...defaultStorage.colors
}

const currentColorScheme = {
  dark: false
}

export function applyColors(colors: RedEyesColors) {
  Object.assign(currentColors, colors)
  const isDark = currentColorScheme.dark
  const colorForPhobic = isDark ? colors.phobicDark : colors.phobicLight
  const colorForFriendly = isDark ? colors.friendlyDark : colors.friendlyLight
  document.body.style.setProperty('--redeyes-var-phobic', colorForPhobic)
  document.body.style.setProperty('--redeyes-var-friendly', colorForFriendly)
}

export function toggleDarkMode(isDark: boolean) {
  currentColorScheme.dark = isDark
  applyColors(currentColors)
}

export function initColors() {
  browser.storage.onChanged.addListener((changes: any) => {
    if (!('colors' in changes)) {
      return
    }
    applyColors(changes.colors.newValue)
  })
  
  loadLocalStorageOnly('colors').then(({colors}) => applyColors(colors))
}
