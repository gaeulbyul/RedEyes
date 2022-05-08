const DBG_tooltip = true

const REDEYES_ATTR_NAME = 'data-redeyes'
const elemToIdentifierMap = new WeakMap<Element, string>()

function paintColorToElement(elem: HTMLElement, group: RedEyesFilterGroup) {
  removeIndicate(elem)
  elem.setAttribute(REDEYES_ATTR_NAME, group)
  const spans = elem.querySelectorAll('span')
  spans.forEach(span => {
    span.setAttribute(REDEYES_ATTR_NAME, group)
  })
}

function generateTooltip(identifier: string, filter: MatchedFilter): string {
  let tooltip = '[RedEyes]:\n'
  tooltip += `identifier: "${identifier}"\n`
  tooltip += `name: "${filter.name}"\n`
  tooltip += `group: "${filter.group}"\n`
  return tooltip
}

export function indicateElement(elem: HTMLElement, identifier: string, filters: MatchedFilter[]) {
  if (!document.body.contains(elem)) {
    return
  }
  elemToIdentifierMap.set(elem, identifier)
  document.addEventListener('REDEYES repaint', event => {
    const customEvent = event as CustomEvent
    const { identifier, group } = customEvent.detail
    if (!document.contains(elem)) {
      return
    }
    if (identifier != elemToIdentifierMap.get(elem)) {
      return
    }
    paintColorToElement(elem, group)
  })
  if (filters.length <= 0) {
    return
  }
  const firstFilter = filters[0]!
  if (DBG_tooltip) {
    const tooltip = generateTooltip(identifier, firstFilter)
    elem.title = tooltip
  }
  paintColorToElement(elem, firstFilter.group)
}

export function repaintIdentifier(identifier: string, group: RedEyesFilterGroup) {
  document.dispatchEvent(
    new CustomEvent('REDEYES repaint', {
      detail: {
        identifier,
        group,
      },
    })
  )
}

function removeRedEyesAttribute(elem: HTMLElement) {
  elem.removeAttribute(REDEYES_ATTR_NAME)
}

export function removeIndicate(elem: HTMLElement) {
  if (!document.body.contains(elem)) {
    return
  }
  removeRedEyesAttribute(elem)
  const selector = `[${REDEYES_ATTR_NAME}]`
  elem.querySelectorAll<HTMLElement>(selector).forEach(removeRedEyesAttribute)
}
