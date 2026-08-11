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

import { getAnalytics, logEvent } from "firebase/analytics";
import DropDown from "./components/DropDown.vue";

const chartData = ref(null);
const background = ref(true);

const visibleElement = ref("upload");
const externalDateDisplay = ref(null);
const externalDateBool = ref(false);
const spotifyUri = ref(null);
const filtering = ref("Songs");
const extendedHistory = ref(false);

//check if browser is mobile by checking browser identity
const isMobileUserAgent = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

async function uploadedData(data) {
  console.log("uploadedData");
  const analytics = getAnalytics();
  if (data === "sample" || !data) {
    logEvent(analytics, "sample data");
    import("@/assets/testdata/StreamingHistory0.json").then((data) => {
      chartData.value = data.default;
      visibleElement.value = "chart";
      spotifyUri.value = null;
    });
  } else {
    logEvent(analytics, "uploaded data");
    chartData.value = data;
    // check if albumName is in first element of data
    if (data.length > 0 && data[0].albumName) {
      extendedHistory.value = true;
    }
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
function setFiltering(filteringValue) {
  filtering.value = filteringValue;
}
onMounted(() => {
  const analytics = getAnalytics();
  logEvent(analytics, "page_view");

  // Select all div elements on the page
  /* const divElements = document.querySelectorAll('div');

  // Create a MutationObserver for each div element
  divElements.forEach((div) => {
    const observer = new MutationObserver(function () {
      div.style.height = ""; // Modify the style as needed
    });

    observer.observe(div, {
      attributes: true,
      attributeFilter: ['style']
    });
  });
  setMobile();
  window.addEventListener("resize", setMobile);
  (window.adsbygoogle = window.adsbygoogle || []).push({});*/
});
onUnmounted(() => {
  window.removeEventListener("resize", setMobile);
});

const instructionsOpened = ref(true);
</script>

<template>
  <!-- <div
    class="absolute z-50 flex flex-col items-center justify-center w-full h-screen text-4xl text-center text-white bg-black"
    v-if="mobile && visibleElement == 'chart'"
  >
    <span class="font-bold"
      ><span class="pr-2 text-green-400">Spotify</span>Data Visualizer</span
    >
    <ArrowUturnLeftIcon class="mr-2 w-7 h-7" />
    <span class="text-1xl">Flip your screen over</span>
  </div> -->
  <Background
    v-if="!(mobile && visibleElement == 'chart')"
    :background="background"
  />
  <div class="w-screen h-screen">
    <div
      class="flex flex-col w-full h-full transition-all duration-500 ease-in-out sm:px-10 md:px-6 lg:px-10"
      :class="[
        visibleElement == 'upload' ? 'px-2 pt-8' : 'lg:px-9 lg:pt-7 pt-2 px-1',
      ]"
    >
      <div class="flex justify-center select-none gap-x-2">
        <h1
          class="flex font-bold text-white transition-all duration-200 ease-in-out w-fit h-fit bg-opacity-40 text-ellipsis rounded-xl backdrop-blur-xl"
          :class="[
            visibleElement === 'upload'
              ? 'bg-gray-600 2xl:text-9xl lg:text-6xl md:text-5xl text-3xl px-3 md:space-x-4 space-x-2 sm:px-5 py-2 ml-4 md:py-2'
              : 'bg-gray-600 2xl:text-5xl lg:text-4xl md:text-xl text-md px-3 space-x-2 lg:space-x-4 lg:px-6 py-1 lg:py-5',
          ]"
        >
          <span class="text-green-400">Spotify</span>
          <span class="whitespace-nowrap">Data Visualizer</span>
        </h1>
        <div
          class="items-center topbarButton whitespace-nowrap lg:my-4"
          :class="[visibleElement == 'upload' ? 'hidden' : 'flex']"
          @click="visibleElement = 'upload'"
        >
          <ArrowDownOnSquareStackIcon class="iconTopBarButton" />
          <span class="hidden md:block">New Data</span>
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
          class="z-50"
          :class="[visibleElement == 'chart' ? 'flex' : 'hidden']"
        >
          <DropDown
            @filtering="setFiltering"
            :extendedHistory="extendedHistory"
          />
        </div>
        <div
          class="topbarButton lg:my-4"
          :class="[visibleElement == 'chart' ? 'flex' : 'hidden']"
          @click="background = !background"
        >
          <EyeIcon class="iconTopBarButton" v-if="!background" />
          <EyeSlashIcon class="iconTopBarButton" v-if="background" />
          <span class="hidden md:block">Background</span>
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
        :filtering="filtering"
        class="z-0"
        @externalDate="externalDate"
        @spotifyUri="(value) => (spotifyUri = value)"
      />
      <SingleSong
        v-if="visibleElement == 'singleSong'"
        :class="[
          visibleElement == 'singleSong'
            ? 'transition-all duration-500 left-0'
            : '',
        ]"
      />
      <!-- <div class="w-[100%] h-96 m-5 justify-center">
        <ins class="block w-full adsbygoogle"
            data-ad-client="ca-pub-8161026145727941"
            data-ad-slot="3857325270"
            data-ad-format="auto"
            data-full-width-responsive="true">
          </ins>
      </div> -->
      <div
        v-if="visibleElement == 'upload'"
        class="flex flex-col justify-between w-full md:pr-5 md:flex-row"
      >
        <div
          class="flex flex-col p-8 py-5 text-2xl font-bold text-white transition-all duration-200 ease-in-out bg-gray-700 bg-opacity-50 rounded-xl hover:bg-slate-500 hover:bg-opacity-40"
          :class="[instructionsOpened ? 'lg:w-7/12 mb-10 self-end' : 'w-fit self-start']"
        >
          <div v-if="instructionsOpened" class="flex flex-col">
            <span class="text-3xl">Is <span class="text-green-500">Spotify </span>Wrapped not enough for you?</span>
            <span
              >Check out a race bar chart of your entire listening history!</span
            >
            <div class="pt-4">
              Features:
              <li>Play/pause</li>
              <li>Jump to the final result</li>
              <li>Look at the data for each individual month</li>
              <li>Filter by artists or songs</li>
              <li>Aggregate by either amount of time listened to or number of hits</li>
            </div>
          </div>
          <div v-else>
            <span class="text-3xl">What is this?</span>
          </div>
        </div>
        <div class="flex items-end justify-end p-4 mb-10 lg:w-5/12">
          <h2
            class="flex flex-col text-4xl font-bold text-white lg:text-end md:text-4xl lg:text-5xl"
          >
            Check out your Spotify data!
            <span class="font-medium"
              >Download from
              <a
                class="text-green-500"
                href="https://www.spotify.com/de/account/privacy/"
                target="_blank"
                rel="noopener noreferrer"
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
li {
  @apply list-inside
}
.topbarButton {
  @apply px-2 py-px lg:mx-2 my-px lg:my-1 text-white transition-all duration-500 ease-in-out border-2 border-transparent cursor-pointer md:pt-0 lg:py-3 lg:m-4 lg:px-4 w-fit text-ellipsis rounded-lg lg:rounded-xl backdrop-blur-xl bg-opacity-40 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30 bg-gray-300 text-sm lg:text-2xl align-middle items-center;
}
.iconTopBarButton {
  @apply w-4 h-4 lg:pt-[3px] md:mr-2 lg:w-7 lg:h-7;
}
* {
  font-family: "Open Sans", Roboto, Helvetica, Arial, Sans-Serif, sans-serif;
}
</style>
