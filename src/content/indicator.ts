const DBG_tooltip = false

function paintColorToElement(elem: HTMLElement, group: RedEyesFilterGroup) {
  const className = groupToClassName(group)
  elem.classList.add(className)
  elem.setAttribute('data-redeyes', group)
  const spans = elem.querySelectorAll('span')
  spans.forEach(span => {
    span.classList.add(className)
    span.setAttribute('data-redeyes', group)
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
