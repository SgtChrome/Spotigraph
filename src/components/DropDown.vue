<template>
  <div class="m-auto text-right w-fit">
    <Menu as="div" class="relative inline-block text-left">
      <div class="m-auto">
        <MenuButton
          class="inline-flex justify-center w-full px-2 py-1 text-sm font-medium text-white bg-gray-300 rounded-md md:px-3 md:py-2 lg:px-4 lg:py-2 hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 bg-opacity-40"
        >
          {{ activeFiltering }}
          <ChevronDownIcon
            class="w-5 h-5 ml-2 -mr-1 text-violet-200 hover:text-violet-100"
            aria-hidden="true"
          />
        </MenuButton>
      </div>

      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <MenuItems
          class="absolute right-0 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg w-fit ring-1 ring-black/5 focus:outline-none"
        >
          <div class="px-1 py-1">
            <MenuItem v-slot="{ active }">
              <button
                :class="[
                  active ? 'bg-violet-500 text-white' : 'text-gray-900',
                  'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                ]"
                @click="activeFiltering = 'Songs'"
              >
                Songs
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }" v-if="extendedHistory">
              <button
                :class="[
                  active ? 'bg-violet-500 text-white' : 'text-gray-900',
                  'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                ]"
                @click="activeFiltering = 'Albums'"
              >
                Albums
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button
                :class="[
                  active ? 'bg-violet-500 text-white' : 'text-gray-900',
                  'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                ]"
                @click="activeFiltering = 'Artists'"
              >
                Artists
              </button>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </Menu>
  </div>
</template>

<script setup>
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { ChevronDownIcon } from "@heroicons/vue/20/solid";
import { ref, watch } from "vue";

const emit = defineEmits(["filtering"]);
const props = defineProps(["extendedHistory"]);

let activeFiltering = ref("Songs");
watch(activeFiltering, (newValue) => {
  emit("filtering", newValue);
});
</script>
