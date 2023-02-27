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
  ArrowUturnLeftIcon,
} from "@heroicons/vue/24/solid";
import SpotifyPreview from "@/components/SpotifyPreview.vue";

const chartData = ref(null);
const background = ref(true);

const visibleElement = ref("upload");
const externalDateDisplay = ref(null);
const externalDateBool = ref(false);
const spotifyUri = ref(null);

//check if browser is mobile by checking browser identity
const isMobileUserAgent = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

async function uploadedData(data) {
  console.log("uploadedData");
  if (data === "sample" || !data) {
    import("@/assets/testdata/StreamingHistory0.json").then((data) => {
      chartData.value = data.default;
      visibleElement.value = "chart";
      spotifyUri.value = null;
    });
  } else {
    chartData.value = data;
    visibleElement.value = "chart";
    spotifyUri.value = null;
  }
}
function externalDate(date) {
  externalDateDisplay.value = date;
}
const mobile = ref(false);
function setMobile() {
  mobile.value = window.innerWidth / window.innerHeight < 1.5;
}
onMounted(() => {
  setMobile();
  window.addEventListener("resize", setMobile);
});
onUnmounted(() => {
  window.removeEventListener("resize", setMobile);
});
</script>

<template>
  <div
    class="absolute z-50 flex flex-col items-center justify-center w-full h-screen text-4xl text-center text-white bg-black"
    v-if="mobile && visibleElement == 'chart'"
  >
    <span class="font-bold"
      ><span class="pr-2 text-green-400">Spotify</span>Data Visualizer</span
    >
    <ArrowUturnLeftIcon class="mr-2 w-7 h-7" />
    <span class="text-1xl">Flip your screen over</span>
  </div>
  <Background
    v-if="!(mobile && visibleElement == 'chart')"
    :background="background"
  />
  <div class="w-full h-screen">
    <div
      class="flex flex-col h-full transition-all duration-500 ease-in-out sm:px-10 md:px-6 lg:px-10"
      :class="[
        visibleElement == 'upload' ? 'px-2 pt-8' : 'lg:px-10 lg:pt-8 pt-2 px-1',
      ]"
    >
      <div class="flex justify-center select-none">
        <h1
          class="flex font-bold text-white transition-all duration-200 ease-in-out w-fit h-fit bg-opacity-40 text-ellipsis rounded-xl backdrop-blur-xl"
          :class="[
            visibleElement === 'upload'
              ? 'bg-gray-600 2xl:text-9xl lg:text-7xl md:text-5xl text-3xl px-3 md:space-x-4 space-x-2 sm:px-5 py-2 ml-4 md:py-2'
              : 'bg-gray-600 2xl:text-5xl lg:text-5xl md:text-xl text-md px-3 space-x-2 lg:space-x-4 lg:px-6 py-1 lg:py-5',
          ]"
        >
          <span class="text-green-400">Spotify</span>
          <span>Data Visualizer</span>
        </h1>
        <div
          class="topbarButton"
          :class="[visibleElement == 'upload' ? 'hidden' : 'flex']"
          @click="visibleElement = 'upload'"
        >
          <ArrowDownOnSquareStackIcon class="iconTopBarButton" />
          New Data
        </div>
        <SpotifyPreview
          v-if="visibleElement !== 'upload' && !isMobileUserAgent"
          :spotifyUri="spotifyUri"
        />
        <div
          v-if="externalDateBool"
          class="flex px-4 py-3 m-4 text-white border-2 border-transparent cursor-pointer w-fit text-ellipsis rounded-xl backdrop-blur-xl bg-opacity-40"
        >
          {{ externalDateDisplay }}
        </div>
        <div class="flex-grow" />
        <div
          class="topbarButton"
          :class="[visibleElement == 'chart' ? 'flex' : 'hidden']"
          @click="background = !background"
        >
          <EyeIcon class="iconTopBarButton" v-if="!background" />
          <EyeSlashIcon class="iconTopBarButton" v-if="background" />
          Background
        </div>
      </div>
      <!-- <div
        v-if="visibleElement == 'upload'"
        class="flex min-h-[20px] lg:h-2/5 h-1/5 md:pt-5 lg:pt-0 sm:pt-0"
      ></div> -->
      <div
        v-if="visibleElement == 'upload'"
        class="flex items-center flex-grow m-5"
      >
        <UploadWindow class="flex" @uploadedData="uploadedData" />
      </div>
      <RacebarChart
        v-if="visibleElement == 'chart' && !mobile"
        :data="chartData"
        @externalDate="externalDate"
        @spotifyUri="(value) => spotifyUri = value"
      />
      <SingleSong
        v-if="visibleElement == 'singleSong'"
        :class="[
          visibleElement == 'singleSong'
            ? 'transition-all duration-500 left-0'
            : '',
        ]"
      />
      <div v-if="visibleElement == 'upload'" class="flex justify-end pr-5">
        <div class="flex justify-end w-full p-4 mb-10">
          <h2
            class="flex flex-col self-center text-4xl font-bold text-white lg:text-end md:text-4xl lg:text-5xl lg:w-3/5 xl:w-[50%]"
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
.topbarButton {
  @apply px-2 py-px mx-2 my-1 text-white transition-all duration-500 ease-in-out border-2 border-transparent cursor-pointer lg:py-3 lg:m-4 lg:px-4 w-fit text-ellipsis rounded-xl backdrop-blur-xl bg-opacity-40 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30 bg-gray-300 text-sm lg:text-2xl;
}
.iconTopBarButton {
  @apply w-4 h-4 pt-[3px] mr-1 lg:mr-2 lg:w-7 lg:h-7;
}
* {
  font-family: "Open Sans", Roboto, Helvetica, Arial, Sans-Serif, sans-serif;
}
</style>
