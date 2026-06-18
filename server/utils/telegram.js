import https from 'https';

/**
 * Sends a telegram notification to all configured owners
 * @param {string} message - HTML formatted message to send
 */
export const sendTelegramNotification = (message) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const ownersStr = process.env.TELEGRAM_OWNERS;

  if (!token || !ownersStr) {
    console.log('⚠️ Telegram bot config missing. Notification skipped.');
    return;
  }

  const owners = ownersStr
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  if (owners.length === 0) {
    console.log('⚠️ No Telegram owners configured.');
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  owners.forEach((chatId) => {
    const payload = JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`📡 Telegram notification sent to owner: ${chatId}`);
        } else {
          console.error(`❌ Failed to send Telegram message to ${chatId}: ${data}`);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Error calling Telegram Bot API for ${chatId}:`, err);
    });

    req.write(payload);
    req.end();
  });
};
