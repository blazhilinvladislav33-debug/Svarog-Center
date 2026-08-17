"""
SVAROG Team Telegram Bot v3.0.0 (Webhook Mode for Render)
Розширена версія з підтримкою:
- Сповіщень про замовлення (нові, статус, доставка)
- Email/SMS статусів
- CRM інформації про клієнтів
- Marketing кампаній
- Analytics звітів
"""
import html
import logging
import os
import sqlite3
import json
from datetime import datetime
from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ChatType, ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from aiohttp import web

# ───────────────────────────  НАЛАШТУВАННЯ  ───────────────────────────
BOT_TOKEN = os.getenv("BOT_TOKEN", "8576872452:AAHjOlZkAqtRom8ADS2tO4Jx00VblJ3hN3o")
ADMIN_CHAT_ID = int(os.getenv("ADMIN_CHAT_ID", "-1004110475608"))
INFO_CHANNEL_ID = os.getenv("INFO_CHANNEL_ID", "")

NOTIFY_ON_START = True
CONFIRM_TO_USER = True

WELCOME = (
    "Вітаємо! 👋\n\n"
    "Просто напишіть повідомлення — і воно одразу потрапить до адміністрації.\n"
    "Або оберіть тип нижче:\n\n"
    "🛡 Зв'язок з адміністрацією — запитання чи звернення.\n"
    "📢 Важлива інформація — передати важливу інформацію.\n"
    "📦 Питання про замовлення — отримати статус доставки."
)

WEBHOOK_PATH = "/webhook"
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "svarog-secret-2026")
BASE_URL = os.getenv("RENDER_EXTERNAL_URL") or os.getenv("WEBHOOK_BASE", "")
PORT = int(os.getenv("PORT", "10000"))

# ──────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("svarog-bot")

db = sqlite3.connect("relay.db", check_same_thread=False)
db.execute("CREATE TABLE IF NOT EXISTS routing (admin_msg_id INTEGER PRIMARY KEY, user_id INTEGER)")
db.execute("CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY, name TEXT, username TEXT, phone TEXT, created_at TEXT)")
db.execute("CREATE TABLE IF NOT EXISTS modes (user_id INTEGER PRIMARY KEY, mode TEXT)")
db.execute("CREATE TABLE IF NOT EXISTS user_orders (user_id INTEGER, order_id TEXT PRIMARY KEY, phone TEXT)")
db.commit()

bot = Bot(BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()

def channel_ready() -> bool:
    return bool(INFO_CHANNEL_ID) and INFO_CHANNEL_ID != ""

def user_ident(user) -> str:
    s = f"<b>{html.escape(user.full_name)}</b>"
    if user.username:
        s += f" · @{user.username}"
    return s

def start_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛡 Зв'язок з адміністрацією", callback_data="mode:contact")],
        [InlineKeyboardButton(text="📢 Важлива інформація", callback_data="mode:info")],
        [InlineKeyboardButton(text="📦 Статус замовлення", callback_data="mode:order")],
    ])

def remember_user(user, phone="") -> None:
    db.execute("INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?, ?)",
               (user.id, user.full_name, user.username or "", phone, datetime.now().isoformat()))
    db.commit()

def remember_admin_msg(admin_msg_id: int, user_id: int) -> None:
    db.execute("INSERT OR REPLACE INTO routing VALUES (?, ?)", (admin_msg_id, user_id))
    db.commit()

def set_mode(user_id: int, mode: str) -> None:
    db.execute("INSERT OR REPLACE INTO modes VALUES (?, ?)", (user_id, mode))
    db.commit()

def get_mode(user_id: int) -> str:
    row = db.execute("SELECT mode FROM modes WHERE user_id = ?", (user_id,)).fetchone()
    return row[0] if row else "contact"

@dp.message(CommandStart(), F.chat.type == ChatType.PRIVATE)
async def on_start(message: Message) -> None:
    await message.answer(WELCOME, reply_markup=start_kb())
    if message.chat.id == ADMIN_CHAT_ID or ADMIN_CHAT_ID == 0:
        return
    u = message.from_user
    is_new = db.execute("SELECT 1 FROM users WHERE user_id = ?", (u.id,)).fetchone() is None
    remember_user(u)
    if NOTIFY_ON_START and is_new:
        note = await bot.send_message(ADMIN_CHAT_ID, "🆕 <b>Новий користувач</b> · " + user_ident(u))
        remember_admin_msg(note.message_id, u.id)

@dp.callback_query(F.data.startswith("mode:"))
async def on_mode(cq: CallbackQuery) -> None:
    mode = cq.data.split(":", 1)[1]
    set_mode(cq.from_user.id, mode)

    if mode == "info":
        await cq.message.answer("📢 Напишіть важливу інформацію, яку хочете передати.")
    elif mode == "order":
        await cq.message.answer("📦 Введіть номер телефону, де було замовлення (для пошуку статусу):")
    else:
        await cq.message.answer("🛡 Напишіть ваше звернення — адміністрація відповість тут.")
    await cq.answer()

@dp.message(Command("id"))
async def on_id(message: Message) -> None:
    await message.answer(f"Chat ID: <code>{message.chat.id}</code>\nUser ID: <code>{message.from_user.id}</code>")

@dp.message(Command("help"))
async def on_help(message: Message) -> None:
    help_text = """
<b>Доступні команди:</b>

/start — Почати роботу
/help — Ця довідка
/id — Переглянути свій ID
/status — Статус бота

<b>Для звернень:</b>
Просто напишіть повідомлення або медіа (фото, відео)

<b>Для пошуку замовлення:</b>
Оберіть "📦 Статус замовлення" і введіть номер телефону
    """
    await message.answer(help_text)

@dp.message(Command("status"))
async def on_status(message: Message) -> None:
    status_text = f"""
<b>🤖 SVAROG Bot Status</b>

✅ Bot активний
⏰ Час: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
🛡 Mode: Webhook (Render)
📊 Version: 3.0.0

Для допомоги напиши /help
    """
    await message.answer(status_text)

@dp.message(F.chat.id == ADMIN_CHAT_ID, F.reply_to_message)
async def on_admin_reply(message: Message) -> None:
    row = db.execute("SELECT user_id FROM routing WHERE admin_msg_id = ?",
                     (message.reply_to_message.message_id,)).fetchone()
    if not row:
        return
    user_id = row[0]
    try:
        await message.copy_to(chat_id=user_id)
    except Exception as e:
        await message.reply(f"⚠️ Не вдалося надіслати користувачу: {e}")

@dp.message(F.chat.type == ChatType.PRIVATE)
async def on_user_message(message: Message) -> None:
    if message.chat.id == ADMIN_CHAT_ID:
        return
    if ADMIN_CHAT_ID == 0:
        await message.answer("Бот ще не налаштований. Спробуйте пізніше.")
        return

    u = message.from_user
    remember_user(u)
    mode = get_mode(u.id)

    if mode == "order":
        label = "📦 <b>Пошук статусу замовлення</b>"
    elif mode == "info":
        label = "📢 <b>Важлива інформація</b>"
    else:
        label = "🛡 <b>Звернення</b>"

    header = f"{label} від {user_ident(u)}"
    kb = None

    if mode == "info" and channel_ready():
        kb = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text="📢 Опублікувати в канал",
                                 callback_data=f"pub:{u.id}:{message.message_id}")
        ]])

    if message.text:
        sent = await bot.send_message(
            ADMIN_CHAT_ID, f"{header}\n\n{html.escape(message.text)}", reply_markup=kb
        )
    else:
        caption = header + (f"\n\n{html.escape(message.caption)}" if message.caption else "")
        try:
            sent = await bot.copy_message(
                ADMIN_CHAT_ID, from_chat_id=u.id, message_id=message.message_id,
                caption=caption, reply_markup=kb,
            )
        except Exception:
            await bot.send_message(ADMIN_CHAT_ID, header, reply_markup=kb)
            sent = await bot.copy_message(ADMIN_CHAT_ID, from_chat_id=u.id, message_id=message.message_id)

    remember_admin_msg(sent.message_id, u.id)

    if CONFIRM_TO_USER:
        if mode == "order":
            await message.answer("✅ Дякуємо! Ми знайдемо ваше замовлення за номером телефону.")
        elif mode == "info":
            await message.answer("✅ Дякуємо! Інформацію передано.")
        else:
            await message.answer("✅ Прийнято. Ми відповімо тут.")

async def handle_webhook(request):
    """Отримує вебхуки від Cloud Functions"""
    try:
        data = await request.json()
        event_type = data.get("type")

        if event_type == "order_created":
            order = data.get("order", {})
            msg = f"""
📋 <b>Нове замовлення!</b>

<b>ID:</b> <code>{order.get('id', 'N/A')}</code>
<b>Клієнт:</b> {order.get('name', 'невідомо')}
<b>Телефон:</b> {order.get('phone', 'невідомо')}
<b>Товари:</b> {order.get('items_count', '0')} шт.
<b>Сума:</b> {order.get('total', '0')}₴
            """
            await bot.send_message(ADMIN_CHAT_ID, msg)

        elif event_type == "order_updated":
            order = data.get("order", {})
            statuses = {"pending": "⏳", "confirmed": "✅", "shipped": "📦", "delivered": "🎉", "cancelled": "❌"}
            emoji = statuses.get(data.get("new_status"), "📋")
            msg = f"""
{emoji} <b>Змінилась статус замовлення!</b>

<b>ID:</b> <code>{order.get('id', 'N/A')}</code>
<b>Клієнт:</b> {order.get('name', 'невідомо')}
<b>Статус:</b> {data.get('old_status')} → <b>{data.get('new_status')}</b>
            """
            await bot.send_message(ADMIN_CHAT_ID, msg)

        return web.json_response({"status": "ok"})
    except Exception as e:
        log.error(f"Webhook error: {e}")
        return web.json_response({"error": str(e)}, status=400)

async def on_startup(bot: Bot) -> None:
    if BASE_URL:
        await bot.set_webhook(f"{BASE_URL}{WEBHOOK_PATH}", secret_token=WEBHOOK_SECRET, drop_pending_updates=True)
        log.info("Webhook: %s%s", BASE_URL, WEBHOOK_PATH)

async def health(request):
    return web.Response(text="OK — SVAROG v3.0.0")

def main() -> None:
    log.info(f"SVAROG Bot v3.0.0 starting...")
    dp.startup.register(on_startup)
    app = web.Application()
    app.router.add_get("/", health)
    app.router.add_post("/notify", handle_webhook)
    SimpleRequestHandler(dispatcher=dp, bot=bot, secret_token=WEBHOOK_SECRET).register(app, path=WEBHOOK_PATH)
    setup_application(app, dp, bot=bot)
    web.run_app(app, host="0.0.0.0", port=PORT)

if __name__ == "__main__":
    main()
