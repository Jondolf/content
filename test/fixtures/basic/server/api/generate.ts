import { eventHandler, useQuery } from 'h3'
import { prefixStorage } from 'unstorage'
import { faker } from '@faker-js/faker'
// eslint-disable-next-line import/named
import { useStorage } from '#imports'

const contentStorage = prefixStorage(useStorage, 'content:source')

export default eventHandler(async (event) => {
  const { count = 100 } = useQuery(event)

  const fakeContents = await contentStorage.getKeys('content:fake')

  await Promise.all(fakeContents.map(key => contentStorage.removeItem(key)))

  for (let i = 0; i < +count; i++) {
    const { name, content } = generateMD()
    await contentStorage.setItem(`content:fake:${name}.md`, content)
  }
})

function generateMD () {
  const name = faker.lorem.word() + '-' + faker.lorem.word()
  const content = `---
title: "${faker.lorem.words()}"
layout: Page
---
> ${faker.lorem.sentence()}

${faker.lorem.sentence()}

# ${faker.lorem.sentence()}

- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}
`

  return {
    name,
    content
  }
}
