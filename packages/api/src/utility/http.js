const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false, // 忽略自签名证书
});

module.exports = {
  agent,
};
