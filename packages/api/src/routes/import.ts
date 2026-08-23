import { Router, Response } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { Product } from '../models/product';
import { Category } from '../models/category';
import { Brand } from '../models/brand';
import { Media } from '../models/media';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } });

function toSlug(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
}

function parseBool(val: string): boolean {
  return ['true', '1', 'yes', 'y'].includes(val.toLowerCase().trim());
}

router.post('/products', requireAuth, requireRole('super_admin', 'inventory_staff'), upload.single('file'), async (req: AuthedRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const workbook = new ExcelJS.Workbook();
  const buf = Buffer.from(req.file.buffer);
  await workbook.xlsx.load(buf as any);
  const sheet = workbook.worksheets[0];

  const results: { row: number; status: string; sku?: string; error?: string }[] = [];
  const missingImages: { row: number; sku: string; filename: string }[] = [];

  // Build category and brand lookup maps
  const cats = await Category.find({}, 'name _id parent');
  const brands = await Brand.find({}, 'name _id');
  const catMap = new Map(cats.map(c => [c.name.toLowerCase().trim(), c]));
  const brandMap = new Map(brands.map(b => [b.name.toLowerCase().trim(), b]));

  // Helper: get or create category
  async function resolveCategory(name: string, parentId?: string): Promise<string | undefined> {
    if (!name) return undefined;
    const key = name.toLowerCase().trim();
    const existing = catMap.get(key);
    if (existing) return existing._id.toString();
    // Auto-create
    const newCat = await Category.create({
      name: name.trim(),
      slug: toSlug(name),
      ...(parentId ? { parent: parentId } : {}),
    });
    catMap.set(key, newCat);
    return newCat._id.toString();
  }

  // Helper: get or create brand
  async function resolveBrand(name: string): Promise<string | undefined> {
    if (!name) return undefined;
    const key = name.toLowerCase().trim();
    const existing = brandMap.get(key);
    if (existing) return existing._id.toString();
    // Auto-create
    const newBrand = await Brand.create({ name: name.trim(), slug: toSlug(name) });
    brandMap.set(key, newBrand);
    return newBrand._id.toString();
  }

  // Helper: resolve pipe-separated image filenames to URLs
  async function resolveImages(imagesStr: string, row: number, sku: string): Promise<{ url: string }[]> {
    if (!imagesStr) return [];
    const filenames = imagesStr.split('|').map(f => f.trim()).filter(Boolean);
    const resolved: { url: string }[] = [];

    for (const filename of filenames) {
      // If it's already a URL, use directly
      if (filename.startsWith('http://') || filename.startsWith('https://')) {
        resolved.push({ url: filename });
        continue;
      }
      // Look up in Media collection by originalName
      const media = await Media.findOne({ originalName: filename });
      if (media) {
        resolved.push({ url: media.url });
      } else {
        // Not found — add to missing report, don't block product creation
        missingImages.push({ row, sku, filename });
      }
    }
    return resolved;
  }

  // Parse headers
  const headers: string[] = [];
  sheet.getRow(1).eachCell(cell => headers.push(String(cell.value || '').toLowerCase().trim()));

  const rows = sheet.rowCount;
  for (let i = 2; i <= rows; i++) {
    const row = sheet.getRow(i);
    const get = (col: string) => {
      const idx = headers.indexOf(col);
      if (idx === -1) return '';
      const val = row.getCell(idx + 1).value;
      return val != null ? String(val).trim() : '';
    };
    // Support alternative column names
    const getAlt = (...cols: string[]) => {
      for (const col of cols) {
        const v = get(col);
        if (v) return v;
      }
      return '';
    };

    const sku = getAlt('sku');
    if (!sku) { results.push({ row: i, status: 'skipped', error: 'No SKU' }); continue; }

    const name = getAlt('product name', 'name');
    if (!name) { results.push({ row: i, status: 'skipped', sku, error: 'No product name' }); continue; }

    const mrp = parseFloat(getAlt('mrp')) || 0;
    const sellingPrice = parseFloat(getAlt('selling price', 'price')) || mrp;
    const costPrice = parseFloat(getAlt('cost price')) || undefined;
    const gst = parseFloat(getAlt('gst')) || 0;
    const stock = parseInt(getAlt('stock')) || 0;
    const minStock = parseInt(getAlt('min stock', 'minstock')) || 0;
    const description = getAlt('description');
    const shortDescription = getAlt('short description', 'shortdescription');
    const weight = parseFloat(getAlt('weight')) || undefined;
    const warranty = getAlt('warranty');
    const returnPolicy = getAlt('return policy', 'returnpolicy');
    const barcode = getAlt('barcode');
    const tagsStr = getAlt('tags');
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const status = getAlt('status') || 'active';
    const isFeatured = parseBool(getAlt('featured'));
    const isNewArrival = parseBool(getAlt('new arrival', 'newarrival'));
    const isBestSeller = parseBool(getAlt('best seller', 'bestseller'));
    const isTrending = parseBool(getAlt('trending'));
    const metaTitle = getAlt('meta title', 'metatitle');
    const metaDescription = getAlt('meta description', 'metadescription');

    // Resolve category, sub-category, brand
    const categoryName = getAlt('category');
    const subCategoryName = getAlt('sub category', 'subcategory');
    const brandName = getAlt('brand');

    let categoryId: string | undefined;
    let subCategoryId: string | undefined;
    let brandId: string | undefined;

    try {
      categoryId = await resolveCategory(categoryName);
      if (subCategoryName && categoryId) {
        subCategoryId = await resolveCategory(subCategoryName, categoryId);
      }
      brandId = await resolveBrand(brandName);
    } catch {}

    // Resolve images — support both pipe-separated single column and Image1..Image20 columns
    let images: { url: string }[] = [];
    const imagesCol = getAlt('images');
    if (imagesCol) {
      images = await resolveImages(imagesCol, i, sku);
    } else {
      // Fallback: check image1..image20 columns (backward compat)
      for (let n = 1; n <= 20; n++) {
        const url = get(`image${n}`);
        if (url) {
          if (url.startsWith('http')) {
            images.push({ url });
          } else {
            // Treat as filename lookup
            const media = await Media.findOne({ originalName: url });
            if (media) {
              images.push({ url: media.url });
            } else {
              missingImages.push({ row: i, sku, filename: url });
            }
          }
        }
      }
    }

    try {
      const productData: any = {
        name, mrp, sellingPrice, stock, description, shortDescription,
        weight, warranty, returnPolicy, barcode, tags, gst, minStock,
        status, isFeatured, isNewArrival, isBestSeller, isTrending,
        metaTitle, metaDescription,
        ...(categoryId && { category: categoryId }),
        ...(subCategoryId && { subCategory: subCategoryId }),
        ...(brandId && { brand: brandId }),
        ...(images.length && { images }),
      };

      // Remove undefined values
      Object.keys(productData).forEach(k => productData[k] === undefined && delete productData[k]);

      const existing = await Product.findOne({ sku });
      if (existing) {
        await Product.findByIdAndUpdate(existing._id, productData);
        results.push({ row: i, status: 'updated', sku });
      } else {
        await Product.create({ ...productData, sku, slug: toSlug(name || sku) });
        results.push({ row: i, status: 'created', sku });
      }
    } catch (err: any) {
      results.push({ row: i, status: 'error', sku, error: err.message });
    }
  }

  const created = results.filter(r => r.status === 'created').length;
  const updated = results.filter(r => r.status === 'updated').length;
  const errors = results.filter(r => r.status === 'error').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  return res.json({
    summary: { total: rows - 1, created, updated, errors, skipped },
    results,
    missingImages,
  });
});

export default router;
