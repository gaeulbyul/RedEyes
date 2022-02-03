import browser from 'webextension-polyfill'
import * as RedEyesStorage from '../lib/storage'

const targetUrlPatterns = [
  'https://twitter.com/*',
  'https://mobile.twitter.com/*',
]

async function addTwitterIdentifier(urlstr: string, group: RedEyesFilterGroup) {
  const url = new URL(urlstr)
  const validHostnames = ['twitter.com', 'mobile.twitter.com']
  if (!validHostnames.includes(url.hostname)) {
    throw new Error('unexpected hostname')
  }
  let userName = url.pathname.split('/')[1]
  if (!userName) {
    console.error('invalid userName: "%s"', userName)
  }
  userName = userName.toLowerCase()
  const identifier = `twitter.com/${userName}`
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
    case 'twitter-add-identifier-phobic':
      addTwitterIdentifier(linkUrl, 'phobic')
      break
    case 'twitter-add-identifier-friendly':
      addTwitterIdentifier(linkUrl, 'friendly')
      break
    case 'twitter-add-identifier-neutral':
      addTwitterIdentifier(linkUrl, 'neutral')
      break
  }
})

export async function initializeContextMenus() {
  await browser.contextMenus.removeAll()

  browser.contextMenus.create({
    contexts: ['link'],
    id: 'twitter-add-identifier',
    targetUrlPatterns,
    title: 'Identify this as...',
  })

  browser.contextMenus.create({
    contexts: ['link'],
    parentId: 'twitter-add-identifier',
    id: 'twitter-add-identifier-phobic',
    targetUrlPatterns,
    title: 'Phobic',
  })

  browser.contextMenus.create({
    contexts: ['link'],
    parentId: 'twitter-add-identifier',
    id: 'twitter-add-identifier-friendly',
    targetUrlPatterns,
    title: 'Friendly',
  })

  browser.contextMenus.create({
    contexts: ['link'],
    parentId: 'twitter-add-identifier',
    id: 'twitter-add-identifier-neutral',
    targetUrlPatterns,
    title: 'Neutral',
  })
}
