import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing required env var: MONGO_URI');
  process.exit(1);
}

const mongoUri = MONGO_URI;

// Inline schemas to avoid import issues
const UserSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, passwordHash: String, role: String, isActive: Boolean }, { timestamps: true });
const CategorySchema = new mongoose.Schema({ name: String, slug: { type: String, unique: true }, parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, isActive: Boolean }, { timestamps: true });
const BrandSchema = new mongoose.Schema({ name: String, slug: { type: String, unique: true }, isActive: Boolean }, { timestamps: true });
const ProductSchema = new mongoose.Schema({ name: String, slug: { type: String, unique: true }, sku: { type: String, unique: true }, mrp: Number, sellingPrice: Number, stock: Number, minStock: Number, category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }, images: [{ url: String, alt: String }], status: String, isFeatured: Boolean, isNewArrival: Boolean, isBestSeller: Boolean, description: String }, { timestamps: true });
const CouponSchema = new mongoose.Schema({ code: { type: String, unique: true }, type: String, value: Number, minOrderAmount: Number, usedCount: { type: Number, default: 0 }, perCustomerLimit: Number, isActive: Boolean, description: String }, { timestamps: true });
const BannerSchema = new mongoose.Schema({ title: String, image: String, link: String, type: String, sortOrder: Number, isActive: Boolean }, { timestamps: true });
const CmsPageSchema = new mongoose.Schema({ title: String, slug: { type: String, unique: true }, content: String, metaTitle: String, metaDescription: String, isActive: Boolean }, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);
const Brand = mongoose.model('Brand', BrandSchema);
const Product = mongoose.model('Product', ProductSchema);
const Coupon = mongoose.model('Coupon', CouponSchema);
const Banner = mongoose.model('Banner', BannerSchema);
const CmsPage = mongoose.model('CmsPage', CmsPageSchema);

async function seed() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // ── Users ──────────────────────────────────────────────
  const adminPass = await bcrypt.hash('Admin@123', 10);
  const staffPass = await bcrypt.hash('Staff@123', 10);

  await User.deleteMany({});
  const [admin] = await User.insertMany([
    { name: 'Super Admin', email: 'admin@ecom.com', passwordHash: adminPass, role: 'super_admin', isActive: true },
    { name: 'Inventory Staff', email: 'staff@ecom.com', passwordHash: staffPass, role: 'inventory_staff', isActive: true },
    { name: 'Order Manager', email: 'orders@ecom.com', passwordHash: staffPass, role: 'order_manager', isActive: true },
  ]);
  console.log('✓ Users created');

  // ── Categories ─────────────────────────────────────────
  await Category.deleteMany({});
  const [electronics, fashion, homeKitchen] = await Category.insertMany([
    { name: 'Electronics', slug: 'electronics', isActive: true },
    { name: 'Fashion', slug: 'fashion', isActive: true },
    { name: 'Home & Kitchen', slug: 'home-kitchen', isActive: true },
  ]);
  await Category.insertMany([
    { name: 'Mobile Phones', slug: 'mobile-phones', parent: electronics._id, isActive: true },
    { name: 'Laptops', slug: 'laptops', parent: electronics._id, isActive: true },
    { name: 'Headphones', slug: 'headphones', parent: electronics._id, isActive: true },
    { name: 'Men', slug: 'men', parent: fashion._id, isActive: true },
    { name: 'Women', slug: 'women', parent: fashion._id, isActive: true },
    { name: 'Kitchen Appliances', slug: 'kitchen-appliances', parent: homeKitchen._id, isActive: true },
  ]);
  console.log('✓ Categories created');

  // ── Brands ─────────────────────────────────────────────
  await Brand.deleteMany({});
  const [samsung, apple, nike, sony] = await Brand.insertMany([
    { name: 'Samsung', slug: 'samsung', isActive: true },
    { name: 'Apple', slug: 'apple', isActive: true },
    { name: 'Nike', slug: 'nike', isActive: true },
    { name: 'Sony', slug: 'sony', isActive: true },
    { name: 'Philips', slug: 'philips', isActive: true },
  ]);
  console.log('✓ Brands created');

  // ── Products ───────────────────────────────────────────
  await Product.deleteMany({});
  await Product.insertMany([
    {
      name: 'Samsung Galaxy S24', slug: 'samsung-galaxy-s24', sku: 'SAM-S24-001',
      mrp: 79999, sellingPrice: 69999, stock: 50, minStock: 5,
      category: electronics._id, brand: samsung._id,
      images: [{ url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', alt: 'Samsung Galaxy S24' }],
      status: 'active', isFeatured: true, isNewArrival: true,
      description: 'Latest Samsung flagship with AI features and stunning display.',
    },
    {
      name: 'Apple iPhone 15', slug: 'apple-iphone-15', sku: 'APL-IP15-001',
      mrp: 89999, sellingPrice: 84999, stock: 30, minStock: 5,
      category: electronics._id, brand: apple._id,
      images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', alt: 'iPhone 15' }],
      status: 'active', isFeatured: true, isBestSeller: true,
      description: 'iPhone 15 with Dynamic Island and 48MP camera.',
    },
    {
      name: 'Sony WH-1000XM5 Headphones', slug: 'sony-wh-1000xm5', sku: 'SNY-WH5-001',
      mrp: 34990, sellingPrice: 26990, stock: 80, minStock: 10,
      category: electronics._id, brand: sony._id,
      images: [{ url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400', alt: 'Sony Headphones' }],
      status: 'active', isBestSeller: true,
      description: 'Industry-leading noise cancellation with 30hr battery life.',
    },
    {
      name: 'Nike Air Max 270', slug: 'nike-air-max-270', sku: 'NKE-AM270-001',
      mrp: 12995, sellingPrice: 9999, stock: 100, minStock: 10,
      category: fashion._id, brand: nike._id,
      images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', alt: 'Nike Air Max' }],
      status: 'active', isFeatured: true, isTrending: true,
      description: 'Iconic Air Max cushioning for all-day comfort.',
    },
    {
      name: 'Samsung 55" 4K Smart TV', slug: 'samsung-55-4k-tv', sku: 'SAM-TV55-001',
      mrp: 59999, sellingPrice: 44999, stock: 20, minStock: 3,
      category: electronics._id, brand: samsung._id,
      images: [{ url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400', alt: 'Samsung TV' }],
      status: 'active', isBestSeller: true,
      description: 'Crystal clear 4K display with smart features and Alexa built-in.',
    },
    {
      name: 'Apple MacBook Air M2', slug: 'apple-macbook-air-m2', sku: 'APL-MBA-M2-001',
      mrp: 114900, sellingPrice: 109900, stock: 15, minStock: 3,
      category: electronics._id, brand: apple._id,
      images: [{ url: 'https://images.unsplash.com/photo-1611186871525-9c4f9b855c3e?w=400', alt: 'MacBook Air M2' }],
      status: 'active', isFeatured: true, isNewArrival: true,
      description: 'Supercharged by M2 chip. Incredibly thin and light.',
    },
    {
      name: 'Philips Air Fryer HD9200', slug: 'philips-air-fryer-hd9200', sku: 'PHL-AF-001',
      mrp: 8999, sellingPrice: 6499, stock: 60, minStock: 8,
      category: homeKitchen._id,
      images: [{ url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400', alt: 'Air Fryer' }],
      status: 'active', isTrending: true,
      description: 'Fry, bake, grill and roast with up to 90% less fat.',
    },
    {
      name: 'Nike Dri-FIT T-Shirt', slug: 'nike-dri-fit-tshirt', sku: 'NKE-DFT-001',
      mrp: 2495, sellingPrice: 1799, stock: 200, minStock: 20,
      category: fashion._id, brand: nike._id,
      images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', alt: 'Nike T-Shirt' }],
      status: 'active', isNewArrival: true,
      description: 'Sweat-wicking fabric keeps you dry and comfortable.',
    },
  ]);
  console.log('✓ Products created');

  // ── Coupons ────────────────────────────────────────────
  await Coupon.deleteMany({});
  await Coupon.insertMany([
    { code: 'WELCOME10', type: 'percentage', value: 10, minOrderAmount: 500, maxDiscount: 500, perCustomerLimit: 1, usedCount: 0, isActive: true, description: '10% off on your first order' },
    { code: 'FLAT200', type: 'flat', value: 200, minOrderAmount: 1000, perCustomerLimit: 2, usedCount: 0, isActive: true, description: '₹200 off on orders above ₹1000' },
    { code: 'FREESHIP', type: 'free_shipping', value: 0, minOrderAmount: 0, perCustomerLimit: 3, usedCount: 0, isActive: true, description: 'Free shipping on any order' },
  ]);
  console.log('✓ Coupons created');

  // ── Banners ────────────────────────────────────────────
  await Banner.deleteMany({});
  await Banner.insertMany([
    { title: 'New Arrivals — Up to 30% Off', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200', link: '/products', type: 'slider', sortOrder: 1, isActive: true },
    { title: 'Electronics Sale', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200', link: '/products?category=electronics', type: 'slider', sortOrder: 2, isActive: true },
    { title: 'Fashion Week Deals', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200', link: '/products?category=fashion', type: 'offer', sortOrder: 1, isActive: true },
  ]);
  console.log('✓ Banners created');

  // ── CMS Pages ──────────────────────────────────────────
  await CmsPage.deleteMany({});
  await CmsPage.insertMany([
    { title: 'About Us', slug: 'about', content: '<h2>About Ecom Store</h2><p>We are a leading e-commerce platform offering the best products at unbeatable prices. Founded in 2024, we serve thousands of happy customers across India.</p><p>Our mission is to make quality products accessible to everyone.</p>', metaTitle: 'About Us | Ecom Store', metaDescription: 'Learn about Ecom Store and our mission.', isActive: true },
    { title: 'Contact Us', slug: 'contact', content: '<h2>Contact Us</h2><p>We\'d love to hear from you!</p><p><strong>Email:</strong> support@ecom.com</p><p><strong>Phone:</strong> +91 98765 43210</p><p><strong>Hours:</strong> Mon–Sat, 9am–6pm IST</p>', metaTitle: 'Contact Us | Ecom Store', metaDescription: 'Get in touch with Ecom Store support.', isActive: true },
    { title: 'Privacy Policy', slug: 'privacy', content: '<h2>Privacy Policy</h2><p>Your privacy is important to us. We collect only the information necessary to process your orders and improve your experience.</p><p>We never sell your personal data to third parties.</p>', metaTitle: 'Privacy Policy | Ecom Store', isActive: true },
    { title: 'Terms & Conditions', slug: 'terms', content: '<h2>Terms & Conditions</h2><p>By using our website, you agree to these terms. All purchases are subject to product availability. Prices may change without notice.</p>', metaTitle: 'Terms & Conditions | Ecom Store', isActive: true },
    { title: 'Refund Policy', slug: 'refund', content: '<h2>Refund Policy</h2><p>We offer a 7-day return policy on most items. Products must be unused and in original packaging. Refunds are processed within 5–7 business days.</p>', metaTitle: 'Refund Policy | Ecom Store', isActive: true },
    { title: 'Shipping Policy', slug: 'shipping', content: '<h2>Shipping Policy</h2><p>We offer free shipping on orders above ₹500. Standard delivery takes 3–5 business days. Express delivery available at checkout.</p>', metaTitle: 'Shipping Policy | Ecom Store', isActive: true },
    { title: 'FAQ', slug: 'faq', content: '<h2>Frequently Asked Questions</h2><h3>How do I track my order?</h3><p>Go to My Orders in your account to track your order status.</p><h3>Can I cancel my order?</h3><p>Yes, orders can be cancelled before they are shipped.</p><h3>What payment methods do you accept?</h3><p>We accept UPI, cards, net banking, and cash on delivery.</p>', metaTitle: 'FAQ | Ecom Store', isActive: true },
  ]);
  console.log('✓ CMS Pages created');

  console.log('\n✅ Seed complete!\n');
  console.log('Admin credentials:');
  console.log('  Email:    admin@ecom.com');
  console.log('  Password: Admin@123\n');
  console.log('Staff credentials:');
  console.log('  Email:    staff@ecom.com');
  console.log('  Password: Staff@123\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
