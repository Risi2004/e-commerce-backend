import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Component from './models/Component.js';

import cpuData from './data/CpuData.js';
import gpuData from './data/GpuData.js';
import ramData from './data/RamData.js';
import coolerData from './data/CoolerData.js';
import keyboardData from './data/KeyboardData.js';
import monitorData from './data/MonitorData.js';
import mouseData from './data/MouseData.js';
import laptopsData from './data/Laptops.js';
import pcCaseData from './data/PcCaseData.js';
import motherBoardData from './data/MotherBoardData.js';
import psuData from './data/PsuData.js';
import storageData from './data/StorageData.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/techhaven';

// 🔧 Category-specific spec formatters
const specFormatters = {
  CPU: (item) => ({
    Brand: item.brand,
    Cores: item.cores,
    Threads: item.threads,
    BaseClock: item.baseClock,
    BoostClock: item.boostClock,
    Socket: item.socket,
  }),
  GPU: (item) => ({
    Brand: item.brand,
    VRAM: item.vram,
    BaseClock: item.baseClock,
    BoostClock: item.boostClock,
  }),
  RAM: (item) => ({
    Brand: item.brand,
    Size: item.size,
    Type: item.type,
    Speed: item.speed,
  }),
  Cooler: (item) => ({
    Brand: item.brand,
    Type: item.type,
    Size: item.size,
  }),
  Keyboard: (item) => ({
    Brand: item.brand,
    SwitchType: item.switchType,
    Layout: item.layout,
  }),
  Monitor: (item) => ({
    Brand: item.brand,
    Size: item.size,
    Resolution: item.resolution,
    RefreshRate: item.refreshRate,
  }),
  Mouse: (item) => ({
    Brand: item.brand,
    DPI: item.dpi,
    SensorType: item.sensorType,
  }),
  Laptop: (item) => ({
    Brand: item.brand,
    CPU: item.cpu,
    RAM: item.ram,
    Storage: item.storage,
    GPU: item.gpu,
    Screen: item.screen,
  }),
  PcCase: (item) => ({
    Brand: item.brand,
    FormFactor: item.formFactor,
    SidePanel: item.sidePanel,
  }),
  Motherboard: (item) => ({
    Brand: item.brand,
    Chipset: item.chipset,
    Socket: item.socket,
    FormFactor: item.formFactor,
  }),
  PSU: (item) => ({
    Brand: item.brand,
    Wattage: item.wattage,
    Certification: item.certification,
    Modular: item.modular,
  }),
  Storage: (item) => ({
    Type: item.type,
    Interface: item.interface,
    Capacity: item.capacity,
  }),
};

// 🗂️ Universal data mapper
function mapCategoryData(data, category) {
  const formatter = specFormatters[category];
  return data.map((item) => ({
    name: item.name,
    category,
    brand: item.brand || 'Unknown',
    price: item.price || 0,
    image: item.image || '',
    specs: formatter(item),
  }));
}

async function importAllData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Component.deleteMany({});
    console.log('🧹 Deleted all old components');

    const allData = [
      ...mapCategoryData(cpuData, "CPU"),
      ...mapCategoryData(gpuData, "GPU"),
      ...mapCategoryData(ramData, "RAM"),
      ...mapCategoryData(coolerData, "Cooler"),
      ...mapCategoryData(keyboardData, "Keyboard"),
      ...mapCategoryData(monitorData, "Monitor"),
      ...mapCategoryData(mouseData, "Mouse"),
      ...mapCategoryData(laptopsData, "Laptop"),
      ...mapCategoryData(pcCaseData, "PcCase"),
      ...mapCategoryData(motherBoardData, "Motherboard"),
      ...mapCategoryData(psuData, "PSU"),
      ...mapCategoryData(storageData, "Storage"),
    ];

    console.log(`📦 Preparing to insert ${allData.length} items...`);
    await Component.insertMany(allData);
    console.log('🚀 Data successfully inserted into MongoDB');
    process.exit();
  } catch (err) {
    console.error('❌ Data import failed:', err);
    process.exit(1);
  }
}

importAllData();
