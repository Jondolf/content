<template>
  <Content :document="doc" />
</template>

<script setup lang="ts">
const { data: doc } = await useAsyncData('multi-part-slug', () => queryContent('cats', 'persian').findOne())
</script>
