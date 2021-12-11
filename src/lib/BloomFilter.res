type bfinstance
@new @module("../vendor/bloomfilter")
external bloomFilter: (Js.TypedArray2.Uint32Array.t, int) => bfinstance = "default"

@send external test: (bfinstance, string) => bool = "test"

let createFromIntArray = (arrayOfInt: array<int>, funcs: int) => {
  let uint32array = Js.TypedArray2.Uint32Array.make(arrayOfInt)
  bloomFilter(uint32array, funcs)
}
