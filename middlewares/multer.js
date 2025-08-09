import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'food-delivery/uploads', // Folder in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        public_id: (req, file) => {
            // Generate unique filename (similar to your UUID approach)
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 15);
            return `food-${timestamp}-${random}`;
        },
        // Optional: Add image transformations
        transformation: [
            {
                width: 800,
                height: 800,
                crop: 'limit',
                quality: 'auto'
            }
        ]
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

export default upload;