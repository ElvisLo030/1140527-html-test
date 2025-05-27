<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-vue-next'

// 簡化的介面定義，與後端回傳格式匹配
interface Product {
  id: string
  name: string
  category: string
  description?: string
  unit: string
  price: number
  cost: number
  stock: number
  minStock?: number
  createdAt: string
  updatedAt: string
}

interface Sale {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  saleDate: string
  createdAt: string
  updatedAt: string
}

const stats = ref({
  totalProducts: 0,
  lowStockProducts: 0,
  todayRevenue: 0,
  todaySales: 0
})

const recentSales = ref<Sale[]>([])
const lowStockProducts = ref<Product[]>([])
const loading = ref(true)

onMounted(async () => {
  await loadDashboardData()
})

async function loadDashboardData() {
  try {
    loading.value = true
    
    // 並行載入所有資料
    const [productsRes, salesRes] = await Promise.all([
      fetch('http://localhost:3000/api/products'),
      fetch('http://localhost:3000/api/sales')
    ])

    if (productsRes.ok) {
      const products: Product[] = await productsRes.json()
      stats.value.totalProducts = products.length
      
      // 找出庫存不足的商品（庫存 < 10）
      const lowStock = products.filter(p => p.stock < 10)
      stats.value.lowStockProducts = lowStock.length
      lowStockProducts.value = lowStock.slice(0, 5) // 只顯示前5個
    }

    if (salesRes.ok) {
      const sales: Sale[] = await salesRes.json()
      
      // 計算今日銷售
      const today = new Date().toISOString().split('T')[0]
      const todaySalesData = sales.filter(s => s.saleDate.startsWith(today))
      
      stats.value.todaySales = todaySalesData.length
      stats.value.todayRevenue = todaySalesData.reduce((sum, s) => sum + s.totalAmount, 0)
      
      // 最近銷售記錄
      recentSales.value = sales.slice(0, 5)
    }
  } catch (error) {
    console.error('載入儀表板資料失敗:', error)
  } finally {
    loading.value = false
  }
}

function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString()}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-TW')
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <!-- 頁面標題 -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-xl sm:text-2xl font-bold text-gray-900">儀表板</h1>
      <div class="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-0">
        {{ new Date().toLocaleDateString('zh-TW', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        }) }}
      </div>
    </div>

    <!-- 統計卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <!-- 總商品數 -->
      <div class="bg-white rounded-xl shadow-sm border border-amber-200/50 p-4 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
          <div class="ml-3 sm:ml-4">
            <p class="text-xs sm:text-sm font-medium text-gray-500">總商品數</p>
            <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ stats.totalProducts }}</p>
          </div>
        </div>
      </div>

      <!-- 庫存不足 -->
      <div class="bg-white rounded-xl shadow-sm border border-amber-200/50 p-4 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle class="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
          <div class="ml-3 sm:ml-4">
            <p class="text-xs sm:text-sm font-medium text-gray-500">庫存不足</p>
            <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ stats.lowStockProducts }}</p>
          </div>
        </div>
      </div>

      <!-- 今日銷售額 -->
      <div class="bg-white rounded-xl shadow-sm border border-amber-200/50 p-4 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign class="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
          <div class="ml-3 sm:ml-4">
            <p class="text-xs sm:text-sm font-medium text-gray-500">今日銷售額</p>
            <p class="text-lg sm:text-2xl font-bold text-gray-900">{{ formatCurrency(stats.todayRevenue) }}</p>
          </div>
        </div>
      </div>

      <!-- 今日銷售筆數 -->
      <div class="bg-white rounded-xl shadow-sm border border-amber-200/50 p-4 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp class="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
          <div class="ml-3 sm:ml-4">
            <p class="text-xs sm:text-sm font-medium text-gray-500">今日銷售筆數</p>
            <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ stats.todaySales }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 內容區域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <!-- 最近銷售 -->
      <div class="bg-white rounded-xl shadow-sm border border-amber-200/50">
        <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">最近銷售</h2>
        </div>
        <div class="p-4 sm:p-6">
          <div v-if="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
            <p class="mt-2 text-xs sm:text-sm text-gray-500">載入中...</p>
          </div>
          <div v-else-if="recentSales.length === 0" class="text-center py-8">
            <p class="text-gray-500 text-sm sm:text-base">暫無銷售記錄</p>
          </div>
          <div v-else class="space-y-3 sm:space-y-4">
            <div
              v-for="sale in recentSales"
              :key="sale.id"
              class="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-b-0"
            >
              <div>
                <p class="font-medium text-gray-900 text-sm sm:text-base">銷售單 #{{ sale.id }}</p>
                <p class="text-xs sm:text-sm text-gray-500">{{ formatDate(sale.saleDate) }}</p>
              </div>
              <div class="text-right">
                <p class="font-medium text-gray-900 text-sm sm:text-base">{{ formatCurrency(sale.totalAmount) }}</p>
                <p class="text-xs sm:text-sm text-gray-500">{{ sale.quantity }} 件</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 庫存警告 -->
      <div class="bg-white rounded-xl shadow-sm border border-amber-200/50">
        <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">庫存警告</h2>
        </div>
        <div class="p-4 sm:p-6">
          <div v-if="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
            <p class="mt-2 text-xs sm:text-sm text-gray-500">載入中...</p>
          </div>
          <div v-else-if="lowStockProducts.length === 0" class="text-center py-8">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package class="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <p class="text-gray-500 text-sm sm:text-base">所有商品庫存充足</p>
          </div>
          <div v-else class="space-y-3 sm:space-y-4">
            <div
              v-for="product in lowStockProducts"
              :key="product.id"
              class="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-b-0"
            >
              <div>
                <p class="font-medium text-gray-900 text-sm sm:text-base">{{ product.name }}</p>
                <p class="text-xs sm:text-sm text-gray-500">{{ product.category }}</p>
              </div>
              <div class="text-right">
                <span class="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  剩餘 {{ product.stock }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
