<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Search, Filter, ShoppingCart, Calendar, DollarSign } from 'lucide-vue-next'

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

const products = ref<Product[]>([])
const sales = ref<Sale[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedDateRange = ref('')
const showModal = ref(false)

const form = ref({
  productId: '',
  quantity: 1,
  unitPrice: 0,
  totalAmount: 0
})

const dateRanges = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本週' },
  { value: 'month', label: '本月' },
  { value: 'all', label: '全部' }
]

const filteredSales = computed(() => {
  let filtered = sales.value

  // 搜尋篩選
  if (searchQuery.value) {
    filtered = filtered.filter(sale => {
      const product = products.value.find(p => p.id === sale.productId)
      return product?.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    })
  }

  // 日期範圍篩選
  if (selectedDateRange.value && selectedDateRange.value !== 'all') {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    filtered = filtered.filter(sale => {
      const saleDate = new Date(sale.saleDate)
      
      switch (selectedDateRange.value) {
        case 'today':
          return saleDate >= today
        case 'week':
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay())
          return saleDate >= weekStart
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          return saleDate >= monthStart
        default:
          return true
      }
    })
  }

  return filtered.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
})

const salesStats = computed(() => {
  const filtered = filteredSales.value
  return {
    totalSales: filtered.length,
    totalRevenue: filtered.reduce((sum, sale) => sum + sale.totalAmount, 0),
    totalQuantity: filtered.reduce((sum, sale) => sum + sale.quantity, 0)
  }
})

onMounted(() => {
  Promise.all([loadProducts(), loadSales()])
})

async function loadProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/products')
    if (response.ok) {
      products.value = await response.json()
    }
  } catch (error) {
    console.error('載入商品失敗:', error)
  }
}

async function loadSales() {
  try {
    loading.value = true
    const response = await fetch('http://localhost:3000/api/sales')
    if (response.ok) {
      sales.value = await response.json()
    }
  } catch (error) {
    console.error('載入銷售記錄失敗:', error)
    alert('載入銷售記錄失敗，請檢查後端服務是否正常運行')
  } finally {
    loading.value = false
  }
}

function openModal() {
  form.value = {
    productId: '',
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function onProductChange() {
  const product = products.value.find(p => p.id === form.value.productId)
  if (product) {
    form.value.unitPrice = product.price
    calculateTotal()
  }
}

function onQuantityChange() {
  calculateTotal()
}

function calculateTotal() {
  form.value.totalAmount = form.value.quantity * form.value.unitPrice
}

async function saveSale() {
  try {
    const response = await fetch('http://localhost:3000/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form.value)
    })

    if (response.ok) {
      await Promise.all([loadProducts(), loadSales()])
      closeModal()
    } else {
      const error = await response.json()
      throw new Error(error.message || '新增銷售記錄失敗')
    }
  } catch (error) {
    console.error('新增銷售記錄失敗:', error)
    const errorMessage = error instanceof Error ? error.message : '新增銷售記錄失敗'
    alert(errorMessage)
  }
}

function getProductName(productId: string): string {
  const product = products.value.find(p => p.id === productId)
  return product?.name || '未知商品'
}

function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString()}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-TW')
}

function getAvailableStock(productId: string): number {
  const product = products.value.find(p => p.id === productId)
  return product?.stock || 0
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- 頁面標題與操作 -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold text-gray-900">銷售管理</h1>
      <button
        @click="openModal()"
        class="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        <Plus class="w-5 h-5 mr-2" />
        新增銷售
      </button>
    </div>

    <!-- 銷售統計 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-amber-200/50 p-4 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
          <div class="ml-3 sm:ml-4">
            <p class="text-xs sm:text-sm font-medium text-gray-500">銷售筆數</p>
            <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ salesStats.totalSales }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-amber-200/50 p-4 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign class="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
          <div class="ml-3 sm:ml-4">
            <p class="text-xs sm:text-sm font-medium text-gray-500">總銷售額</p>
            <p class="text-lg sm:text-2xl font-bold text-gray-900">{{ formatCurrency(salesStats.totalRevenue) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-amber-200/50 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar class="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
          <div class="ml-3 sm:ml-4">
            <p class="text-xs sm:text-sm font-medium text-gray-500">銷售數量</p>
            <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ salesStats.totalQuantity }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜尋與篩選 -->
    <div class="bg-white rounded-xl shadow-sm border border-amber-200/50 p-4 sm:p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- 搜尋框 -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋商品名稱..."
            class="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <!-- 日期範圍篩選 -->
        <div class="relative">
          <Filter class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <select
            v-model="selectedDateRange"
            class="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">選擇時間範圍</option>
            <option v-for="range in dateRanges" :key="range.value" :value="range.value">
              {{ range.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- 銷售記錄 -->
    <div class="bg-white rounded-xl shadow-sm border border-amber-200/50">
      <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
        <h2 class="text-base sm:text-lg font-semibold text-gray-900">
          銷售記錄 ({{ filteredSales.length }} 筆)
        </h2>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <p class="mt-2 text-gray-500 text-sm sm:text-base">載入中...</p>
      </div>

      <div v-else-if="filteredSales.length === 0" class="text-center py-12">
        <ShoppingCart class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 text-sm sm:text-base px-4">
          {{ searchQuery || selectedDateRange ? '沒有符合條件的銷售記錄' : '尚無銷售記錄' }}
        </p>
      </div>

      <!-- 桌面版表格 -->
      <div v-else class="hidden lg:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">銷售時間</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">單價</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">數量</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">總金額</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="sale in filteredSales" :key="sale.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ formatDate(sale.saleDate) }}
              </td>
              <td class="px-6 py-4">
                <p class="font-medium text-gray-900">{{ getProductName(sale.productId) }}</p>
              </td>
              <td class="px-6 py-4 text-gray-900">
                {{ formatCurrency(sale.unitPrice) }}
              </td>
              <td class="px-6 py-4 text-gray-900">
                {{ sale.quantity }}
              </td>
              <td class="px-6 py-4">
                <span class="font-semibold text-green-600">
                  {{ formatCurrency(sale.totalAmount) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 移動版卡片列表 -->
      <div v-else class="lg:hidden divide-y divide-gray-200">
        <div
          v-for="sale in filteredSales"
          :key="sale.id"
          class="p-4 hover:bg-gray-50"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-gray-900 text-sm">{{ getProductName(sale.productId) }}</h3>
              <p class="text-xs text-gray-500 mt-1">{{ formatDate(sale.saleDate) }}</p>
              <div class="flex items-center space-x-4 mt-2">
                <span class="text-sm text-gray-600">
                  單價: {{ formatCurrency(sale.unitPrice) }}
                </span>
                <span class="text-sm text-gray-600">
                  數量: {{ sale.quantity }}
                </span>
              </div>
            </div>
            <div class="ml-4 text-right">
              <span class="font-semibold text-green-600 text-lg">
                {{ formatCurrency(sale.totalAmount) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增銷售對話框 -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
          <h3 class="text-base sm:text-lg font-semibold text-gray-900">新增銷售</h3>
        </div>

        <form @submit.prevent="saveSale" class="p-4 sm:p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">商品</label>
            <select
              v-model="form.productId"
              @change="onProductChange"
              required
              class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">選擇商品</option>
              <option 
                v-for="product in products" 
                :key="product.id" 
                :value="product.id"
                :disabled="product.stock === 0"
              >
                {{ product.name }} (庫存: {{ product.stock }}) - {{ formatCurrency(product.price) }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">單價</label>
            <input
              v-model.number="form.unitPrice"
              type="number"
              min="0"
              step="0.01"
              required
              class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">數量</label>
            <input
              v-model.number="form.quantity"
              @input="onQuantityChange"
              type="number"
              min="1"
              :max="getAvailableStock(form.productId)"
              required
              class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <p v-if="form.productId" class="text-xs text-gray-500 mt-1">
              可售數量: {{ getAvailableStock(form.productId) }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">總金額</label>
            <div class="text-lg font-semibold text-gray-900 py-2">
              {{ formatCurrency(form.totalAmount) }}
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm sm:text-base"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="form.quantity > getAvailableStock(form.productId)"
              class="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 text-sm sm:text-base"
            >
              確認銷售
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
