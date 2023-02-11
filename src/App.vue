<script setup>
import { ref } from "vue";
import RacebarChart from "./components/RacebarChart.vue";
import Background from "./components/Background.vue";
import UploadWindow from "./components/UploadWindow.vue";
import SingleSong from "./components/SingleSong.vue";
import { ArrowDownOnSquareStackIcon, EyeIcon, EyeSlashIcon } from "@heroicons/vue/24/solid";

const upload = ref(false);
const chartData = ref(null);
const background = ref(true);

function uploadedData(data) {
  console.log("uploadedData");
  if (data === "sample" || !data) {
    chartData.value = import("@/assets/testdata/StreamingHistory0.json");
  } else {
    chartData.value = data;
  }
  upload.value = true;
}
</script>

<template>
  <Background :background="background" />
  <div class="w-full h-screen">
    <div
      class="flex flex-col h-full px-10 pt-8 transition-all duration-500 ease-in-out"
    >
      <div class="flex flex-row space-x-10 select-none">
        <h1
          class="flex px-6 py-5 space-x-4 font-bold text-white bg-opacity-40 w-fit text-ellipsis rounded-xl gap-y-2 backdrop-blur-xl"
          :class="[upload ? 'bg-gray-600 text-5xl' : 'bg-gray-600 text-9xl']"
        >
          <span class="text-green-400">Spotify</span>
          <span>Data Visualizer</span>
        </h1>
        <!-- <p class="text-xl text-black">Visualize your Spotify data</p> -->
        <div
          class="flex px-4 py-3 m-4 text-white border-2 border-transparent cursor-pointer w-fit text-ellipsis rounded-xl backdrop-blur-xl bg-opacity-40 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30"
          :class="[upload ? 'bg-gray-300 text-2xl' : 'hidden']"
          @click="upload = false"
        >
          <ArrowDownOnSquareStackIcon class="mr-2 w-7 h-7" />
          New Data
        </div>
        <div class="flex-grow"/>
        <div
          class="flex px-4 py-3 m-4 ml-auto text-white border-2 border-transparent cursor-pointer w-fit text-ellipsis rounded-xl backdrop-blur-xl bg-opacity-40 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30"
          :class="[upload ? 'bg-gray-300 text-2xl' : 'hidden']"
          @click="background = !background"
        >
          <EyeIcon class="mr-2 w-7 h-7" v-if="!background"/>
          <EyeSlashIcon class="mr-2 w-7 h-7" v-if="background"/>
          Background
        </div>
      </div>
      <div v-if="!upload" class="h-2/5"></div>
      <UploadWindow v-if="!upload" @uploadedData="uploadedData" />
      <RacebarChart v-if="upload" :data="chartData" />
      <SingleSong v-if="singleSong" />
      <div v-if="!upload" class="flex justify-end h-full pr-5">
        <h2 class="self-center w-1/5 text-5xl font-bold text-white">
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
</template>

<style scoped>
* {
  font-family: "Open Sans", Roboto, Helvetica, Arial, Sans-Serif, sans-serif;
}
</style>
