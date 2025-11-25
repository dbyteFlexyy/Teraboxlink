const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Only GET method allowed' 
    });
  }

  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL parameter is required. Usage: /api/terabox?url=TERABOX_LINK',
        example: 'https://your-domain.vercel.app/api/terabox?url=https://1024terabox.com/s/1ahJz-qdH7h_9One0lXxDoA'
      });
    }

    // Validate TeraBox URL
    if (!isValidTeraBoxUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TeraBox URL',
        valid_formats: [
          'https://1024terabox.com/s/...',
          'https://www.terabox.com/s/...',
          'https://terabox.com/s/...'
        ]
      });
    }

    const result = await fetchTeraBoxData(url);
    
    // If successful, return clean response
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
        api_version: "1.0"
      });
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

function isValidTeraBoxUrl(url) {
  const teraboxPatterns = [
    /^https:\/\/(www\.)?1024terabox\.com\/s\/[a-zA-Z0-9_-]+/,
    /^https:\/\/(www\.)?terabox\.com\/s\/[a-zA-Z0-9_-]+/,
    /^https:\/\/teraboxapp\.com\/s\/[a-zA-Z0-9_-]+/
  ];
  
  return teraboxPatterns.some(pattern => pattern.test(url));
}

async function fetchTeraBoxData(teraboxUrl) {
  try {
    console.log('🎬 Fetching nonce...');
    
    const headersEvent = {
      "accept": "*/*",
      "content-type": "text/plain",
      "origin": "https://teradownloadr.com",
      "referer": "https://teradownloadr.com/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    const dataEvent = {
      "n": "pageview",
      "u": "https://teradownloadr.com/",
      "l": ["en-GB", "en-US", "en"],
      "k": "EdmacAlcfkfDwEmll2DHPQ",
      "r": "https://www.google.com/",
      "sw": 1920,
      "sh": 1080,
      "sr": 1,
      "t": "TeraBox Downloader - Download TeraBox Video + Files (2025)"
    };

    const eventResponse = await fetch("https://teradownloadr.com/api/event", {
      method: "POST",
      headers: headersEvent,
      body: JSON.stringify(dataEvent)
    });

    console.log("✅ Nonce request status:", eventResponse.status);
    
    const eventText = await eventResponse.text();
    const nonceMatch = eventText.match(/"nonce":"([a-zA-Z0-9]+)"/);
    const nonce = nonceMatch ? nonceMatch[1] : null;

    if (!nonce) {
      throw new Error('Nonce not found in response');
    }

    console.log("🔑 Nonce obtained:", nonce);

    // Step 2: Fetch TeraBox data
    const payload = `action=terabox_fetch&url=${encodeURIComponent(teraboxUrl)}&nonce=${nonce}`;
    
    const headersFinal = {
      "accept": "*/*",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "origin": "https://teradownloadr.com",
      "referer": "https://teradownloadr.com/",
      "x-requested-with": "XMLHttpRequest",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    const finalResponse = await fetch("https://teradownloadr.com/wp-admin/admin-ajax.php", {
      method: "POST",
      headers: headersFinal,
      body: payload
    });

    console.log("📡 TeraBox API status:", finalResponse.status);
    
    if (!finalResponse.ok) {
      throw new Error(`HTTP error! status: ${finalResponse.status}`);
    }

    const result = await finalResponse.json();
    
    console.log("✅ TeraBox data fetched successfully");
    
    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('❌ Error in fetchTeraBoxData:', error);
    return {
      success: false,
      error: error.message,
      details: 'Failed to fetch TeraBox data'
    };
  }
}
