@val external browser: 'browser = "browser"

@val @scope("window")
external confirm: string => bool = "confirm"

let s = React.string
external any: 'a => 'b = "%identity"

module ListOfFilters = {
  @react.component
  let make = (~bloomFilters: array<SharedTypes.redEyesFilter>) => {
    let onRemoveButtonClicked = (event, bfilter: SharedTypes.redEyesFilter) => {
      ReactEvent.Mouse.preventDefault(event)
      let confirmed = confirm(`Are you sure to remove a filter '${bfilter.name}'?`)
      if confirmed {
        Storage.removeFilterById(bfilter.id)->ignore
      }
    }
    let onCheckboxToggled = (event, bfilter: SharedTypes.redEyesFilter) => {
      ReactEvent.Form.preventDefault(event)
      let target = %raw("({target}) => target")(event)
      let enabled: bool = target["checked"]
      target["disabled"] = true
      Storage.toggleFilter(bfilter.id, enabled)->Promise.finally(() => {
        target["disabled"] = false
      })->ignore
    }
    <div className="list-of-filters">
      {Belt.Array.map(bloomFilters, bf => {
        let key = bf.id
        let group = (bf.group :> string)
        let name = s(`[${group}] ${bf.name}`)
        <div className="filter-item" key>
          <input type_="checkbox" checked={bf.enabled} onChange={ev => onCheckboxToggled(ev, bf)} />
          <div className="name"> name </div>
          <div>
            <input type_="button" value="Remove" onClick={ev => onRemoveButtonClicked(ev, bf)} />
          </div>
        </div>
      })->React.array}
    </div>
  }
}

module FiltersUI = {
  let generateRandomId = (): string => {
    let id = Js.Date.now() +. Js.Math.random()
    Js.Float.toStringWithRadix(id, ~radix=36)
  }

  let castToArray = uint32Array => {
    let uint32Array = any(uint32Array)
    Js.Array.from(uint32Array)
  }

  let readFileFromInput = elem => {
    let elem = any(elem)
    let maybeFile = if elem["files"]["length"] > 0 {
      Js.Nullable.toOption(elem["files"][0])
    } else {
      None
    }
    switch maybeFile {
    | Some(file) => {
      let fileName: string = file["name"]
      file["arrayBuffer"](.)->Promise.thenResolve(ab => {
        Some((fileName, Js.TypedArray2.Uint32Array.make(ab)))
      })
      }
    | None => Promise.resolve(None)
    }
  }

  type draftFilterAction =
    | SetName(string)
    | SetGroup(SharedTypes.filterGroup)
    | SetData(array<int>)
    | ResetForm

  let initialState: SharedTypes.redEyesFilterWithData = {
    id: generateRandomId(),
    enabled: true,
    name: "",
    group: #transphobic,
    data: [],
  }
  let draftFilterReducer = (state: SharedTypes.redEyesFilterWithData, action) => {
    switch action {
    | SetName(name) => {...state, name: name}
    | SetGroup(group) => {...state, group: group}
    | SetData(data) => {...state, data: data}
    | ResetForm => {...initialState, id: generateRandomId()}
    }
  }
  @react.component
  let make = () => {
    let (bloomFilters, setBloomFilters) = React.useState((_): array<
      SharedTypes.redEyesFilter,
    > => [])
    let (draftFilter, dispatchToDraftFilter) = React.useReducer(draftFilterReducer, initialState)
    let (loadingIndicator, setLoadingIndicator) = React.useState(_ => false)
    React.useEffect0(() => {
      let listener = changes => {
        let filtersInChanges = %raw("'filters'in changes")
        if filtersInChanges {
          setBloomFilters(changes["filters"]["newValue"])
        }
      }
      let () = browser["storage"]["onChanged"]["addListener"](. listener)
      Some(
        () => {
          browser["storage"]["onChanged"]["removeListener"](. listener)
        },
      )
    })
    React.useEffect0(() => {
      open Promise
      Storage.loadLocalStorage()
      ->thenResolve(storage => {
        let filters = Belt.Array.map(storage.filters, Utils.detachDataInFilter)
        setBloomFilters(_ => filters)
      })
      ->ignore
      None
    })
    let fileInput: React.ref<Js.nullable<Dom.element>> = React.useRef(Js.Nullable.null)
    let onFileInputChange = event => {
      open Belt.Option
      open Promise
      ReactEvent.Form.preventDefault(event)
      let maybeInput = Js.Nullable.toOption(fileInput.current)
      maybeInput
      ->map(readFileFromInput)
      ->map(promisedMaybeData =>
        promisedMaybeData->thenResolve(maybeData => {
          switch maybeData {
          | Some((name, data)) => {
              if draftFilter.name == "" {
                dispatchToDraftFilter(SetName(name))
              }
              let data = castToArray(data)
              dispatchToDraftFilter(SetData(data))
            }
          | None => ()
          }
        })
      )
      ->ignore
      Js.log(draftFilter)
    }
    let onSubmit = event => {
      open Promise
      ReactEvent.Form.preventDefault(event)
      setLoadingIndicator(_ => true)
      Storage.loadLocalStorage()
      ->thenResolve(storage => {
        let filters = Js.Array2.concat(storage.filters, [draftFilter])
        Storage.saveLocalStorage({filters: filters})
        dispatchToDraftFilter(ResetForm)
      })
      ->finally(() => {
        setLoadingIndicator(_ => false)
      })
      ->ignore
    }
    // form에 onReset이 없잖아!!
    let onResetButtonClicked = event => {
      ReactEvent.Mouse.preventDefault(event)
      dispatchToDraftFilter(ResetForm)
      let event = any(event)
      event["target"]["form"]["reset"](.)
    }
    let amountOfInstalledFilters = {
      open Js
      Int.toString(Array2.length(bloomFilters))
    }
    <div>
      <fieldset>
        <legend> {s(`Installed Bloom-filters: (${amountOfInstalledFilters})`)} </legend>
        <ListOfFilters bloomFilters />
      </fieldset>
      <fieldset>
        <legend> {s("New Bloom-filter:")} </legend>
        <form onSubmit>
          <label>
            {s("File:")}
            <br />
            <input
              type_="file"
              required={true}
              ref={ReactDOM.Ref.domRef(fileInput)}
              onChange={onFileInputChange}
            />
          </label>
          <br />
          <label>
            {s("Name:")}
            <br />
            <input
              type_="text"
              required={true}
              size=30
              value={draftFilter.name}
              onChange={event => {
                let target = ReactEvent.Synthetic.target(event)
                dispatchToDraftFilter(SetName(target["value"]))
              }}
            />
          </label>
          <br />
          <label>
            {s("Group:")}
            <br />
            <select
              required={true}
              value={(draftFilter.group :> string)}
              onChange={event => {
                let target = ReactEvent.Synthetic.target(event)
                dispatchToDraftFilter(SetGroup(target["value"]))
              }}>
              <option value="transphobic"> {s("transphobic")} </option>
              <option value="trans_friendly"> {s("trans friendly")} </option>
            </select>
          </label>
          <hr />
          <div className="new-filter-actions">
            <input type_="submit" value="Add" />
            <input type_="reset" value="Clear form" onClick={onResetButtonClicked} />
            {if loadingIndicator {
              <span> {s("Please wait...")} </span>
            } else {
              React.null
            }}
          </div>
        </form>
      </fieldset>
    </div>
  }
}
