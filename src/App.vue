<script setup>
import { ref, onUnmounted, onMounted } from "vue";
import RacebarChart from "./components/RacebarChart.vue";
import Background from "./components/Background.vue";
import UploadWindow from "./components/UploadWindow.vue";
import SingleSong from "./components/SingleSong.vue";
import {
  ArrowDownOnSquareStackIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/vue/24/solid";

const upload = ref(false);
const chartData = ref(null);
const background = ref(true);

const visibleElement = ref("upload");
const externalDateDisplay = ref(null);
const externalDateBool = ref(false);

async function uploadedData(data) {
  console.log("uploadedData");
  if (data === "sample" || !data) {
    import("@/assets/testdata/StreamingHistory0.json").then((data) => {
      chartData.value = data.default;
      visibleElement.value = "chart";
    });
  } else {
    chartData.value = data;
    visibleElement.value = "chart";
  }
}
function externalDate(date) {
  externalDateDisplay.value = date;
}
const mobile = ref(false);
onMounted(() => {
  window.addEventListener("resize", () => {
    mobile.value =
      window.innerWidth / window.innerHeight < 1.5 ||
      2.4 < window.innerWidth / window.innerHeight;
  });
});
onUnmounted(() => {
  window.removeEventListener("resize", () => {
    mobile.value = 4 < window.innerWidth / window.innerHeight < 1.5;
  });
});
</script>

<template>
  <div
    class="absolute z-50 flex flex-col items-center justify-center w-screen h-screen text-4xl text-center text-white bg-black"
    v-if="mobile"
  >
    <span class="font-bold"
      ><span class="pr-2 text-green-400">Spotify</span>Data Visualizer</span
    >
    <span class="text-1xl">Use of this website requires a computer</span>
  </div>
  <Background :background="background" />
  <div class="w-full h-screen">
    <div
      class="flex flex-col h-full px-10 pt-8 transition-all duration-500 ease-in-out"
    >
      <div class="flex flex-row space-x-10 select-none">
        <h1
          class="flex px-6 py-5 space-x-4 font-bold text-white transition-all duration-200 ease-in-out bg-opacity-40 w-fit text-ellipsis rounded-xl gap-y-2 backdrop-blur-xl"
          :class="[
            visibleElement == 'upload'
              ? 'bg-gray-600 text-9xl xl:text-7xl md:text-5xl'
              : 'bg-gray-600 text-5xl',
          ]"
        >
          <span class="text-green-400">Spotify</span>
          <span>Data Visualizer</span>
        </h1>
        <!-- <p class="text-xl text-black">Visualize your Spotify data</p> -->
        <div
          class="flex px-4 py-3 m-4 text-white transition-all duration-500 ease-in-out border-2 border-transparent cursor-pointer w-fit text-ellipsis rounded-xl backdrop-blur-xl bg-opacity-40 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30"
          :class="[
            visibleElement == 'upload' ? 'hidden' : 'bg-gray-300 text-2xl',
          ]"
          @click="visibleElement = 'upload'"
        >
          <ArrowDownOnSquareStackIcon class="mr-2 w-7 h-7" />
          New Data
        </div>
        <div
          v-if="externalDateBool"
          class="flex px-4 py-3 m-4 text-white border-2 border-transparent cursor-pointer w-fit text-ellipsis rounded-xl backdrop-blur-xl bg-opacity-40"
        >
          {{ externalDateDisplay }}
        </div>
        <div class="flex-grow" />
        <div
          class="flex px-4 py-3 m-4 ml-auto text-white border-2 border-transparent cursor-pointer w-fit text-ellipsis rounded-xl backdrop-blur-xl bg-opacity-40 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30"
          :class="[visibleElement == 'chart' ? 'bg-gray-300 text-2xl' : 'hidden']"
          @click="background = !background"
        >
          <EyeIcon class="mr-2 w-7 h-7" v-if="!background" />
          <EyeSlashIcon class="mr-2 w-7 h-7" v-if="background" />
          Background
        </div>
      </div>
      <div v-if="visibleElement == 'upload'" class="lg:h-2/5 md:h-1/5 h-1/5"></div>
      <UploadWindow
        v-if="visibleElement == 'upload'"
        @uploadedData="uploadedData"
      />
      <RacebarChart
        v-if="visibleElement == 'chart'"
        :data="chartData"
        @externalDate="externalDate"
      />
      <SingleSong
        v-if="visibleElement == 'singleSong'"
        :class="[
          visibleElement == 'singleSong'
            ? 'transition-all duration-500 left-0'
            : '',
        ]"
      />
      <div
        v-if="visibleElement == 'upload'"
        class="flex justify-end h-full pr-5"
      >
      <div class="flex justify-end w-full">
        <h2
          class="flex flex-col self-center text-5xl font-bold text-white lg:w-3/5 xl:w-1/5"
        >
          Check out your Spotify data!
          <span class="font-medium"
            >Download from
            <a
              class="text-green-500"
              href="https://www.spotify.com/de/account/privacy/"
              >Spotify.com</a
            >
          </span>
        </h2>
      </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  font-family: "Open Sans", Roboto, Helvetica, Arial, Sans-Serif, sans-serif;
}
</style>
