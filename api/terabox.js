const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Home page request
  if (req.url === '/' || !req.query.url) {
    return res.json({
      success: true,
      message: 'TeraBox API is working!',
      usage: 'Add ?url=TERABOX_LINK to get download links',
      example: 'https://teraboxlink12-f8gd.vercel.app/api/terabox?url=https://1024terabox.com/s/1ahJz-qdH7h_9One0lXxDoA'
    });
  }

  const { url } = req.query;
  
  try {
    // Step 1: Get nonce
    const eventResponse = await fetch("https://teradownloadr.com/api/event", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "content-type": "text/plain",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
      },
      body: JSON.stringify({
        "n": "pageview",
        "u": "https://teradownloadr.com/",
        "k": "EdmacAlcfkfDwEmll2DHPQ",
        "t": "TeraBox Downloader"
      })
    });

    const eventText = await eventResponse.text();
    const nonceMatch = eventText.match(/"nonce":"([a-zA-Z0-9]+)"/);
    const nonce = nonceMatch ? nonceMatch[1] : null;

    if (!nonce) {
      throw new Error('Nonce not found');
    }

    // Step 2: Fetch TeraBox data
    const payload = `action=terabox_fetch&url=${encodeURIComponent(url)}&nonce=${nonce}`;
    
    const finalResponse = await fetch("https://teradownloadr.com/wp-admin/admin-ajax.php", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
      },
      body: payload
    });

    const result = await finalResponse.json();
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
};
