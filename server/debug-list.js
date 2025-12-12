const axios = require('axios');
const cheerio = require('cheerio');

async function debugList() {
  try {
    const url = 'https://funpay.com/lots/612/';
    console.log(`Fetching list page ${url}...`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'cy=rub;'
      }
    });

    const $ = cheerio.load(response.data);
    const items = $('.tc-item[data-f-type="продажа"]');
    console.log(`Found ${items.length} items`);

    if (items.length > 0) {
      const first = items.first();
      const price = first.find('.tc-price').text().trim();
      console.log('First item price text:', price);

      // Check data attributes
      console.log('Data attrs:', first.attr());
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugList();
