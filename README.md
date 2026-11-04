# Coffeegram — Admin panel (alohida ilova)

Faqat **administratorlar** uchun. Bo'limlar:

- **Jonli** — har 5 soniyada yangilanadi: bugungi savdo, har bir harakat (kim, qaerda, qancha), ochiq QR'lar
  (bekor qilish mumkin), kassirlar (kim hozir ishlayapti), kofexonalar bo'yicha bugungi savdo.
- **Cheklar** — barcha tranzaksiyalar, filtrlar, chek ko'rish/chop etish, chekni qaytarish, CSV eksport.
- **Mijozlar** — balans ±, bloklash. **Hisobot** — davr bo'yicha statistika.
- **Kofexonalar**, **Xodimlar** (kassir yaratish, rol berish), **Menyu**.

```bash
cp .env.example .env     # Supabase URL/kalit + VITE_CUSTOMER_URL
npm install
npm run dev              # http://localhost:5181
```

Jonli bo'lim uchun Supabase'da `coffee-cashback/supabase/04_activity.sql` ishga tushirilgan bo'lishi kerak.
Deploy — `coffee-cashback/README.md`.
# coffee-admin
