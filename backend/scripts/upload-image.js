const fs = require('fs');
const path = require('path');
const https = require('https');

const UPLOAD_BASE = 'https://backend-production-e853.up.railway.app';
const imagePath = path.join(__dirname, '..', '..', '..', '05c721269ec50303a652364eac0c6e30.webp');
const imageBuffer = fs.readFileSync(imagePath);

const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

const bodyParts = [];

function addField(name, value) {
  bodyParts.push(Buffer.from(`--${boundary}\r\n`));
  bodyParts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n`));
  bodyParts.push(Buffer.from(`${value}\r\n`));
}

function addFile(name, filename, buffer, contentType) {
  bodyParts.push(Buffer.from(`--${boundary}\r\n`));
  bodyParts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`));
  bodyParts.push(Buffer.from(`Content-Type: ${contentType}\r\n\r\n`));
  bodyParts.push(buffer);
  bodyParts.push(Buffer.from('\r\n'));
}

addField('name', 'Красная Машинка');
addField('description', 'Машинка');
addField('price', '16.5');
addField('category', 'Авто');
addFile('image', 'car.webp', imageBuffer, 'image/webp');

bodyParts.push(Buffer.from(`--${boundary}--\r\n`));

const body = Buffer.concat(bodyParts);

const options = {
  hostname: 'backend-production-e853.up.railway.app',
  path: '/api/products',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    // Update image URL to use backend
    const parsed = JSON.parse(data);
    if (parsed.image_url && parsed.image_url.includes('netlify')) {
      const filename = parsed.image_url.split('/').pop();
      const correctUrl = `${UPLOAD_BASE}/uploads/${filename}`;
      console.log('\nCorrect image URL:', correctUrl);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(body);
req.end();
