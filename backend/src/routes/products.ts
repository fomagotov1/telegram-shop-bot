import { Router } from 'express';
import { productController } from '../controllers/products';
import multer from 'multer';
import path from 'path';

const router = Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, ext);
  },
});

function conditionalUpload(req: any, res: any, next: any) {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('image')(req, res, next);
  } else {
    next();
  }
}

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', conditionalUpload, productController.create);
router.put('/:id', conditionalUpload, productController.update);
router.delete('/:id', productController.delete);

export { router as productRouter };
