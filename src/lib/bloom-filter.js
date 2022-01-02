import Bloomfilter from '../vendor/bloomfilter'

export function createFromIntArray(arrayOfInt, funcs) {
  const uint32array = new Uint32Array(arrayOfInt)
  return new Bloomfilter(uint32array, funcs)
}