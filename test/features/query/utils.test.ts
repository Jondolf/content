import { describe, expect, test } from 'vitest'
import { apply, get, omit, pick, sortByKey } from '../../../src/runtime/query/match/utils'

describe('query utils', () => {
  test('Omit', () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: 4
    }

    const result = omit(['a', 'b'])(obj)

    expect(result).toEqual({
      c: 3,
      d: 4
    })
  })

  test('Pick', () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: 4
    }

    const result = pick(['a', 'b'])(obj)

    expect(result).toEqual({
      a: 1,
      b: 2
    })
  })

  test('Get nested field', () => {
    const obj = {
      a: {
        b: {
          c: 1,
          d: 2
        },
        e: [3, 4],
        f: [[5, 6], { g: 7, h: 8 }]
      }
    }
    expect(get(obj, 'a.b.c')).toEqual(1)
    expect(get(obj, 'a.b.d')).toEqual(2)
    expect(get(obj, 'a.e')).toEqual([3, 4])
    expect(get(obj, 'a.f')).toEqual([[5, 6], { g: 7, h: 8 }])
    // array index
    expect(get(obj, 'a.f.0')).toEqual([5, 6])
    expect(get(obj, 'a.f.0.1')).toEqual(6)
    expect(get(obj, 'a.f.1.g')).toEqual(7)
  })

  test('Apply', () => {
    const arr = [1, 2, 3]

    expect(apply(item => item + 1)(arr)).toEqual([2, 3, 4])
  })

  test('Sort by key', () => {
    const data = [
      { a: 1, b: 2 },
      { a: 2, b: 1 },
      { a: 1, b: 1 }
    ]

    expect(sortByKey(data, 'a', 'asc')).toEqual([
      { a: 1, b: 2 },
      { a: 1, b: 1 },
      { a: 2, b: 1 }
    ])

    expect(sortByKey(data, 'a', 'desc')).toEqual([
      { a: 2, b: 1 },
      { a: 1, b: 2 },
      { a: 1, b: 1 }
    ])

    expect(sortByKey(data, 'b', 'asc')).toEqual([
      { a: 2, b: 1 },
      { a: 1, b: 1 },
      { a: 1, b: 2 }
    ])

    expect(sortByKey(data, 'b', 'desc')).toEqual([
      { a: 1, b: 2 },
      { a: 2, b: 1 },
      { a: 1, b: 1 }
    ])
  })

  test('Sort by key multi-phase', () => {
    const data = [{ data: { a: 1, b: 2 } }, { data: { a: 2, b: 1 } }, { data: { a: 1, b: 1 } }]

    // sort by a descending
    const aDesc = sortByKey(data, 'data.a', 'desc')
    expect(sortByKey(aDesc, 'data.b', 'desc')).toEqual([
      { data: { a: 1, b: 2 } },
      { data: { a: 2, b: 1 } },
      { data: { a: 1, b: 1 } }
    ])

    // Sort again by b asc.
    expect(sortByKey(aDesc, 'data.b', 'asc')).toEqual([
      { data: { a: 2, b: 1 } },
      { data: { a: 1, b: 1 } },
      { data: { a: 1, b: 2 } }
    ])

    // Sort again by a desc.
    expect(sortByKey(aDesc, 'data.a', 'desc')).toEqual(aDesc)
  })
})
