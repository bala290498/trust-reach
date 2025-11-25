const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// List of all brand filenames (without .md extension)
const brands = [
  'adventure-travel',
  'ai-solutions-inc',
  'city-center-hotel',
  'city-medical-center',
  'coastal-bistro',
  'digital-solutions',
  'elite-dental-care',
  'european-explorer-tours',
  'gourmet-kitchen',
  'grand-hotel',
  'healthcare-plus',
  'medcare-clinic',
  'next-gen-electronics',
  'ocean-breeze-cruises',
  'paradise-resorts',
  'smart-devices-co'
];

// Create a simple PNG placeholder for each brand
const brandsDir = path.join(__dirname, '..', 'public', 'images', 'brands');

// Ensure directory exists
if (!fs.existsSync(brandsDir)) {
  fs.mkdirSync(brandsDir, { recursive: true });
}

// Generate a simple colored square PNG (200x200) for each brand
async function generatePlaceholders() {
  for (const brandName of brands) {
    // Create a simple colored square with text
    const displayName = brandName
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    // Create SVG content
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#E5E7EB"/>
  <text x="100" y="100" font-family="Arial, sans-serif" font-size="14" fill="#6B7280" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${displayName}</text>
</svg>`;
    
    // Convert SVG to PNG using sharp
    const pngPath = path.join(brandsDir, `${brandName}.png`);
    
    try {
      await sharp(Buffer.from(svg))
        .resize(200, 200, {
          fit: 'contain',
          background: { r: 229, g: 231, b: 235 } // #E5E7EB
        })
        .png()
        .toFile(pngPath);
      
      console.log(`Created placeholder: ${brandName}.png`);
    } catch (error) {
      console.error(`Error creating ${brandName}.png:`, error);
    }
  }
  
  console.log(`\nGenerated ${brands.length} placeholder logo PNG files in ${brandsDir}`);
  console.log('Note: Replace these placeholder images with actual brand logos when available.');
}

generatePlaceholders().catch(console.error);

