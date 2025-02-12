import { defineNuxtConfig } from 'nuxt'
import { resolve } from 'pathe'
import contentModule from '../../..'

export default defineNuxtConfig({
  nitro: {
    externals: {
      inline: [
        resolve('../../..'),
        'micromark-util-character',
        'micromark-factory-space',
        'micromark-factory-whitespace',
        'micromark-core-commonmark'
      ]
    }
  },
  components: {
    dirs: [
      {
        path: resolve(__dirname, './components'),
        global: true
      }
    ]
  },
  buildModules: [contentModule],
  content: {
    locales: ['en', 'fa'],
    sources: [
      {
        name: 'fa-ir',
        prefix: '/fa',
        driver: 'fs',
        base: resolve(__dirname, 'content-fa')
      }
    ],
    navigation: {
      fields: ['icon']
    }
  }
})
