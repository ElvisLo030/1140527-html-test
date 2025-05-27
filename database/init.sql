-- 文青文具小舖資料庫初始化腳本

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 插入範例商品分類資料
INSERT INTO products (name, category, description, unit, price, cost, stock, min_stock) VALUES
-- 筆類商品
('Pilot G2 原子筆', 'pen', '日本 Pilot G2 經典原子筆，書寫流暢', '支', 35.00, 25.00, 50, 10),
('三菱 UNI-ball 中性筆', 'pen', '三菱 UNI-ball 中性筆，防水墨水', '支', 45.00, 32.00, 30, 8),
('Faber-Castell 鉛筆 HB', 'pen', '德國輝柏嘉 HB 鉛筆，木質優良', '支', 15.00, 10.00, 100, 20),
('STAEDTLER 彩色筆組', 'pen', '德國施德樓 24色彩色筆組', '組', 280.00, 200.00, 15, 5),
('萬寶龍鋼筆', 'pen', '德國萬寶龍經典鋼筆', '支', 8500.00, 6000.00, 3, 1),

-- 紙類商品
('Moleskine 經典筆記本', 'paper', 'Moleskine 經典硬殼筆記本 A5', '本', 450.00, 320.00, 25, 8),
('無印良品再生紙筆記本', 'paper', '無印良品環保再生紙筆記本', '本', 120.00, 85.00, 40, 10),
('Post-it 便利貼', 'paper', '3M Post-it 便利貼經典黃色', '包', 85.00, 60.00, 60, 15),
('A4 影印紙', 'paper', 'Double A A4 影印紙 70磅', '包', 110.00, 78.00, 80, 20),
('牛皮紙信封', 'paper', '牛皮紙信封 C5 尺寸', '包', 45.00, 32.00, 35, 10),

-- 辦公用品
('MAX 釘書機', 'office', 'MAX HD-10V 釘書機', '個', 180.00, 128.00, 20, 5),
('釘書針', 'office', 'MAX No.10 釘書針', '盒', 25.00, 18.00, 50, 12),
('3M 透明膠帶', 'office', '3M Scotch 透明膠帶 18mm', '個', 35.00, 25.00, 45, 10),
('迴紋針', 'office', '不鏽鋼迴紋針 28mm', '盒', 15.00, 10.00, 30, 8),
('文件夾', 'office', 'A4 資料夾附分隔頁', '個', 55.00, 39.00, 25, 6),

-- 其他文具
('橡皮擦', 'other', 'FABER-CASTELL 橡皮擦', '個', 12.00, 8.00, 70, 15),
('尺規組', 'other', '學生用尺規組合', '組', 65.00, 46.00, 18, 5),
('計算機', 'other', 'CASIO 基本型計算機', '個', 250.00, 178.00, 12, 3),
('美工刀', 'other', 'OLFA 美工刀大型', '個', 85.00, 60.00, 22, 5),
('筆筒', 'other', '木質筆筒', '個', 120.00, 85.00, 15, 4)

ON CONFLICT DO NOTHING;

-- 插入範例庫存異動記錄
INSERT INTO inventory_transactions (product_id, type, quantity, unit_price, total_amount, reason) 
SELECT 
    id, 
    'in', 
    stock, 
    cost, 
    stock * cost, 
    '期初庫存'
FROM products
ON CONFLICT DO NOTHING;

-- 插入範例銷售記錄
INSERT INTO sales_records (product_id, quantity, unit_price, total_amount)
SELECT 
    id,
    FLOOR(RANDOM() * 5 + 1)::INTEGER,
    price,
    (FLOOR(RANDOM() * 5 + 1) * price)
FROM products 
WHERE RANDOM() < 0.3
ON CONFLICT DO NOTHING;

-- 建立索引以提升效能
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_category_stock ON products(category, stock);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_records_date ON sales_records(created_at DESC);

-- 插入完成訊息
DO $$
BEGIN
    RAISE NOTICE '✅ 文青文具小舖資料庫初始化完成！';
    RAISE NOTICE '📊 已建立範例商品、庫存異動記錄和銷售記錄';
END $$;
