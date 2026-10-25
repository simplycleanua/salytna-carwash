export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const contentType = request.headers.get('content-type') || '';
    let name, contact, price, car, items, date, time, isUrgent = 'false';
    let photos = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name');
      contact = formData.get('contact');
      price = formData.get('price');
      car = formData.get('car');
      items = formData.get('items');
      date = formData.get('date');
      time = formData.get('time');
      isUrgent = formData.get('isUrgent');
      photos = formData.getAll('photos');
    } else {
      const body = await request.json();
      name = body.name; contact = body.contact; price = body.price; 
      car = body.car; items = body.items; date = body.date; time = body.time;
      isUrgent = body.isUrgent;
    }

    const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response(JSON.stringify({ ok: false, error: 'Env vars missing' }), { status: 500 });
    }

    // Форматируем контакт, чтобы он был кликабельным в Telegram
    let contactFormatted = contact;
    if (contact.startsWith('@')) {
      contactFormatted = `<a href="https://t.me/${contact.replace('@', '')}">${contact}</a>`;
    } else if (contact.match(/^\+?\d+$/)) {
      contactFormatted = `<a href="tel:${contact}">${contact}</a>`;
    }

    const servicesText = items && items.trim() !== "" ? items : "Послуги не обрані (запис на мийку)";
    
    // Плашка для срочности
    const urgentBadge = isUrgent === 'true' ? "\n\n🔥 <b>ТЕРМІНОВА МИЙКА! (+20%)</b> 🔥\n" : "";

    const text = `🚗 <b>НОВИЙ ЗАПИС</b>${urgentBadge}
👤 Ім'я: <b>${name}</b>
📞 Контакт: ${contactFormatted}

📅 Дата: <b>${date}</b>
⏰ Час: <b>${time}</b>

🚘 Авто: <b>${car}</b>
🛒 Замовлення:
${servicesText}

💰 Орієнтовна вартість: <b>${price}</b>`;

    const urlMsg = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(urlMsg, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: CHAT_ID, 
        text: text,
        parse_mode: 'HTML' // Включаем красивый текст
      })
    });

    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo instanceof File) {
          const formData = new FormData();
          formData.append('chat_id', CHAT_ID);
          formData.append('photo', photo);
          formData.append('caption', `Фото до запису (${i + 1}/${photos.length})`);

          const urlPhoto = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
          await fetch(urlPhoto, { method: 'POST', body: formData });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
}
