import { Router, Response } from 'express';
import { CustomerAddress } from '../models/address';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  const addresses = await CustomerAddress.find({ customer: req.user!.sub }).sort({ isDefault: -1 });
  return res.json(addresses);
});

router.post('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { isDefault, ...rest } = req.body;
    if (isDefault) await CustomerAddress.updateMany({ customer: req.user!.sub }, { isDefault: false });
    const address = await CustomerAddress.create({ ...rest, customer: req.user!.sub, isDefault: isDefault || false });
    return res.status(201).json(address);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { isDefault, ...rest } = req.body;
  if (isDefault) await CustomerAddress.updateMany({ customer: req.user!.sub }, { isDefault: false });
  const address = await CustomerAddress.findOneAndUpdate({ _id: req.params.id, customer: req.user!.sub }, { ...rest, isDefault: isDefault || false }, { new: true });
  if (!address) return res.status(404).json({ error: 'Not found' });
  return res.json(address);
});

router.delete('/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  await CustomerAddress.findOneAndDelete({ _id: req.params.id, customer: req.user!.sub });
  return res.json({ success: true });
});

export default router;
