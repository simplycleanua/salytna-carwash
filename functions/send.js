export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { name, contact, price, car, items, date, time } = body;

    // Берем токены из настроек Cloudflare
    const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response(JSON.stringify({ ok: false, error: 'Настройки токенов отсутствуют' }), { status: 500 });
    }

    const servicesText = items && items.trim() !== "" ? items : "Послуги не обрані (запис на стандартну мийку)";
    const priceText = price !== '0 грн' ? price : 'Уточнюється';

    const text = `🚗 НОВИЙ ЗАПИС\n\n👤 Ім'я: ${name}\n📞 Контакт: ${contact}\n\n📅 Дата: ${date}\n⏰ Час: ${time}\n\n🚘 Авто: ${car}\n🛒 Замовлення:\n${servicesText}\n\n💰 Орієнтовна вартість: ${priceText}`;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text })
    });

    const data = await response.json();
    
    return new Response(JSON.stringify({ ok: data.ok }), { 
      status: data.ok ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
}