import { prefixStorage, createStorage } from 'unstorage'
import overlay from 'unstorage/drivers/overlay'
import memory from 'unstorage/drivers/memory'
import { hash as ohash } from 'ohash'
import destr from 'destr'
import type { QueryBuilderParams, ParsedContent } from '../types'
import { createQuery } from '../query/query'
import { createPipelineFetcher } from '../query/match/pipeline'
import { parse, transform } from './transformers'
// eslint-disable-next-line import/named
import { useRuntimeConfig, useStorage } from '#imports'

export const sourceStorage = prefixStorage(useStorage(), 'content:source')
export const cacheStorage = prefixStorage(useStorage(), 'cache:content')
export const cacheParsedStorage = prefixStorage(useStorage(), 'cache:content:parsed')
// Todo: handle multiple storage (one per token)
export const previewStorage = createStorage({
  driver: overlay({
    layers: [
      memory(),
      cacheParsedStorage
    ]
  })
})
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Content ignore patterns
 */
export const contentIgnores = useRuntimeConfig().content.ignores.map((p: any) =>
  typeof p === 'string' ? new RegExp(`^${p}`) : p
)

/**
 * Filter predicate for ignore patterns
 */
const contentIgnorePredicate = (key: string) =>
  !contentIgnores.some((prefix: RegExp) => key.split(':').some(k => prefix.test(k)))

export const getContentsIds = async (prefix?: string) => {
  let keys = []

  const isPreview = await cacheStorage.getItem('isPreview')
  if (isPreview) {
    keys = await previewStorage.getKeys(prefix)
  } else if (isProduction) {
    keys = await cacheParsedStorage.getKeys(prefix)
  }

  // Later: handle preview mode, etc
  if (keys.length === 0) {
    keys = await sourceStorage.getKeys(prefix)
  }

  return keys.filter(contentIgnorePredicate)
}

export const getContentsList = async (prefix?: string) => {
  const keys = await getContentsIds(prefix)
  const contents = await Promise.all(keys.map(key => getContent(key)))

  return contents
}

export const getContent = async (id: string): Promise<ParsedContent> => {
  // Handle ignored id
  if (!contentIgnorePredicate(id)) {
    return { id, body: null }
  }

  const isPreview = await cacheStorage.getItem('isPreview')
  if (isPreview) {
    const draft: any = await previewStorage.getItem(id)
    return draft.parsed
  }

  const cached: any = await cacheParsedStorage.getItem(id)
  if (isProduction && cached) {
    return cached.parsed
  }

  const meta = await sourceStorage.getMeta(id)
  const hash = ohash(meta)
  if (cached?.hash === hash) {
    return cached.parsed as ParsedContent
  }

  const body = await sourceStorage.getItem(id)

  if (body === null) {
    return { id, body: null }
  }

  const parsedContent = await parse(id, body as string).then(transform)
  const parsed = {
    ...meta,
    ...parsedContent
  }

  await cacheParsedStorage.setItem(id, { parsed, hash }).catch(() => {})

  return parsed
}

/**
 * Query contents
 */
export const queryContent = (
  body?: string | Partial<QueryBuilderParams>,
  params?: Partial<QueryBuilderParams>
) => {
  if (typeof body === 'string') {
    body = {
      slug: body,
      ...params
    }
  }
  const pipelineFetcher = createPipelineFetcher(getContentsList)

  return createQuery(pipelineFetcher, body)
}

const _queries = {}
export const useApiQuery = (qid?: string, query?: any) => {
  if (query) {
    _queries[qid] = typeof query === 'string' ? destr(query) : query
  }

  return _queries[qid] || {}
}
