const http = require('http');
const https = require('https');

function getJson(url) {
  return new Promise((resolve, reject) => {
    const transport = new URL(url).protocol === 'https:' ? https : http;
    const request = transport.get(url, response => {
      if (response.statusCode !== 200) {
        response.resume();
        const error = new Error(`HTTP ${response.statusCode} from ${url}`);
        error.statusCode = response.statusCode;
        reject(error);
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
        if (body.length > 65536) request.destroy(new Error('JSON response too large'));
      });
      response.on('error', reject);
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    const deadline = setTimeout(() => request.destroy(new Error('JSON request timeout')), 8000);
    request.on('close', () => clearTimeout(deadline));
    request.on('error', reject);
  });
}

module.exports = { getJson };
