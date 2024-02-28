import { describe, expect, test } from 'vitest'

import { resIsOpen, resIsYes, resolveRes } from './prompts.js'

describe('prompt helpers', () => {
  test('resIsYes', () => {
    for (const res of ['yes', 'Yes', 'y', 'Y', '']) {
      expect(resIsYes(res)).toBe(true)
    }
    expect(resIsYes('no')).toBe(false)
  })

  test('resIsOpen', () => {
    for (const res of ['open', 'Open', 'o', 'O']) {
      expect(resIsOpen(res)).toBe(true)
    }
    expect(resIsOpen('')).toBe(false)
    expect(resIsOpen('no')).toBe(false)
  })

  test('resolveRes', () => {
    expect(resolveRes('')).toBe('yes')
    expect(resolveRes('o')).toBe('open')
    expect(resolveRes('abcd')).toBe('no')
  })
})
