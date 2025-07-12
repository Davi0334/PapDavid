const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-shortcut-create.png', size: 96 },
    { name: 'icon-shortcut-list.png', size: 96 }
];

async function generateIcons() {
    const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/base-icon.svg'));
    
    for (const { name, size } of sizes) {
        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(path.join(__dirname, '../public/', name));
        
        console.log(`Generated ${name}`);
    }
}

generateIcons().catch(console.error); 