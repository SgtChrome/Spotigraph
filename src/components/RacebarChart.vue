<script setup>
import { Diagramm } from "./js/mainSum.js";
import { computed, onMounted, ref, watch } from "vue";

import {
  PlayIcon,
  ArrowPathIcon,
  ChartBarSquareIcon,
  PlayPauseIcon,
} from "@heroicons/vue/24/solid";

const props = defineProps(["data"]);
const emit = defineEmits(["externalDate"]);

const charti = ref(null);
let chart = null;
const pickedYear = ref("alle");
const pickedMonth = ref(0);

const stop = ref(false);
const frame = ref(0);
const onlyLastFrame = ref(false);
const stoppedFrameIndex = ref(0);
const singleSong = ref(false);
const externalDate = ref(null);

/*
let startTime = new Date().getSeconds();
 let fps = computed(() => {
  return frame.value / (new Date().getSeconds() - startTime);
}); */

let [years, yearsArray] = prepareData(props.data);
const months = computed(() => {
  return pickedYear.value === "alle" ? [] : years[pickedYear.value];
});

function prepareData(json) {
  let years = {};
  for (let i = 0; i < json.length; i++) {
    let month = json[i].endTime.split("-")[1];
    let year = json[i].endTime.split("-")[0];
    if (years[year] == undefined) {
      years[year] = [month];
    } else {
      if (years[year].includes(month)) {
        continue;
      } else {
        years[year].push(month);
      }
    }
  }
  for (let year in years) {
    years[year].sort((a, b) => parseInt(a) - parseInt(b));
  }
  let yearsArray = Object.keys(years);
  yearsArray.sort((a, b) => parseInt(a) - parseInt(b));
  return [years, yearsArray];
}

function filterData(json, year, month) {
  let filteredData = [];
  for (let i = 0; i < json.length; i++) {
    if (json[i].endTime.split("-")[0] !== year) continue;
    if (month) if (json[i].endTime.split("-")[1] !== month) continue;
    filteredData.push(json[i]);
  }
  return filteredData;
}

const replay = () => {
  if (pickedYear.value == "alle") {
    chart.initData(props.data);
  } else {
    chart.initData(filterData(props.data, pickedYear.value, pickedMonth.value));
  }
  stop.value = false;
  chart.replay();
};
function stopReplay() {
  stop.value = !stop.value;
  if (!stop.value) {
    chart.replay(stoppedFrameIndex.value);
  }
}
function getMonth(month) {
  switch (month) {
    case "01":
      return "Januar";
    case "02":
      return "Februar";
    case "03":
      return "März";
    case "04":
      return "April";
    case "05":
      return "Mai";
    case "06":
      return "Juni";
    case "07":
      return "Juli";
    case "08":
      return "August";
    case "09":
      return "September";
    case "10":
      return "Oktober";
    case "11":
      return "November";
    case "12":
      return "Dezember";
  }
}
function clickedYear() {
  pickedMonth.value = false;
  replay();
}
function clickedMonth() {
  replay();
}
watch(onlyLastFrame, () => {
  if (!onlyLastFrame.value) {
    replay();
  }
});
watch(externalDate, () => {
  console.log("externalDate changed");
  if (externalDate.value) {
    emit("externalDate", externalDate.value);
  }
});
const playPause = computed(() => {
  return stop.value ? "Play" : "Stop";
});
function playPauseClicked() {
  if (!onlyLastFrame.value) {
    stopReplay();
  }
}
function replayClicked() {
  if (!onlyLastFrame.value) {
    replay();
  }
}
onMounted(() => {
  chart = new Diagramm(
    props.data,
    charti.value,
    frame,
    stop,
    onlyLastFrame,
    stoppedFrameIndex,
    singleSong,
    externalDate
  );
  chart.replay();
});
</script>

<template>
  <div
    class="px-5 py-2 mt-5 bg-gray-500 backdrop-blur-xl rounded-xl bg-opacity-30"
    id="racebarChart"
  >
    <!-- <span class="text-lg"> Frame: {{ frame }} FPS: {{ fps }}</span> -->
    <div
      class="relative justify-center pb-[calc(100vh-292px)] inline-block w-full overflow-hidden text-sm align-top rounded-md h-min"
      ref="charti"
    />
  </div>
  <div class="flex flex-row py-6">
    <div class="flex space-x-2">
      <button
        class="flex"
        :class="[onlyLastFrame ? 'defaultButtonDeactivated' : 'defaultButton']"
        @click="replayClicked"
      >
        <ArrowPathIcon class="mr-2 w-7 h-7" />
        Replay
      </button>
      <button
        class="flex"
        @click="playPauseClicked"
        :class="[onlyLastFrame ? 'defaultButtonDeactivated' : 'defaultButton']"
      >
        <PlayPauseIcon v-if="!stop" class="mr-1 w-7 h-7" />
        <PlayIcon v-if="stop" class="mr-2 w-7 h-7" />
        {{ playPause }}
      </button>
      <input
        type="checkbox"
        name="onlyLastFrameCheckBox"
        id="onlyLastFrameValue"
        class="hidden peer"
        v-model="onlyLastFrame"
      />
      <label class="flex defaultButton" for="onlyLastFrameValue">
        <ChartBarSquareIcon
          class="absolute mr-2 w-7"
          :class="[onlyLastFrame ? 'animate-ping' : '']"
        />
        <ChartBarSquareIcon class="mr-2 w-7" />
        <span class="flex content-end self-end align-text-bottom"
          >Endergebnis</span
        >
      </label>
    </div>
    <div class="flex flex-col w-full pt-2 pl-16">
      <ul class="flex space-x-2">
        <li>
          <input
            class="hidden peer"
            type="radio"
            name="months"
            id="alle"
            value="alle"
            v-model="pickedYear"
            @click="clickedYear"
          />
          <label class="defaultButton" for="alle">Alle</label>
        </li>
        <li v-for="year in yearsArray" :key="year">
          <input
            class="hidden peer"
            type="radio"
            name="years"
            :id="year"
            :value="year"
            v-model="pickedYear"
            @click="clickedYear"
          />
          <label class="defaultButton" :for="year">{{ year }}</label>
        </li>
      </ul>
      <ul class="flex mt-5 space-x-2">
        <li v-for="month in months" :key="month">
          <input
            class="hidden peer"
            type="radio"
            name="months"
            :id="month"
            :value="month"
            v-model="pickedMonth"
            @click="clickedMonth"
          />
          <label class="defaultButton" :for="month"> {{ getMonth(month) }}</label>
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
.defaultButton {
  @apply px-4 py-2 text-xl font-semibold text-white bg-white peer-checked:border-white rounded-md cursor-pointer peer-checked:border-2 bg-opacity-30 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30 border-transparent border-2 select-none h-12;
}
.defaultButtonDeactivated {
  @apply px-4 py-2 text-xl cursor-not-allowed font-semibold text-gray-400 bg-gray-700 rounded-md peer-checked:border-2 bg-opacity-30 hover:outline-2 hover:shadow-2xl focus:outline-none border-transparent border-2 select-none h-12;
}
.svg-content-responsive {
  display: inline-block;
  position: absolute;
  top: 10px;
  left: 0;
}
</style>
