import { Router, Response } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { Product } from '../models/product';
import { Category } from '../models/category';
import { Brand } from '../models/brand';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

function toSlug(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
}

router.post('/products', requireAuth, requireRole('super_admin', 'inventory_staff'), upload.single('file'), async (req: AuthedRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const workbook = new ExcelJS.Workbook();
  const buf = Buffer.from(req.file.buffer);
  await workbook.xlsx.load(buf as any);
  const sheet = workbook.worksheets[0];

  const results: { row: number; status: string; sku?: string; error?: string }[] = [];

  // Build category and brand lookup maps
  const cats = await Category.find({}, 'name _id');
  const brands = await Brand.find({}, 'name _id');
  const catMap = new Map(cats.map(c => [c.name.toLowerCase(), c._id.toString()]));
  const brandMap = new Map(brands.map(b => [b.name.toLowerCase(), b._id.toString()]));

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

    const sku = get('sku');
    if (!sku) { results.push({ row: i, status: 'skipped', error: 'No SKU' }); continue; }

    const name = get('product name') || get('name');
    const mrp = parseFloat(get('mrp')) || 0;
    const sellingPrice = parseFloat(get('price') || get('selling price')) || mrp;
    const stock = parseInt(get('stock')) || 0;
    const description = get('description');
    const weight = parseFloat(get('weight')) || undefined;
    const categoryName = get('category');
    const brandName = get('brand');

    const categoryId = categoryName ? catMap.get(categoryName.toLowerCase()) : undefined;
    const brandId = brandName ? brandMap.get(brandName.toLowerCase()) : undefined;

    // Collect image URLs from image1..image20 columns
    const images: { url: string }[] = [];
    for (let n = 1; n <= 20; n++) {
      const url = get(`image${n}`);
      if (url) images.push({ url });
    }

    try {
      const existing = await Product.findOne({ sku });
      if (existing) {
        await Product.findByIdAndUpdate(existing._id, { name, mrp, sellingPrice, stock, description, weight, ...(categoryId && { category: categoryId }), ...(brandId && { brand: brandId }), ...(images.length && { images }) });
        results.push({ row: i, status: 'updated', sku });
      } else {
        await Product.create({ name, sku, slug: toSlug(name || sku), mrp, sellingPrice, stock, description, weight, ...(categoryId && { category: categoryId }), ...(brandId && { brand: brandId }), images });
        results.push({ row: i, status: 'created', sku });
      }
    } catch (err: any) {
      results.push({ row: i, status: 'error', sku, error: err.message });
    }
  }

  const created = results.filter(r => r.status === 'created').length;
  const updated = results.filter(r => r.status === 'updated').length;
  const errors = results.filter(r => r.status === 'error').length;

  return res.json({ summary: { total: rows - 1, created, updated, errors }, results });
});

export default router;
