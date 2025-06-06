require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { body, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const Component = require('./models/Component');

const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const connectWithRetry = () => {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      setTimeout(connectWithRetry, 5000);
    });
};
connectWithRetry();

app.get('/', (req, res) => {
  console.log("🌐 Root route hit: backend is live");
  res.send('✅ TechHaven backend is running');
});

app.get('/api/components', [
  query('category').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { category, page, limit } = req.query;
  const filter = category ? { category } : {};

  try {
    console.log("📦 Fetching components with filter:", filter);

    let components;
    let total;

    if (page && limit) {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      components = await Component.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);
      total = await Component.countDocuments(filter);
    } else {
      components = await Component.find(filter).sort({ createdAt: -1 });
      total = components.length;
    }

    res.status(200).json({ success: true, page: Number(page), limit: Number(limit), total, components });
  } catch (error) {
    console.error("❌ Failed to fetch components:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/components/:id', async (req, res) => {
  try {
    const component = await Component.findById(req.params.id);
    if (!component)
      return res.status(404).json({ success: false, message: 'Component not found' });
    res.status(200).json({ success: true, component });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/components', [
  body('name').isString().notEmpty(),
  body('category').isString().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('specs').optional().isObject(),
  body('brand').optional().isString(),
  body('imageUrl').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const component = new Component(req.body);
    const saved = await component.save();
    res.status(201).json({ success: true, component: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/components/:id', [
  body('name').optional().isString().notEmpty(),
  body('category').optional().isString().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('specs').optional().isObject(),
  body('brand').optional().isString(),
  body('imageUrl').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const updated = await Component.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated)
      return res.status(404).json({ success: false, message: 'Component not found' });
    res.status(200).json({ success: true, component: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/components/:id', async (req, res) => {
  try {
    const deleted = await Component.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: 'Component not found' });
    res.status(200).json({ success: true, message: 'Component deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const welcomeEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'Too many welcome email requests from this IP, try again later.' },
});

app.post('/send-welcome', welcomeEmailLimiter, [
  body('email').isEmail(),
  body('name').isString().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { email, name } = req.body;
  const mailOptions = {
    from: `"TechHaven" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Welcome to TechHaven!',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${name},</h2>
        <p>Thanks for signing up with <strong>TechHaven</strong>!</p>
        <p>Your account has been successfully created.</p>
        <br/>
        <p style="font-style: italic;">— The TechHaven Team</p>
      </div>
    `,
  };

  setTimeout(async () => {
    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent to', email);
    } catch (err) {
      console.error('❌ Email send failed:', err);
    }
  }, 40000);

  res.status(200).json({ success: true, message: '✅ Welcome email scheduled in 40 seconds.' });
});

app.use('/api/orders', orderRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
