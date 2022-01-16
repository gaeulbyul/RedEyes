import BloomFilter from '../vendor/bloomfilter'

export { BloomFilter }

export function createFromIntArray(arrayOfInt: number[], funcs: number) {
  const uint32array = new Uint32Array(arrayOfInt)
  return new BloomFilter(uint32array, funcs)
}
