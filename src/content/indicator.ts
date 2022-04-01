const DBG_tooltip = false

const REDEYES_ATTR_NAME = 'data-redeyes'

function paintColorToElement(elem: HTMLElement, group: RedEyesFilterGroup) {
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

function setIdentifierAttribute(elem: HTMLElement, identifier: string) {
  elem.setAttribute('data-redeyes-identifier', identifier)
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
  setIdentifierAttribute(elem, identifier)
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
  const elems = document.querySelectorAll<HTMLElement>(`[data-redeyes-identifier="${identifier}"]`)
  elems.forEach(elem => {
    paintColorToElement(elem, group)
  })
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
  elem.querySelectorAll<HTMLElement>(selector)
    .forEach(removeAttributeAndClassNames)
}
