import browser from 'webextension-polyfill'
import { repaintIdentifier } from './indicator'

export function listenExtensionMessage() {
  browser.runtime.onMessage.addListener(message_ => {
    const message = message_ as RedEyesMessageToContent
    if (message.messageTo != 'content') {
      return
    }
    switch (message.messageType) {
      case 'Alert':
        window.alert(message.text)
        return
      case 'RepaintIdentifier':
        repaintIdentifier(message.identifier, message.group)
    }
  })
}
