# EGE Diagnostik Web

Kurumsal web sitesi + ürün kataloğu + akıllı giriş + eğitim portalı + sınav + sertifika + admin yönetimi projesi.

## Hedef mimari
- Public kurumsal web
- Tek akıllı giriş: eğitim kullanıcısı -> Eğitim Portalı, admin -> Yönetim Merkezi
- Ürün kataloğu
- Udemy benzeri eğitim alanı
- Kurs / bölüm / ders / video ilerleme takibi
- Soru bankası ve sınav motoru
- Başarı sonrası otomatik sertifika
- Düzenlenebilir sertifika şablonu
- Admin CRUD
- WAF, brute-force, IP ban/unban, audit kayıtları
- Responsive tasarım

## Canlı önizleme
Vercel üzerinden yayınlanır.

## Veritabanı
`database/schema.sql` PostgreSQL uyumlu hedef şemadır. Canlı DB bağlantısı environment değişkenleri üzerinden kurulacaktır; credential kaynak koda yazılmaz.
