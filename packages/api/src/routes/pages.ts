import { Router, Request, Response } from 'express';
import { CmsPage } from '../models/cmsPage';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const pages = await CmsPage.find({ isActive: true }, 'title slug metaTitle metaDescription');
  return res.json(pages);
});

router.get('/:slug', async (req: Request, res: Response) => {
  const page = await CmsPage.findOne({ slug: req.params.slug, isActive: true });
  if (!page) return res.status(404).json({ error: 'Page not found' });
  return res.json(page);
});

router.post('/', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const page = await CmsPage.create(req.body);
    return res.status(201).json(page);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  const page = await CmsPage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!page) return res.status(404).json({ error: 'Not found' });
  return res.json(page);
});

router.delete('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  await CmsPage.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

export default router;
