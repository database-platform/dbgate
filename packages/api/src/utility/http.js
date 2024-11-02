const https = require('https');
// const fs = require('fs');

let agent;
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production_self') {
  // const cert = fs.readFileSync('/etc/ssl/certs/selfsigned.crt');
  agent = new https.Agent({
    rejectUnauthorized: false,
    // ca: cert,
  });
} else {
  agent = null;
}

module.exports = {
  agent,
};
