<template>
  <div class="background--custom">
    <canvas id="canvas" v-show="background" />
  </div>
</template>

<script setup>
import { onMounted, watch } from "vue";
import { Gradient } from "./js/minigl.js";

const props = defineProps({
  background: {
    type: Boolean,
    default: true,
  },
});

watch(props.background, (val) => {
  console.log(val);
});

onMounted(() => {
  var gradient = new Gradient();
  gradient.initGradient("#canvas");
});
</script>

<style scoped>
.background--custom {
  background-color: #060606;
  width: 100vw;
  height: 100vh;
  position: absolute;
  overflow: hidden;
  z-index: -2;
  top: 0;
  left: 0;
}
canvas#canvas {
  z-index: -1;
  position: absolute;
  width: 100%;
  height: 60%;
  transform: rotate(-60deg) scale(3) translateY(-17%);
  --gradient-color-1: #b99e54;
  --gradient-color-2: #171ca1;
  --gradient-color-3: #ca5343;
  --gradient-color-4: #c50e24;
  --gradient-speed: 0.00001;
}
</style>

<!-- --gradient-color-1: #ccae5d;
--gradient-color-2: #1e23c0;
--gradient-color-3: #f1634f;
--gradient-color-4: #e7112b;
--gradient-speed: 0.00001; -->

<!-- --gradient-color-1: #a1fcd6;
--gradient-color-2: #5df0a3;
--gradient-color-3: #967ea5;
--gradient-color-4: #1a4f1c; -->
