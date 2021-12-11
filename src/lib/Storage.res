// disable warning: All the fields are already explicitly listed in this record. You can remove the `...` spread.
@@warning("-23")

@val external browser: 'browser = "browser"

type redEyesStorage = {filters: array<SharedTypes.redEyesFilterWithData>}

let defaultStorage: redEyesStorage = {
  filters: [],
}

let loadLocalStorage = (): Promise.t<redEyesStorage> => {
  %raw(`
    browser.storage.local.get().then(stored => ({
      ...defaultStorage,
      ...stored,
    }))
  `)
}

let saveLocalStorage = (data: redEyesStorage): unit => {
  browser["storage"]["local"]["set"](data)
}

let removeFilterById = (filterId: string): Promise.t<unit> => {
  open Promise
  open Js.Array2
  loadLocalStorage()->thenResolve(storage => {
    let {filters} = storage
    let filters = filters->filter(f => f.id != filterId)
    saveLocalStorage({...storage, filters: filters})
  })
}

let toggleFilter = (filterId: string, enabled: bool): Promise.t<unit> => {
  open Promise
  open Js.Array2
  loadLocalStorage()->thenResolve(storage => {
    let {filters} = storage
    let filterToToggle = filters->find(f => f.id == filterId)
    switch (filterToToggle) {
      | Some(f) => %raw("(f,e) => {f.enabled = e}")(f, enabled)
      | None => ()
    }
    saveLocalStorage({...storage, filters: filters})
  })
}
