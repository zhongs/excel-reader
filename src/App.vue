<template>
  <div id="app">
    <excel-reader />
  </div>
</template>

<script>
import ExcelReader from './components/ExcelReader.vue'

export default {
  name: 'App',
  components: {
    ExcelReader
  }
}
</script>

<style>
#app {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
}
</style>
