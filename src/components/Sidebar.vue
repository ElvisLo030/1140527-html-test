<script setup lang="ts">
import { Home, Package, Warehouse, ShoppingCart } from 'lucide-vue-next'

interface NavigationItem {
  id: string
  name: string
  icon: string
}

interface Props {
  currentView: string
  navigation: NavigationItem[]
  isOpen: boolean
}

interface Emits {
  setView: [view: string]
  close: []
}

defineProps<Props>()
defineEmits<Emits>()

const iconComponents = {
  home: Home,
  package: Package,
  warehouse: Warehouse,
  'shopping-cart': ShoppingCart
}

function getIconComponent(iconName: string) {
  return iconComponents[iconName as keyof typeof iconComponents] || Home
}
</script>

<template>
  <!-- 移動端背景遮罩 -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
    @click="$emit('close')"
  ></div>

  <!-- 側邊欄 -->
  <aside
    :class="{
      'translate-x-0': isOpen,
      '-translate-x-full': !isOpen
    }"
    class="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-amber-900 to-orange-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0"
  >
    <div class="flex flex-col h-full">
      <!-- Logo 區域 -->
      <div class="flex items-center justify-center h-16 px-4 bg-amber-800/30">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
            <Package class="w-5 h-5 text-amber-900" />
          </div>
          <span class="text-xl font-bold text-amber-100">文青文具</span>
        </div>
      </div>

      <!-- 導航選單 -->
      <nav class="flex-1 px-4 py-6 space-y-2">
        <button
          v-for="item in navigation"
          :key="item.id"
          @click="$emit('setView', item.id)"
          :class="{
            'bg-amber-700/50 text-amber-100 border-amber-500/50': currentView === item.id,
            'text-amber-200 hover:bg-amber-800/30 hover:text-amber-100 border-transparent': currentView !== item.id
          }"
          class="w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-200 border"
        >
          <component 
            :is="getIconComponent(item.icon)" 
            class="w-5 h-5 mr-3" 
          />
          {{ item.name }}
        </button>
      </nav>

      <!-- 版權資訊 -->
      <div class="px-4 py-4 border-t border-amber-700/30">
        <p class="text-xs text-amber-300 text-center">
          © 2025 文青文具小舖
        </p>
      </div>
    </div>
  </aside>
</template>
