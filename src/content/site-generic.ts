/*
import * as Filtering from '../lib/filtering'
import { getAddedElementsFromMutations } from './common'
import { initColors, toggleDarkMode } from './colors'

function isTwitter() {

}

function main() {
  //handleDarkMode()
  initColors()
  const touched = new WeakSet()
  const elemObserver = new MutationObserver(mutations => {
    for (const elem of getAddedElementsFromMutations(mutations)) {
      if (touched.has(elem)) {
        return
      }
      touched.add(elem)

    }
  })
  elemObserver.observe(document.body, {
    subtree: true,
    childList: true,
  })
}

// 트위터는 별도의 스크립트가 있으므로, location을 갖고 트위터여부를 체크하고
// 트위터에선 main을 실행하지 않도록
// main()
*/
