const axios = require('axios');
const cheerio = require('cheerio');

async function debug() {
  try {
    const url = 'https://funpay.com/lots/offer?id=54564056';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'cy=rub;'
      }
    });

    const $ = cheerio.load(response.data);

    console.log('--- HTML Structure Inspection ---');

    // Check what is after "Останется оплатить"
    const paymentHeader = $('h5:contains("Останется оплатить")');
    console.log('Header "Останется оплатить" found:', paymentHeader.length > 0);
    if (paymentHeader.length > 0) {
      console.log('Parent HTML:\n', paymentHeader.parent().html());
      console.log('Next Element HTML:\n', paymentHeader.next().html());
    }

    // Check generic param-item structure again
    $('.param-item').each((i, el) => {
      const h5 = $(el).find('h5').text().trim();
      if (h5.includes('оплатить') || h5.includes('спишется') || h5.includes('Цена')) {
        console.log(`\nParam Item [${h5}]:`);
        console.log($(el).html());
      }
    });

    // Look for any large price looking numbers
    console.log('\n--- Searching for price patterns ---');
    const bodyText = $('body').text();
    // Regex for "Sum ₽" or similar
    const priceMatches = bodyText.match(/\d+[\s.,]\d+\s?[₽Р]/g);
    if (priceMatches) {
      console.log('Found price patterns in text:', priceMatches.slice(0, 10));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debug();
