export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const contentType = request.headers.get('content-type') || '';
    let name, contact, price, car, items, date, time;
    let photos = [];

    // Если пришел FormData (с фото)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name');
      contact = formData.get('contact');
      price = formData.get('price');
      car = formData.get('car');
      items = formData.get('items');
      date = formData.get('date');
      time = formData.get('time');
      photos = formData.getAll('photos'); // Массив фото
    } else {
      // Резервный вариант (JSON)
      const body = await request.json();
      name = body.name; contact = body.contact; price = body.price; 
      car = body.car; items = body.items; date = body.date; time = body.time;
    }

    const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response(JSON.stringify({ ok: false, error: 'Env vars missing' }), { status: 500 });
    }

    const servicesText = items && items.trim() !== "" ? items : "Послуги не обрані";
    const text = `🚗 НОВИЙ ЗАПИС\n\n👤 Ім'я: ${name}\n📞 Контакт: ${contact}\n\n📅 Дата: ${date}\n⏰ Час: ${time}\n\n🚘 Авто: ${car}\n🛒 Замовлення:\n${servicesText}\n\n💰 Орієнтовна вартість: ${price}`;

    // 1. Отправляем текст
    const urlMsg = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(urlMsg, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text })
    });

    // 2. Отправляем фотографии (если есть)
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        // Проверяем, что это действительно файл
        if (photo instanceof File) {
          const formData = new FormData();
          formData.append('chat_id', CHAT_ID);
          formData.append('photo', photo);
          formData.append('caption', `Фото до запису (${i + 1}/${photos.length})`);

          const urlPhoto = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
          await fetch(urlPhoto, {
            method: 'POST',
            body: formData
          });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
}
