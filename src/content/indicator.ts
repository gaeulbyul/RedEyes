const DBG_tooltip = false

const REDEYES_ATTR_NAME = 'data-redeyes'

const elemToIdentifierMap = new WeakMap<Element, string>()

function paintColorToElement(elem: HTMLElement, group: RedEyesFilterGroup) {
  removeIndicate(elem)
  const className = groupToClassName(group)
  elem.classList.add(className)
  elem.setAttribute(REDEYES_ATTR_NAME, group)
  const spans = elem.querySelectorAll('span')
  spans.forEach(span => {
    span.classList.add(className)
    span.setAttribute(REDEYES_ATTR_NAME, group)
  })
}

function groupToClassName(group: RedEyesFilterGroup): string {
  switch (group) {
    case 'friendly':
      return 'redeyes-friendly'
    case 'toxic':
      return 'redeyes-toxic'
    case 'neutral':
      return 'redeyes-neutral'
  }
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

function removeAttributeAndClassNames(elem: HTMLElement) {
  elem.removeAttribute(REDEYES_ATTR_NAME)
  elem.classList.remove('redeyes-friendly')
  elem.classList.remove('redeyes-toxic')
  elem.classList.remove('redeyes-neutral')
}

export function removeIndicate(elem: HTMLElement) {
  if (!document.body.contains(elem)) {
    return
  }
  removeAttributeAndClassNames(elem)
  const selector = `
    [${REDEYES_ATTR_NAME}],
    .redeyes-friendly,
    .redeyes-toxic,
    .redeyes-neutral
  `
  elem.querySelectorAll<HTMLElement>(selector).forEach(removeAttributeAndClassNames)
}
