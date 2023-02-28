<template>
  <div class="hidden 2xl:flex w-[30%]" :class="[spotifyUri ? 'pt-2' : '']">
    <div class="flex pt-2 backdrop-blur-xl" id="embed-iframe" />
    <div
      v-if="!spotifyUri"
      class="flex items-center justify-center py-px my-1 text-sm text-white transition-all duration-500 ease-in-out bg-gray-300 border-2 border-transparent cursor-pointer lg:py-3 lg:my-4 lg:px-4 w-fit text-ellipsis rounded-xl backdrop-blur-xl bg-opacity-40 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30 lg:text-2xl"
    >
      <span class="whitespace-nowrap">Click on a song to preview it on Spotify</span>
    </div>
    <div class="flex items-center pb-2 pl-3 w-[64px]">
      <span v-show="loading" class="p-1 loader"></span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { spotify } from "@/components/js/spotifyPlayButton";

var EmbedController = undefined;
const loading = ref(false);
const props = defineProps({
  spotifyUri: {
    type: Array,
    required: true,
  },
});

function fetchSpotifyUri(newVal) {
  const devurl = "http://127.0.0.1:8000";
  const produrl = "https://spotigraph-backend.ey.r.appspot.com";
  fetch(
    produrl +
      "/searchSpotify?track=" +
      newVal[0].replace(" ", "%20") +
      "&artist=" +
      newVal[1].replace(" ", "%20"),
    {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data) EmbedController.loadUri(data);
      else loading.value = false;
    });
}

watch(
  () => props.spotifyUri,
  (newVal) => {
    loading.value = true;
    if (!EmbedController) {
      let element = document.getElementById("embed-iframe");
      let options = {
        uri: "",
        width: "100%",
        height: "88px",
      };
      let callback = (controller) => {
        EmbedController = controller;
      };

      window.SpotifyIFrameAPI.createController(element, options, callback);

      EmbedController.addListener("ready", () => {
        loading.value = false;
      });
    }

    if (newVal.length === 1) {
      EmbedController.loadUri(newVal[0]);
    } else {
      fetchSpotifyUri(newVal);
    }
  }
);

onMounted(() => {
  spotify();
  window.onSpotifyIframeApiReady = (IFrameAPI) => {
    window.SpotifyIFrameAPI = IFrameAPI;
  };
});
</script>

<style scoped>
.topbarButton {
  @apply px-2 py-px mx-2 my-1 text-white transition-all duration-500 ease-in-out border-2 border-transparent cursor-pointer lg:py-3 lg:m-4 lg:px-4 w-fit text-ellipsis rounded-xl backdrop-blur-xl bg-opacity-40 hover:outline-2 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 hover:bg-slate-600 hover:bg-opacity-30 bg-gray-300 text-sm lg:text-2xl;
}
.loader {
  width: 48px;
  height: 48px;
  border: 5px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
