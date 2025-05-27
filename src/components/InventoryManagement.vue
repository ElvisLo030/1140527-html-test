<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, ArrowUp, ArrowDown, Search, Filter, Package } from 'lucide-vue-next'

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

interface InventoryTransaction {
  id: string
  productId: string
  type: string
  quantity: number
  unitPrice?: number
  totalAmount?: number
  reason?: string
  createdAt: string
}

const products = ref<Product[]>([])
const transactions = ref<InventoryTransaction[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedType = ref('')
const showModal = ref(false)

const form = ref({
  productId: '',
  type: 'in' as 'in' | 'out',
  quantity: 0,
  reason: ''
})

const transactionTypes = [
  { value: 'in' as const, label: '入庫', icon: ArrowUp, color: 'text-green-600' },
  { value: 'out' as const, label: '出庫', icon: ArrowDown, color: 'text-red-600' }
]

const filteredTransactions = computed(() => {
  return transactions.value.filter(transaction => {
    const product = products.value.find(p => p.id === transaction.productId)
    const matchesSearch = product?.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         (transaction.reason || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = !selectedType.value || transaction.type === selectedType.value
    return matchesSearch && matchesType
  })
})

onMounted(() => {
  Promise.all([loadProducts(), loadTransactions()])
})

async function loadProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/products')
    if (response.ok) {
      const result = await response.json()
      products.value = result.success ? result.data.data : []
    }
  } catch (error) {
    console.error('載入商品失敗:', error)
  }
}

async function loadTransactions() {
  try {
    loading.value = true
    const response = await fetch('http://localhost:3000/api/inventory/transactions')
    if (response.ok) {
      transactions.value = await response.json()
    }
  } catch (error) {
    console.error('載入庫存記錄失敗:', error)
    alert('載入庫存記錄失敗，請檢查後端服務是否正常運行')
  } finally {
    loading.value = false
  }
}

function openModal() {
  form.value = {
    productId: '',
    type: 'in',
    quantity: 0,
    reason: ''
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveTransaction() {
  try {
    const response = await fetch('http://localhost:3000/api/inventory/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form.value)
    })

    if (response.ok) {
      await Promise.all([loadProducts(), loadTransactions()])
      closeModal()
    } else {
      throw new Error('新增庫存記錄失敗')
    }
  } catch (error) {
    console.error('新增庫存記錄失敗:', error)
    alert('新增庫存記錄失敗')
  }
}

function getProductName(productId: string): string {
  const product = products.value.find(p => p.id === productId)
  return product?.name || '未知商品'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-TW')
}

function getTransactionTypeInfo(type: string) {
  return transactionTypes.find(t => t.value === type) || transactionTypes[0]
}

function getStockStatus(stock: number) {
  if (stock === 0) return { class: 'bg-red-100 text-red-800', text: '缺貨' }
  if (stock < 10) return { class: 'bg-yellow-100 text-yellow-800', text: '庫存不足' }
  return { class: 'bg-green-100 text-green-800', text: '庫存充足' }
}

function getCategoryLabel(category: string): string {
  const categories = [
    { value: 'pen', label: '筆類' },
    { value: 'paper', label: '紙類' },
    { value: 'office', label: '辦公用品' },
    { value: 'other', label: '其他' }
  ]
  const categoryItem = categories.find(cat => cat.value === category)
  return categoryItem ? categoryItem.label : category
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- 頁面標題與操作 -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold text-gray-900">庫存管理</h1>
      <button
        @click="openModal()"
        class="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        <Plus class="w-5 h-5 mr-2" />
        新增庫存異動
      </button>
    </div>

    <!-- 當前庫存概覽 -->
    <div class="bg-white rounded-xl shadow-sm border border-amber-200/50">
      <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
        <h2 class="text-base sm:text-lg font-semibold text-gray-900">當前庫存</h2>
      </div>
      <div class="p-4 sm:p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <div
            v-for="product in products"
            :key="product.id"
            class="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-medium text-gray-900 truncate text-sm sm:text-base">{{ product.name }}</h3>
              <span 
                :class="getStockStatus(product.stock).class"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shrink-0 ml-2"
              >
                {{ product.stock }}
              </span>
            </div>
            <p class="text-xs sm:text-sm text-gray-500 mb-2">{{ getCategoryLabel(product.category) }}</p>
            <div class="mt-2">
              <span 
                :class="getStockStatus(product.stock).class"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              >
                {{ getStockStatus(product.stock).text }}
              </span>
            </div>
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
            placeholder="搜尋商品名稱或異動原因..."
            class="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <!-- 類型篩選 -->
        <div class="relative">
          <Filter class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <select
            v-model="selectedType"
            class="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">所有類型</option>
            <option v-for="type in transactionTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- 庫存異動記錄 -->
    <div class="bg-white rounded-xl shadow-sm border border-amber-200/50">
      <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
        <h2 class="text-base sm:text-lg font-semibold text-gray-900">
          庫存異動記錄 ({{ filteredTransactions.length }} 筆)
        </h2>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <p class="mt-2 text-gray-500 text-sm sm:text-base">載入中...</p>
      </div>

      <div v-else-if="filteredTransactions.length === 0" class="text-center py-12">
        <Package class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 text-sm sm:text-base px-4">
          {{ searchQuery || selectedType ? '沒有符合條件的記錄' : '尚無庫存異動記錄' }}
        </p>
      </div>

      <!-- 桌面版表格 -->
      <div v-else class="hidden lg:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">類型</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">數量</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="transaction in filteredTransactions" :key="transaction.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ formatDate(transaction.createdAt) }}
              </td>
              <td class="px-6 py-4">
                <p class="font-medium text-gray-900">{{ getProductName(transaction.productId) }}</p>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <component 
                    :is="getTransactionTypeInfo(transaction.type).icon"
                    :class="getTransactionTypeInfo(transaction.type).color"
                    class="w-4 h-4 mr-2"
                  />
                  <span 
                    :class="{
                      'text-green-800 bg-green-100': transaction.type === 'in',
                      'text-red-800 bg-red-100': transaction.type === 'out'
                    }"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ getTransactionTypeInfo(transaction.type).label }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span 
                  :class="{
                    'text-green-600': transaction.type === 'in',
                    'text-red-600': transaction.type === 'out'
                  }"
                  class="font-medium"
                >
                  {{ transaction.type === 'in' ? '+' : '-' }}{{ transaction.quantity }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">
                {{ transaction.reason }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 移動版卡片列表 -->
      <div v-else class="lg:hidden divide-y divide-gray-200">
        <div
          v-for="transaction in filteredTransactions"
          :key="transaction.id"
          class="p-4 hover:bg-gray-50"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center mb-2">
                <component 
                  :is="getTransactionTypeInfo(transaction.type).icon"
                  :class="getTransactionTypeInfo(transaction.type).color"
                  class="w-4 h-4 mr-2 shrink-0"
                />
                <span 
                  :class="{
                    'text-green-800 bg-green-100': transaction.type === 'in',
                    'text-red-800 bg-red-100': transaction.type === 'out'
                  }"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ getTransactionTypeInfo(transaction.type).label }}
                </span>
              </div>
              <h3 class="font-medium text-gray-900 text-sm">{{ getProductName(transaction.productId) }}</h3>
              <p class="text-xs text-gray-500 mt-1">{{ formatDate(transaction.createdAt) }}</p>
              <p class="text-sm text-gray-600 mt-2">{{ transaction.reason }}</p>
            </div>
            <div class="ml-4 text-right">
              <span 
                :class="{
                  'text-green-600': transaction.type === 'in',
                  'text-red-600': transaction.type === 'out'
                }"
                class="font-medium text-lg"
              >
                {{ transaction.type === 'in' ? '+' : '-' }}{{ transaction.quantity }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增庫存異動對話框 -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
          <h3 class="text-base sm:text-lg font-semibold text-gray-900">新增庫存異動</h3>
        </div>

        <form @submit.prevent="saveTransaction" class="p-4 sm:p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">商品</label>
            <select
              v-model="form.productId"
              required
              class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">選擇商品</option>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.name }} (目前庫存: {{ product.stock }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">異動類型</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="type in transactionTypes"
                :key="type.value"
                type="button"
                @click="form.type = type.value"
                :class="{
                  'bg-amber-100 border-amber-500 text-amber-700': form.type === type.value,
                  'bg-white border-gray-300 text-gray-700': form.type !== type.value
                }"
                class="flex items-center justify-center px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <component :is="type.icon" class="w-4 h-4 mr-1 sm:mr-2" />
                <span class="hidden sm:inline">{{ type.label }}</span>
                <span class="sm:hidden">{{ type.label.charAt(0) }}</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">數量</label>
            <input
              v-model.number="form.quantity"
              type="number"
              min="1"
              required
              class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">異動原因</label>
            <textarea
              v-model="form.reason"
              rows="3"
              required
              placeholder="請說明異動原因..."
              class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            ></textarea>
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
              class="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base"
            >
              確認異動
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
