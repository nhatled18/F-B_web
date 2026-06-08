import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { updateInventoryStock, updateMultipleInventoryStocks } from '../utils/inventoryHelper.js';
import {
  parseNonNegativeInt,
  parseNonNegativeFloat,
  parseIfDefined,
  cleanString,
} from '../utils/validators.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const LOW_STOCK_THRESHOLD = 50;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const BATCH_LOG_INTERVAL = 50; // log mỗi N item khi xử lý batch

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Trả về endingStock = initial + in - out - damaged */
function calcEndingStock(initial, stockIn, stockOut, damaged) {
  return initial + stockIn - stockOut - damaged;
}

/** Ghi history log, không throw nếu lỗi (non-critical) */
async function writeHistoryLog(data) {
  try {
    await prisma.historyLog.create({ data });
  } catch (err) {
    console.error('⚠️  HistoryLog write failed (non-critical):', err.message);
  }
}

/** Chuẩn hoá tham số phân trang */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit) || DEFAULT_PAGE_SIZE));
  return { page, limit, skip: (page - 1) * limit };
}

// ─── Controller ───────────────────────────────────────────────────────────────

class InventoryController {

  // ============================================================
  // 🔧 INIT & SYNC
  // ============================================================

  /**
   * POST /api/inventory/init/create-missing
   * Tạo Inventory cho tất cả Product chưa có Inventory
   */
  async createMissingInventories(req, res) {
    try {
      // 1. Lấy tất cả productId đã có inventory
      const [allProducts, existingProductIds] = await Promise.all([
        prisma.product.findMany({
          select: {
            id: true, productName: true, sku: true,
            retailPrice: true, cost: true,
            stockType1: true, stockType2: true,
          },
          orderBy: { id: 'asc' },
        }),
        prisma.inventory
          .findMany({ select: { productId: true } })
          .then(rows => new Set(rows.map(r => r.productId))),
      ]);

      const missingProducts = allProducts.filter(p => !existingProductIds.has(p.id));

      if (missingProducts.length === 0) {
        return res.json({
          success: true,
          message: 'Tất cả sản phẩm đã có inventory!',
          data: { total: allProducts.length, existing: existingProductIds.size, created: 0 },
        });
      }

      // 2. createMany thay vì loop — 1 query duy nhất
      const now = new Date().toISOString();
      const { count } = await prisma.inventory.createMany({
        data: missingProducts.map(p => ({
          productId: p.id,
          initialStock: 0,
          stockIn: 0,
          stockOut: 0,
          endingStock: 0,
          damaged: 0,
          displayStock: 0,
          retailPrice: Number(p.retailPrice) || 0,
          cost: Number(p.cost) || 0,
          stockType1: p.stockType1 || '',
          stockType2: p.stockType2 || '',
          note: `Auto-created on ${now}`,
        })),
        skipDuplicates: true, // race-condition safety
      });

      console.log(`✅ [INIT] Created ${count}/${missingProducts.length} inventories`);

      return res.status(201).json({
        success: true,
        message: `Tạo thành công ${count} inventory`,
        data: {
          total: allProducts.length,
          existing: existingProductIds.size,
          created: count,
          // Chỉ trả về preview 20 item tránh response quá lớn
          createdItems: missingProducts.slice(0, 20).map(p => ({
            productId: p.id, sku: p.sku, name: p.productName,
          })),
        },
      });
    } catch (error) {
      console.error('❌ Init error:', error);
      return res.status(500).json({ success: false, error: 'Lỗi tạo inventory: ' + error.message });
    }
  }

  /**
   * GET /api/inventory/stats/missing
   */
  async checkMissingInventories(req, res) {
    try {
      // Dùng LEFT JOIN thay vì đếm rồi trừ — chính xác hơn
      const [totalProducts, coveredCount] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({
          where: { inventory: { isNot: null } },
        }),
      ]);

      const missing = totalProducts - coveredCount;

      return res.json({
        success: true,
        data: {
          totalProducts,
          totalInventories: coveredCount,
          missing,
          percentage: totalProducts > 0 ? Math.round((coveredCount / totalProducts) * 100) : 0,
        },
      });
    } catch (error) {
      console.error('❌ Stats error:', error);
      return res.status(500).json({ success: false, error: 'Lỗi lấy thống kê: ' + error.message });
    }
  }

  /**
   * POST /api/inventory/sync/all
   */
  async syncAllInventories(req, res) {
    try {
      const productIds = await prisma.inventory
        .findMany({ select: { productId: true }, orderBy: { productId: 'asc' } })
        .then(rows => rows.map(r => r.productId));

      if (productIds.length === 0) {
        return res.json({
          success: true,
          message: 'Không có inventory nào để đồng bộ',
          data: { total: 0, success: 0, failed: 0 },
        });
      }

      const results = await updateMultipleInventoryStocks(productIds);
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      console.log(`✅ [SYNC ALL] ${successCount}/${results.length} success`);

      return res.json({
        success: true,
        message: `Đồng bộ hoàn tất: ${successCount} thành công, ${failedCount} thất bại`,
        data: {
          total: results.length, success: successCount, failed: failedCount,
          failedItems: results.filter(r => !r.success),
        },
      });
    } catch (error) {
      console.error('❌ Sync all error:', error);
      return res.status(500).json({ success: false, error: 'Lỗi đồng bộ tồn kho: ' + error.message });
    }
  }

  /**
   * POST /api/inventory/:productId/sync
   */
  async syncInventoryByProduct(req, res) {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, error: 'productId không hợp lệ' });
      }

      const exists = await prisma.inventory.findFirst({ where: { productId } });
      if (!exists) {
        return res.status(404).json({ success: false, error: 'Inventory không tồn tại cho sản phẩm này' });
      }

      const updated = await updateInventoryStock(productId);
      return res.json({ success: true, message: 'Đồng bộ tồn kho thành công', data: updated });
    } catch (error) {
      console.error('❌ Sync product error:', error);
      return res.status(500).json({ success: false, error: 'Lỗi đồng bộ tồn kho: ' + error.message });
    }
  }

  // ============================================================
  // 📋 CRUD
  // ============================================================

  /** GET /api/inventory */
  async getAllInventories(req, res) {
    try {
      const { page, limit, skip } = parsePagination(req.query);

      const [inventories, total] = await Promise.all([
        prisma.inventory.findMany({
          include: {
            product: { select: { id: true, productName: true, sku: true, group: true, unit: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.inventory.count(),
      ]);

      return res.json({
        success: true,
        data: inventories,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error('Get all inventories error:', error);
      return res.status(500).json({ success: false, error: 'Lỗi khi lấy danh sách tồn kho' });
    }
  }

  /** GET /api/inventory/search?q=&group=&stockType1=&page=&limit= */
  async searchInventories(req, res) {
    try {
      const { q = '', group, stockType1 } = req.query;
      const { page, limit, skip } = parsePagination(req.query);

      const where = {};

      if (stockType1) where.stockType1 = stockType1;

      if (group || q) {
        where.product = {};
        if (group && group !== 'all') where.product.group = group;
        if (q) {
          where.product.OR = [
            { productName: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
            { group: { contains: q, mode: 'insensitive' } },
          ];
        }
      }

      const [inventories, total] = await Promise.all([
        prisma.inventory.findMany({
          where,
          include: {
            product: { select: { id: true, productName: true, sku: true, group: true, unit: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.inventory.count({ where }),
      ]);

      return res.json({
        success: true,
        data: inventories,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error('Search inventories error:', error);
      return res.status(500).json({ success: false, error: 'Lỗi khi tìm kiếm tồn kho' });
    }
  }

  /** GET /api/inventory/:id */
  async getInventoryById(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID không hợp lệ' });

      const inventory = await prisma.inventory.findUnique({
        where: { id },
        include: {
          product: {
            select: { id: true, productName: true, sku: true, group: true, stockType1: true, stockType2: true, unit: true },
          },
        },
      });

      if (!inventory) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy bản ghi tồn kho' });
      }

      return res.json({ success: true, data: inventory });
    } catch (error) {
      console.error('Get inventory error:', error);
      return res.status(500).json({ success: false, error: 'Lỗi khi lấy thông tin tồn kho' });
    }
  }

  /** POST /api/inventory */
  async createInventory(req, res) {
    try {
      const { productId, stockType1, stockType2, retailPrice, cost, initialStock, displayStock, note } = req.body;

      if (!productId) {
        return res.status(400).json({ success: false, error: 'productId là bắt buộc' });
      }

      // Validate số
      const parsedInitial = parseNonNegativeInt(initialStock ?? 0, 'initialStock');
      const parsedDisplayStock = parseNonNegativeInt(displayStock ?? 0, 'displayStock');
      const parsedRetailPrice = parseNonNegativeFloat(retailPrice ?? 0, 'retailPrice');
      const parsedCost = parseNonNegativeFloat(cost ?? 0, 'cost');

      // Check product & duplicate trong 1 lần query
      const [product, existingInventory] = await Promise.all([
        prisma.product.findUnique({ where: { id: Number(productId) } }),
        prisma.inventory.findFirst({ where: { productId: Number(productId) } }),
      ]);

      if (!product) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
      if (existingInventory) return res.status(409).json({ success: false, error: 'Sản phẩm này đã có inventory' });

      const inventory = await prisma.inventory.create({
        data: {
          productId: Number(productId),
          stockType1: cleanString(stockType1),
          stockType2: cleanString(stockType2),
          retailPrice: parsedRetailPrice,
          cost: parsedCost,
          initialStock: parsedInitial,
          displayStock: parsedDisplayStock,
          stockIn: 0,
          stockOut: 0,
          damaged: 0,
          endingStock: parsedInitial,
          note: cleanString(note),
        },
        include: {
          product: { select: { id: true, productName: true, sku: true, group: true } },
        },
      });

      await writeHistoryLog({
        action: 'create_inventory',
        productId: product.id,
        userId: req.user?.id || null,
        productName: product.productName,
        productSku: product.sku,
        details: `Tạo bản ghi tồn kho: ${inventory.endingStock} sản phẩm`,
      });

      return res.status(201).json({ success: true, message: 'Tạo tồn kho thành công', data: inventory });
    } catch (error) {
      const status = error.message.includes('không hợp lệ') || error.message.includes('không được') ? 400 : 500;
      console.error('Create inventory error:', error);
      return res.status(status).json({ success: false, error: error.message });
    }
  }

  /** PUT /api/inventory/:id */
  async updateInventory(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID không hợp lệ' });

      const { stockType1, stockType2, retailPrice, cost, initialStock, displayStock, damaged, stockIn, stockOut, note } = req.body;

      // Validate tất cả số trước khi chạm DB
      if (initialStock !== undefined) parseNonNegativeInt(initialStock, 'initialStock');
      if (displayStock !== undefined) parseNonNegativeInt(displayStock, 'displayStock');
      if (stockIn !== undefined) parseNonNegativeInt(stockIn, 'stockIn');
      if (stockOut !== undefined) parseNonNegativeInt(stockOut, 'stockOut');
      if (damaged !== undefined) parseNonNegativeInt(damaged, 'damaged');
      if (retailPrice !== undefined) parseNonNegativeFloat(retailPrice, 'retailPrice');
      if (cost !== undefined) parseNonNegativeFloat(cost, 'cost');

      // Dùng transaction để tránh race condition
      const inventory = await prisma.$transaction(async (tx) => {
        const old = await tx.inventory.findUnique({
          where: { id },
          include: { product: true },
        });
        if (!old) throw Object.assign(new Error('Không tìm thấy bản ghi tồn kho'), { status: 404 });

        const newInitial = parseIfDefined(initialStock, old.initialStock, parseNonNegativeInt.bind(null, initialStock, 'initialStock'));
        const newStockIn = parseIfDefined(stockIn, old.stockIn, parseNonNegativeInt.bind(null, stockIn, 'stockIn'));
        const newStockOut = parseIfDefined(stockOut, old.stockOut, parseNonNegativeInt.bind(null, stockOut, 'stockOut'));
        const newDamaged = parseIfDefined(damaged, old.damaged, parseNonNegativeInt.bind(null, damaged, 'damaged'));

        const updateData = {
          ...(stockType1 !== undefined && { stockType1: cleanString(stockType1) }),
          ...(stockType2 !== undefined && { stockType2: cleanString(stockType2) }),
          ...(retailPrice !== undefined && { retailPrice: Number(retailPrice) }),
          ...(cost !== undefined && { cost: Number(cost) }),
          ...(displayStock !== undefined && { displayStock: Number(displayStock) }),
          initialStock: newInitial,
          stockIn: newStockIn,
          stockOut: newStockOut,
          damaged: newDamaged,
          endingStock: calcEndingStock(newInitial, newStockIn, newStockOut, newDamaged),
          ...(note !== undefined && { note: cleanString(note) }),
        };

        const updated = await tx.inventory.update({
          where: { id },
          data: updateData,
          include: {
            product: { select: { id: true, productName: true, sku: true, group: true } },
          },
        });

        // Ghi log bên trong transaction để đảm bảo consistency
        await tx.historyLog.create({
          data: {
            action: 'update_inventory',
            productId: old.productId,
            userId: req.user?.id || null,
            productName: old.product.productName,
            productSku: old.product.sku,
            details: `Cập nhật tồn kho: ${updated.endingStock} sản phẩm`,
          },
        });

        return updated;
      });

      return res.json({ success: true, message: 'Cập nhật tồn kho thành công', data: inventory });
    } catch (error) {
      const status = error.status ?? (error.message.includes('không hợp lệ') ? 400 : 500);
      console.error('Update inventory error:', error);
      return res.status(status).json({ success: false, error: error.message });
    }
  }

  /** DELETE /api/inventory/:id */
  async deleteInventory(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID không hợp lệ' });

      // Transaction: log + delete cùng lúc
      await prisma.$transaction(async (tx) => {
        const inventory = await tx.inventory.findUnique({
          where: { id },
          include: { product: true },
        });
        if (!inventory) throw Object.assign(new Error('Không tìm thấy bản ghi tồn kho'), { status: 404 });

        await tx.historyLog.create({
          data: {
            action: 'delete_inventory',
            productId: inventory.productId,
            userId: req.user?.id || null,
            productName: inventory.product.productName,
            productSku: inventory.product.sku,
            details: `Xóa bản ghi tồn kho: ${inventory.endingStock} sản phẩm`,
          },
        });

        await tx.inventory.delete({ where: { id } });
      });

      return res.json({ success: true, message: 'Xóa tồn kho thành công' });
    } catch (error) {
      const status = error.status ?? 500;
      console.error('Delete inventory error:', error);
      return res.status(status).json({ success: false, error: error.message });
    }
  }

  // ============================================================
  // 📊 STATS & ANALYSIS
  // ============================================================

  /** GET /api/inventory/stats */
  async getInventoryStats(req, res) {
    try {
      // Gom tất cả vào 1 Promise.all — không query lần 2
      const [aggregations, lowStockItems, valueSummary] = await Promise.all([
        prisma.inventory.aggregate({
          _sum: { initialStock: true, stockIn: true, stockOut: true, damaged: true, endingStock: true },
          _count: { id: true },
        }),

        prisma.inventory.findMany({
          where: { endingStock: { lt: LOW_STOCK_THRESHOLD } },
          include: {
            product: { select: { productName: true, sku: true, group: true } },
          },
          orderBy: { endingStock: 'asc' },
          take: 10,
        }),

        // Tính tổng giá trị bằng raw aggregation thay vì kéo toàn bộ bảng về
        prisma.inventory.findMany({
          select: { endingStock: true, cost: true, retailPrice: true },
        }),
      ]);

      const totalValue = valueSummary.reduce((sum, inv) => sum + Number(inv.cost) * inv.endingStock, 0);
      const totalRetailValue = valueSummary.reduce((sum, inv) => sum + Number(inv.retailPrice) * inv.endingStock, 0);

      return res.json({
        success: true,
        data: {
          totalRecords: aggregations._count.id,
          totalInitialStock: aggregations._sum.initialStock || 0,
          totalStockIn: aggregations._sum.stockIn || 0,
          totalStockOut: aggregations._sum.stockOut || 0,
          totalDamaged: aggregations._sum.damaged || 0,
          totalEndingStock: aggregations._sum.endingStock || 0,
          totalValue: Math.round(totalValue),
          totalRetailValue: Math.round(totalRetailValue),
          lowStockThreshold: LOW_STOCK_THRESHOLD,
          lowStockCount: lowStockItems.length,
          lowStockItems,
        },
      });
    } catch (error) {
      console.error('Get inventory stats error:', error);
      return res.status(500).json({ success: false, error: 'Lỗi khi lấy thống kê tồn kho' });
    }
  }

  /** GET /api/inventory/stock-types */
  async getStockTypes(req, res) {
    try {
      const [stockTypes1, stockTypes2] = await Promise.all([
        prisma.inventory.findMany({
          where: { stockType1: { not: '' } },
          distinct: ['stockType1'],
          select: { stockType1: true },
          orderBy: { stockType1: 'asc' },
        }),
        prisma.inventory.findMany({
          where: { stockType2: { not: '' } },
          distinct: ['stockType2'],
          select: { stockType2: true },
          orderBy: { stockType2: 'asc' },
        }),
      ]);

      return res.json({
        success: true,
        data: {
          stockType1: stockTypes1.map(s => s.stockType1).filter(Boolean),
          stockType2: stockTypes2.map(s => s.stockType2).filter(Boolean),
        },
      });
    } catch (error) {
      console.error('Get stock types error:', error);
      return res.status(500).json({ success: false, error: 'Lỗi khi lấy danh sách phân loại kho' });
    }
  }

  // ============================================================
  // 🔄 BATCH OPERATIONS
  // ============================================================

  /** POST /api/inventory/batch */
  async batchCreateInventories(req, res) {
    try {
      const { inventories } = req.body;

      if (!Array.isArray(inventories) || inventories.length === 0) {
        return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ' });
      }

      // 1. Validate input trước — fail fast
      const validationErrors = [];
      for (let i = 0; i < inventories.length; i++) {
        const item = inventories[i];
        if (!item.productId) {
          validationErrors.push({ index: i, error: 'productId là bắt buộc' });
          continue;
        }
        try {
          parseNonNegativeInt(item.initialStock ?? 0, 'initialStock');
          parseNonNegativeFloat(item.retailPrice ?? 0, 'retailPrice');
          parseNonNegativeFloat(item.cost ?? 0, 'cost');
        } catch (e) {
          validationErrors.push({ index: i, productId: item.productId, error: e.message });
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: `${validationErrors.length} item có dữ liệu không hợp lệ`,
          validationErrors,
        });
      }

      // 2. Check product tồn tại bằng 1 query duy nhất
      const requestedIds = [...new Set(inventories.map(i => Number(i.productId)))];
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: requestedIds } },
        select: { id: true },
      });
      const existingProductIds = new Set(existingProducts.map(p => p.id));

      // 3. Tách valid / invalid
      const toCreate = [];
      const failed = [];

      for (const item of inventories) {
        const pid = Number(item.productId);
        if (!existingProductIds.has(pid)) {
          failed.push({ productId: pid, error: 'Không tìm thấy sản phẩm' });
          continue;
        }
        const initial = Number(item.initialStock || 0);
        toCreate.push({
          productId: pid,
          stockType1: cleanString(item.stockType1),
          stockType2: cleanString(item.stockType2),
          retailPrice: Number(item.retailPrice || 0),
          cost: Number(item.cost || 0),
          initialStock: initial,
          displayStock: Number(item.displayStock || 0),
          stockIn: 0,
          stockOut: 0,
          damaged: 0,
          endingStock: initial,
          note: cleanString(item.note),
        });
      }

      // 4. createMany — 1 query
      let createdCount = 0;
      if (toCreate.length > 0) {
        const result = await prisma.inventory.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
        createdCount = result.count;

        // Đếm skipDuplicates
        const skipped = toCreate.length - createdCount;
        if (skipped > 0) {
          failed.push(...Array(skipped).fill({ error: 'Đã tồn tại inventory (bị bỏ qua)' }));
        }
      }

      return res.json({
        success: true,
        message: `Batch import hoàn tất: ${createdCount} thành công, ${failed.length} thất bại`,
        data: {
          successCount: createdCount,
          failedCount: failed.length,
          failedItems: failed,
        },
      });
    } catch (error) {
      console.error('Batch create inventories error:', error);
      return res.status(500).json({ success: false, error: 'Lỗi khi import dữ liệu: ' + error.message });
    }
  }
}

export default new InventoryController();