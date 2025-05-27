<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Dashboard from './components/Dashboard.vue'
import ProductManagement from './components/ProductManagement.vue'
import InventoryManagement from './components/InventoryManagement.vue'
import SalesManagement from './components/SalesManagement.vue'
import { Menu } from 'lucide-vue-next'

const currentView = ref('dashboard')
const sidebarOpen = ref(false)

const navigation = [
  { id: 'dashboard', name: '儀表板', icon: 'home' },
  { id: 'products', name: '商品管理', icon: 'package' },
  { id: 'inventory', name: '庫存管理', icon: 'warehouse' },
  { id: 'sales', name: '銷售管理', icon: 'shopping-cart' }
]

function setCurrentView(view: string) {
  currentView.value = view
  sidebarOpen.value = false
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

onMounted(() => {
  // 檢查後端 API 是否可用
  fetch('http://localhost:3000/api/health')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('✅ 後端 API 連線成功')
      }
    })
    .catch(error => {
      console.warn('⚠️ 後端 API 尚未啟動:', error)
    })
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
    <!-- 頁首 -->
    <header class="bg-white shadow-sm border-b border-amber-200/50">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo 和標題 -->
          <div class="flex items-center">
            <button
              @click="toggleSidebar"
              class="p-2 rounded-md text-amber-700 hover:bg-amber-100 lg:hidden"
            >
              <Menu class="h-6 w-6" />
            </button>
            <div class="flex items-center ml-2 lg:ml-0">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-sm">文</span>
                </div>
              </div>
              <div class="ml-3">
                <h1 class="text-xl font-bold text-gray-900">文青文具小舖</h1>
                <p class="text-sm text-gray-600">進銷存管理系統</p>
              </div>
            </div>
          </div>
          
          <!-- 右側信息 -->
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">歡迎回來，老闆！</span>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- 側邊欄 -->
      <Sidebar 
        :current-view="currentView" 
        :navigation="navigation" 
        :is-open="sidebarOpen"
        @set-view="setCurrentView"
        @close="sidebarOpen = false"
      />

      <!-- 主要內容區域 -->
      <main class="flex-1 lg:pl-64">
        <Dashboard v-if="currentView === 'dashboard'" />
        <ProductManagement v-else-if="currentView === 'products'" />
        <InventoryManagement v-else-if="currentView === 'inventory'" />
        <SalesManagement v-else-if="currentView === 'sales'" />
      </main>
    </div>
  </div>
</template>
