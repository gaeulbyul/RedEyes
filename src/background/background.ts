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
  const { manuallyIdentified } = await RedEyesStorage.loadLocalStorageOnlyManuallyIdentified()
  manuallyIdentified.push({
    identifier,
    group,
  })
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
    case 'twitter-add-identifier-transphobic':
      addTwitterIdentifier(linkUrl, 'transphobic')
      break
    case 'twitter-add-identifier-transfriendly':
      addTwitterIdentifier(linkUrl, 'trans_friendly')
      break
    case 'twitter-add-identifier-neutral':
      addTwitterIdentifier(linkUrl, 'neutral')
      break
  }
})

async function initializeContextMenus() {
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
    id: 'twitter-add-identifier-transphobic',
    targetUrlPatterns,
    title: 'Transphobic',
  })

  browser.contextMenus.create({
    contexts: ['link'],
    parentId: 'twitter-add-identifier',
    id: 'twitter-add-identifier-transfriendly',
    targetUrlPatterns,
    title: 'Trans-Friendly',
  })

  browser.contextMenus.create({
    contexts: ['link'],
    parentId: 'twitter-add-identifier',
    id: 'twitter-add-identifier-neutral',
    targetUrlPatterns,
    title: 'Neutral',
  })
}

initializeContextMenus()
