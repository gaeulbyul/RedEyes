import browser from 'webextension-polyfill'
import { getIdentifier } from '../lib/identifier'
import * as RedEyesStorage from '../lib/storage'

const targetUrlPatterns = [
  'https://twitter.com/*',
  'https://mobile.twitter.com/*',
  'https://*.facebook.com/*',
  'https://*.youtube.com/c/*',
  'https://*.youtube.com/channel/*',
  'https://*.youtube.com/user/*',
  'https://*.youtube.com/redirect?*',
  'https://*.medium.com/*',
  'https://*.tumblr.com/*',
  'https://*.reddit.com/r/*',
  'https://*.reddit.com/user/*',
  'https://*.wikipedia.org/wiki/*',
  'https://rationalwiki.org/wiki/*',
  'https://github.com/*',
  'https://*.github.io/*',
  'https://t.co/*',
]

const tcoCache = new Map<string, string>()

async function manuallyIdentify(identifier: string, group: RedEyesFilterGroup) {
  const { manuallyIdentified } = await RedEyesStorage.loadLocalStorageOnly('manuallyIdentified')
  manuallyIdentified[identifier] = group
  return RedEyesStorage.saveLocalStorage({
    manuallyIdentified,
  })
}

async function resolveTwitterShortLink(url: URL) {
  const responseText = await fetch(url.toString(), {
    method: 'get',
    referrer: 'https://twitter.com/home',
  }).then(resp => resp.text())
  // Manifest v3에선 DOMParser등 DOM 관련 API를 사용할 수 없다.
  // 따라서 그냥 정규식을 사용한다.
  // meta http-equiv=redirect나 location.replace(...)에서 URL을 가져올 것.
  const match = /;URL=([^\x22]+)/.exec(responseText)
  return match ? match[1] : null
}

async function identifyViaContextMenu(clickInfo: browser.Menus.OnClickData, tab: browser.Tabs.Tab) {
  const linkUrl = new URL(clickInfo.linkUrl!)
  const tabId = tab.id!

  let tcoResolvedLinkUrl: string | null = null
  if (linkUrl.hostname === 't.co') {
    const tcoPath = linkUrl.pathname.slice(1)
    if (tcoCache.has(tcoPath)) {
      tcoResolvedLinkUrl = tcoCache.get(tcoPath)!
    } else {
      tcoResolvedLinkUrl = await resolveTwitterShortLink(linkUrl)
      if (tcoResolvedLinkUrl) {
        tcoCache.set(tcoPath, tcoResolvedLinkUrl)
      }
    }
  }

  const identifier = getIdentifier(tcoResolvedLinkUrl || linkUrl)
  if (!identifier) {
    const msg: REMessageToContent.Alert = {
      messageTo: 'content',
      messageType: 'Alert',
      text: `RedEyes can't identify such url: "${linkUrl}"`,
    }
    if (tcoResolvedLinkUrl) {
      msg.text += ` / (t.co)"${tcoResolvedLinkUrl}"`
    }
    browser.tabs.sendMessage(tabId, msg)
    return
  }
  const repaintMsg: REMessageToContent.RepaintIdentifier = {
    messageTo: 'content',
    messageType: 'RepaintIdentifier',
    identifier,
    group: 'neutral',
  }
  switch (clickInfo.menuItemId) {
    case 'manually-identify-as-toxic':
      manuallyIdentify(identifier, 'toxic')
      browser.tabs.sendMessage(tabId, { ...repaintMsg, group: 'toxic' })
      break
    case 'manually-identify-as-friendly':
      manuallyIdentify(identifier, 'friendly')
      browser.tabs.sendMessage(tabId, { ...repaintMsg, group: 'friendly' })
      break
    case 'manually-identify-as-neutral':
      manuallyIdentify(identifier, 'neutral')
      browser.tabs.sendMessage(tabId, { ...repaintMsg, group: 'neutral' })
      break
  }
}

browser.contextMenus.onClicked.addListener((clickInfo, tab) => {
  const { linkUrl } = clickInfo
  if (!(linkUrl && tab)) {
    return
  }
  if (/^manually-identify-as-/.test(clickInfo.menuItemId.toString())) {
    identifyViaContextMenu(clickInfo, tab)
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
    id: 'manually-identify-as-toxic',
    targetUrlPatterns,
    title: '&Toxic',
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
