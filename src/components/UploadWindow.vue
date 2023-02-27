<template>
  <div
    class="flex flex-col items-center justify-center w-full text-lg space-y-7 sm:space-x-10 sm:space-y-0 sm:flex-row text-gray-50"
  >
    <label
      for="dropzone-file"
      class="flex flex-col items-center justify-center w-3/5 border-8 border-dashed rounded-lg cursor-pointer h-58 md:h-40 sm:h-64 lg:h-64 sm:w-2/5 bg-opacity-40 bg-gray-50 hover:bg-gray-100 hover:bg-opacity-70"
      @drop.prevent="onDrop"
      :class="{
        'border-red-500': error,
        'border-grey-500': !error,
      }"
    >
      <div class="flex flex-col items-center justify-center pt-5 pb-6 ">
        <ArrowUpTrayIcon class="mb-2 w-14 h-14" />
        <p class="font-semibold text-center lg:p-2 lg:mb-2">Click to upload or drag and drop</p>
        <p class="text-base">Spotify Data Export .zip</p>
      </div>
      <input id="dropzone-file" type="file" class="hidden" @change="onChange" />
    </label>
    <div
      class="flex flex-col items-center justify-center w-48 h-40 pt-5 pb-6 align-middle border-8 border-dashed rounded-lg cursor-pointer md:h-32 sm:h-52 lg:h-52 bg-opacity-40 bg-gray-50 hover:bg-gray-100 hover:bg-opacity-70"
      @click="emit('uploadedData', 'sample')"
    >
      <CircleStackIcon class="sm:mb-2 md:mb-1 lg:mb-2 w-14 h-14" />
      <span class="font-semibold">Try sample data</span>
    </div>
  </div>
</template>

<script setup>
import { unzip } from "unzipit";
import { onMounted, onUnmounted, ref } from "vue";
import { CircleStackIcon, ArrowUpTrayIcon } from "@heroicons/vue/24/solid";
import { format } from 'date-fns'

const emit = defineEmits(["uploadedData"]);

const error = ref(false);

function preventDefaults(e) {
  e.preventDefault();
}
const events = ["dragenter", "dragover", "dragleave", "drop"];
onMounted(() => {
  events.forEach((eventName) => {
    document.body.addEventListener(eventName, preventDefaults);
  });
});
onUnmounted(() => {
  events.forEach((eventName) => {
    document.body.removeEventListener(eventName, preventDefaults);
  });
});

function onDrop(e) {
  console.log(e);
  console.log(e.dataTransfer.files[0]);
  readFile(e.dataTransfer.files[0]);
}
function onChange(e) {
  console.log(e);
  console.log(e.target.files[0]);
  readFile(e.target.files[0]);
}

function readFile(url) {
  // check if the file is a zip file
  error.value = false;
  if (url.name.endsWith(".zip")) {
    readZipFile(url);
  } else if (url.name.endsWith(".json")) {
    // read the file from url
    const reader = new FileReader();
    reader.readAsText(url);
    reader.onload = function () {
      const data = JSON.parse(reader.result);
      // check if data is array
      processJSON(data);
    };
  } else {
    error.value = true;
    console.log("Error: File is not a .zip or .json file");
  }
}

function throwError() {
  error.value = true;
  console.log("Error: File is not a Spotify Data Export file");
}

function processJSON(data) {
  if (!Array.isArray(data)) {
    throwError();
    return;
  }
  if (data[0].trackName) {
    emit("uploadedData", data);
  } else if (data[0].master_metadata_track_name) {
    emit("uploadedData", normalizeExtendedData(data));
  } else {
    throwError();
  }
}

async function readZipFile(url) {
  const { entries } = await unzip(url);

  let data = [];
  // print all entries and their sizes
  for (const [pathName, entry] of Object.entries(entries)) {
    console.log(pathName, entry.size);
    const name = pathName.split("/").pop(-1);
    if (
      (name.startsWith("StreamingHistory") || name.startsWith("endsong")) &&
      name.endsWith(".json")
    ) {
      const json = await entry.json();
      console.log(json);
      // append the data to the data object
      data = data.concat(json);
      //data = json;
    }
  }
  if (data) {
    processJSON(data);
  } else {
    throwError();
  }
}

function normalizeExtendedData(data) {
  // normalizes the extended data to the format of the short streaming history
  const normalizedData = [];
  for (let i = 0; i < data.length; i++) {
    const normalizedSong = {
      trackName: data[i].master_metadata_track_name
      ? data[i].master_metadata_track_name
      : data[i].episode_name,
      artistName: data[i].master_metadata_album_artist_name,
      msPlayed: data[i].ms_played,
      endTime: format(new Date(data[i].ts), "yyyy-MM-dd HH:mm"),
      spotifyUri: data[i].spotify_track_uri,
    };
    // discard songs with no track name
    if (normalizedSong.trackName) normalizedData.push(normalizedSong);
  }
  normalizedData.sort((a, b) => {
    return new Date(a.endTime) - new Date(b.endTime);
  });
  return normalizedData;
}
</script>

<style lang="scss" scoped></style>
