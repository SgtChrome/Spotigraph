<script setup>
import { Diagramm } from "./js/mainSum.js";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  PlayIcon,
  ArrowPathIcon,
  ChartBarSquareIcon,
  PlayPauseIcon,
  ClockIcon,
  PlayCircleIcon,
} from "@heroicons/vue/24/solid";

const props = defineProps(["data"]);
const emit = defineEmits(["externalDate"]);
const singleSong = ref(false);
const externalDate = ref(null);
const frame = ref(0);

const charti = ref(null);
let chart = null;
const pickedYear = ref("alle");
const pickedMonth = ref(0);
const onlyLastFrame = ref(false);
const useListenedTime = ref(true);

const stoppedFrameIndex = ref(0);
const running = ref(false);
const ready = ref(true);
const restartWish = ref(false);

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

function replay() {
  if (running.value) {
    running.value = false;
    restartWish.value = true;
  } else {
    replayInner();
  }
}

function replayInner() {
  if (pickedYear.value === "alle") {
    chart.initData(props.data);
  } else {
    chart.initData(filterData(props.data, pickedYear.value, pickedMonth.value));
  }
  running.value = true;
  ready.value = false;
  restartWish.value = false;
  chart.replay().then(() => {
    ready.value = true;
    running.value = false;
  });
}

watch(ready, () => {
  if (ready.value) {
    if (restartWish.value) {
      restartWish.value = false;
      replayInner();
    }
  }
});

function playPause() {
  running.value = !running.value;
  if (running.value) {
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
/* watch(running, () => {
  console.log("running: " + running.value);
});
watch(restartWish, () => {
  console.log("restartWish: " + restartWish.value);
}); */
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
  if (externalDate.value) {
    emit("externalDate", externalDate.value);
  }
});
const playPauseText = computed(() => {
  if (running.value && !onlyLastFrame.value) return "Pause";
  else return "Play";
});
function playPauseClicked() {
  if (!onlyLastFrame.value) {
    playPause();
  }
}
function replayClicked() {
  if (!onlyLastFrame.value) {
    replay();
  }
}
const ratio = 2.46;
function resize() {
  const width = `${
    (window.innerWidth + 470 - window.innerHeight * ratio) / 2
  }px`;
  document.getElementById("leftpadding").style.width = width;
  document.getElementById("rightpadding").style.width = width;
}
onMounted(() => {
  resize();
  window.addEventListener("resize", resize);

  chart = new Diagramm(
    props.data,
    charti.value,
    frame,
    running,
    onlyLastFrame,
    stoppedFrameIndex,
    singleSong,
    externalDate,
    useListenedTime
  );
  replay();
});
onUnmounted(() => {
  window.removeEventListener("resize", resize);
});
watch(useListenedTime, () => {
  console.log(useListenedTime.value);
  replay();
});
</script>

<template>
  <div class="flex flex-row">
    <div id="leftpadding"></div>

    <div
      class="flex w-full px-5 py-2 mt-5 bg-gray-500 flex-grow-1 backdrop-blur-xl rounded-xl bg-opacity-30"
      id="racebarChart"
    >
      <!-- <span class="text-lg"> Frame: {{ frame }} FPS: {{ fps }}</span> pb-[calc(100vh-292px)]-->
      <div
        class="relative w-full inline-block justify-center overflow-hidden text-sm align-top rounded-md pb-[37%]"
        ref="charti"
      />
    </div>
    <div id="rightpadding"></div>
  </div>

  <div class="flex flex-row pt-6">
    <div class="flex flex-col space-y-2">
      <div class="flex space-x-2">
        <button
          class="flex"
          :class="[
            onlyLastFrame ? 'defaultButtonDeactivated' : 'defaultButton',
          ]"
          @click="replayClicked"
        >
          <ArrowPathIcon class="mr-2 w-7 h-7" />
          Replay
        </button>
        <button
          class="flex"
          @click="playPauseClicked"
          :class="[
            onlyLastFrame ? 'defaultButtonDeactivated' : 'defaultButton',
          ]"
        >
          <PlayPauseIcon
            v-if="running && !onlyLastFrame"
            class="mr-1 w-7 h-7"
          />
          <PlayIcon v-if="!running || onlyLastFrame" class="mr-2 w-7 h-7" />
          {{ playPauseText }}
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
      <div class="w-fit">
        <input
          type="checkbox"
          name="useListenedTimeCheckBox"
          id="useListenedTimeValue"
          class="hidden peer"
          v-model="useListenedTime"
        />
        <label class="flex defaultButtonAlwaysOn" for="useListenedTimeValue">
          <ClockIcon
            v-if="useListenedTime"
            class="absolute mr-2 w-7 animate-ping"
          />
          <ClockIcon v-if="useListenedTime" class="mr-2 w-7" />
          <PlayCircleIcon
            v-if="!useListenedTime"
            class="absolute mr-2 w-7 animate-ping"
          />
          <PlayCircleIcon v-if="!useListenedTime" class="mr-2 w-7" />
          <span class="flex content-end self-end align-text-bottom">{{
            useListenedTime ? "Zeitdauer" : "Anzahl Hits"
          }}</span>
        </label>
      </div>
    </div>
    <div class="flex flex-col w-full h-full pl-16">
      <ul class="flex pt-1 space-x-2 h-fit">
        <li>
          <input
            class="hidden peer"
            type="radio"
            name="years"
            id="alle"
            value="alle"
            v-model="pickedYear"
            @change="clickedYear"
          />
          <label class="defaultDatetimeButton" for="alle">Alle</label>
        </li>
        <li v-for="year in yearsArray" :key="year">
          <input
            class="hidden peer"
            type="radio"
            name="years"
            :id="year"
            :value="year"
            v-model="pickedYear"
            @change="clickedYear"
          />
          <label class="defaultDatetimeButton" :for="year">{{ year }}</label>
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
            @change="clickedMonth"
          />
          <label class="defaultDatetimeButton" :for="month">
            {{ getMonth(month) }}</label
          >
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
.defaultButton {
  @apply px-3 py-1 text-xl font-semibold text-white bg-white peer-checked:border-white rounded-md cursor-pointer peer-checked:border-2 bg-opacity-30 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30 border-transparent border-2 select-none h-10;
}
.defaultButtonAlwaysOn {
  @apply px-3 py-1 text-xl font-semibold text-white bg-white border-white rounded-md cursor-pointer bg-opacity-30 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30 border-2 select-none h-10;
}
.defaultButtonDeactivated {
  @apply px-3 py-1 text-xl cursor-not-allowed font-semibold text-gray-400 bg-gray-800 rounded-md peer-checked:border-2 bg-opacity-30 hover:outline-2 hover:shadow-2xl focus:outline-none border-transparent border-2 select-none h-10;
}
.defaultDatetimeButton {
  @apply px-4 py-[6px] my-2 text-xl font-semibold text-white bg-white peer-checked:border-white rounded-md cursor-pointer peer-checked:border-2 bg-opacity-30 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30 border-transparent border-2 select-none h-10;
}
.svg-content-responsive {
  display: inline-block;
  position: absolute;
  top: 10px;
  left: 0;
}
</style>
