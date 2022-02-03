import browser from 'webextension-polyfill'
import * as RedEyesStorage from '../lib/storage'
import { getIdentifier } from '../lib/identifier'

const targetUrlPatterns = [
  'https://twitter.com/*',
  'https://mobile.twitter.com/*',
  'https://*.facebook.com/*',
  'https://*.youtube.com/*',
  'https://*.medium.com/*',
  'https://*.medium.com/*',
  'https://*.tumblr.com/*',
  'https://*.reddit.com/r/*',
  'https://*.reddit.com/user/*',
  'https://*.wikipedia.org/wiki/*',
  'https://rationalwiki.org/wiki/*',
]

async function manuallyIdentify(urlstr: string, group: RedEyesFilterGroup) {
  const identifier = getIdentifier(urlstr)
  if (!identifier) {
    // TODO: 적절한 alert메시지?
    return
  }
  const { manuallyIdentified } = await RedEyesStorage.loadLocalStorageOnly('manuallyIdentified')
  manuallyIdentified[identifier] = group
  return RedEyesStorage.saveLocalStorage({
    manuallyIdentified,
  })
}

browser.contextMenus.onClicked.addListener((clickInfo, _tab) => {
  const { linkUrl } = clickInfo
  if (!linkUrl) {
    return
  }
  switch (clickInfo.menuItemId) {
    case 'manually-identify-as-phobic':
      manuallyIdentify(linkUrl, 'phobic')
      break
    case 'manually-identify-as-friendly':
      manuallyIdentify(linkUrl, 'friendly')
      break
    case 'manually-identify-as-neutral':
      manuallyIdentify(linkUrl, 'neutral')
      break
  }
})

export async function initializeContextMenus() {
  await browser.contextMenus.removeAll()

  browser.contextMenus.create({
    contexts: ['link'],
    id: 'manually-identify-submenus',
    targetUrlPatterns,
    title: 'Identify this as...',
  })

  browser.contextMenus.create({
    contexts: ['link'],
    parentId: 'manually-identify-submenus',
    id: 'manually-identify-as-phobic',
    targetUrlPatterns,
    title: '&Phobic',
  })

  browser.contextMenus.create({
    contexts: ['link'],
    parentId: 'manually-identify-submenus',
    id: 'manually-identify-as-friendly',
    targetUrlPatterns,
    title: '&Friendly',
  })

  browser.contextMenus.create({
    contexts: ['link'],
    parentId: 'manually-identify-submenus',
    id: 'manually-identify-as-neutral',
    targetUrlPatterns,
    title: '&Neutral',
  })
}
