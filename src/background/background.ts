import browser from 'webextension-polyfill'
import * as RedEyesStorage from '../lib/storage'

import { initializeContextMenus } from './context-menus'

initializeContextMenus()

async function initStorage() {
  const storage = Object.create(null)
  Object.assign(storage, RedEyesStorage.defaultStorage)
  await RedEyesStorage.saveLocalStorage(storage)
}

browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason != 'install') {
    return
  }
  initStorage()
})

