<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Edit2, Trash2, Search, Filter, Package } from 'lucide-vue-next'

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

const products = ref<Product[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const showModal = ref(false)
const editingProduct = ref<Product | null>(null)

const categories = [
  { value: 'pen', label: '筆類' },
  { value: 'paper', label: '紙類' },
  { value: 'office', label: '辦公用品' },
  { value: 'other', label: '其他' }
]

const form = ref({
  name: '',
  description: '',
  category: '',
  unit: '',
  price: 0,
  cost: 0,
  stock: 0,
  minStock: 0
})

const filteredProducts = computed(() => {
  return products.value.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         (product.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = !selectedCategory.value || product.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

onMounted(() => {
  loadProducts()
})

async function loadProducts() {
  try {
    loading.value = true
    const response = await fetch('http://localhost:3000/api/products')
    if (response.ok) {
      const result = await response.json()
      // 後端回傳的格式是 { success: true, data: { data: [...], total: ... } }
      products.value = result.data?.data || []
    } else {
      throw new Error('載入商品失敗')
    }
  } catch (error) {
    console.error('載入商品失敗:', error)
    alert('載入商品失敗，請檢查後端服務是否正常運行')
  } finally {
    loading.value = false
  }
}

function openModal(product?: Product) {
  if (product) {
    editingProduct.value = product
    form.value = {
      name: product.name,
      description: product.description || '',
      category: product.category,
      unit: product.unit,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock || 0
    }
  } else {
    editingProduct.value = null
    form.value = {
      name: '',
      description: '',
      category: '',
      unit: '',
      price: 0,
      cost: 0,
      stock: 0,
      minStock: 0
    }
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingProduct.value = null
}

async function saveProduct() {
  try {
    const url = editingProduct.value 
      ? `http://localhost:3000/api/products/${editingProduct.value.id}`
      : 'http://localhost:3000/api/products'
    
    const method = editingProduct.value ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form.value)
    })

    if (response.ok) {
      await loadProducts()
      closeModal()
    } else {
      throw new Error('儲存商品失敗')
    }
  } catch (error) {
    console.error('儲存商品失敗:', error)
    alert('儲存商品失敗')
  }
}

async function deleteProduct(id: string) {
  if (!confirm('確定要刪除這個商品嗎？')) return

  try {
    const response = await fetch(`http://localhost:3000/api/products/${id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      await loadProducts()
    } else {
      throw new Error('刪除商品失敗')
    }
  } catch (error) {
    console.error('刪除商品失敗:', error)
    alert('刪除商品失敗')
  }
}

function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString()}`
}

function getStockStatus(stock: number) {
  if (stock === 0) return { class: 'bg-red-100 text-red-800', text: '缺貨' }
  if (stock < 10) return { class: 'bg-yellow-100 text-yellow-800', text: '庫存不足' }
  return { class: 'bg-green-100 text-green-800', text: '庫存充足' }
}

function getCategoryLabel(category: string): string {
  const categoryItem = categories.find(cat => cat.value === category)
  return categoryItem ? categoryItem.label : category
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- 頁面標題與操作 -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold text-gray-900">商品管理</h1>
      <button
        @click="openModal()"
        class="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        <Plus class="w-5 h-5 mr-2" />
        新增商品
      </button>
    </div>

    <!-- 搜尋與篩選 -->
    <div class="bg-white rounded-xl shadow-sm border border-amber-200/50 p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 搜尋框 -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋商品名稱或描述..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <!-- 分類篩選 -->
        <div class="relative">
          <Filter class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            v-model="selectedCategory"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">所有分類</option>
            <option v-for="category in categories" :key="category.value" :value="category.value">
              {{ category.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="bg-white rounded-xl shadow-sm border border-amber-200/50">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">
          商品列表 ({{ filteredProducts.length }} 項)
        </h2>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <p class="mt-2 text-gray-500">載入中...</p>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="text-center py-12">
        <Package class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500">
          {{ searchQuery || selectedCategory ? '沒有符合條件的商品' : '尚未新增任何商品' }}
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品資訊</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分類</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">價格</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">庫存</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div>
                  <p class="font-medium text-gray-900">{{ product.name }}</p>
                  <p class="text-sm text-gray-500">{{ product.description }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {{ getCategoryLabel(product.category) }}
                </span>
              </td>
              <td class="px-6 py-4 text-gray-900 font-medium">
                {{ formatCurrency(product.price) }}
              </td>
              <td class="px-6 py-4 text-gray-900">
                {{ product.stock }}
              </td>
              <td class="px-6 py-4">
                <span 
                  :class="getStockStatus(product.stock).class"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ getStockStatus(product.stock).text }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click="openModal(product)"
                    class="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors duration-200"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteProduct(product.id)"
                    class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 新增/編輯商品對話框 -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ editingProduct ? '編輯商品' : '新增商品' }}
          </h3>
        </div>

        <form @submit.prevent="saveProduct" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">商品名稱</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">商品描述</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分類</label>
            <select
              v-model="form.category"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">選擇分類</option>
              <option v-for="category in categories" :key="category.value" :value="category.value">
                {{ category.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">單位</label>
            <input
              v-model="form.unit"
              type="text"
              required
              placeholder="例如：支、盒、包"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">成本</label>
              <input
                v-model.number="form.cost"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">售價</label>
              <input
                v-model.number="form.price"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">庫存數量</label>
              <input
                v-model.number="form.stock"
                type="number"
                min="0"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">最低庫存警戒</label>
              <input
                v-model.number="form.minStock"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors duration-200"
            >
              {{ editingProduct ? '更新' : '新增' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
