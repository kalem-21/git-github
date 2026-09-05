# EGE Medikal ERP — PHP + MySQL

Serdar GÜNLÜ Management System için medikal cihaz envanteri, teknik servis, periyodik bakım, depo/stok, kurum siparişleri, servis parça talepleri ve araç deposu mahsuplaşmasını tek veri modelinde birleştiren PHP 8.2+ / MySQL 8 tabanlı ERP çekirdeği.

## Canlı sistemden doğrulanan yapı
- Envanter: Görsel/Envanter Bilgisi, Seri No, Durum & Konum, Kurulum/Montaj, Servis Formları, Bakımlar.
- Periyodik bakım: kurum, cihaz-seri, periyot, planlanan tarih, durum, Bakım Yap.
- Teknik servis: kurum/bölüm/cihaz, başlangıç-bitiş, bildirilen arıza, tespit edilen arıza, yapılan işlem, müşteri isteği, sonuç, kullanılan yedek parçalar ve imza akışı.
- Dashboard: kurum arızaları, bekleyen bakımlar, cihaz sağlık oranı, kronik arıza analizi ve son servis müdahaleleri.
- Mevcut `parcalar.php` ve `servis-ariza-yonetimi.php` sayfalarında `alfa_db.sabit_kayitlar` tablosu bulunmadığı için PDO fatal error tespit edildi. Yeni projede bu kırılgan bağımlılık kaldırıldı.

## Stok omurgası
- Malzeme katalog kaydı tekildir; lot/SKT katalog satırını çoğaltmaz.
- Aynı malzeme + aynı lot + aynı SKT: aynı stok partisine yeni giriş hareketi.
- Aynı lot + farklı SKT: ayrı parti ve kullanıcı uyarısı.
- Reaktiflerde lot/SKT zorunlu; SKT geçmiş parti sevke kapalı.
- FEFO rezervasyon/sevk.
- Kurum siparişi önce rezervasyon, sevkte fiziksel hareket.
- Servis parçası: talep → servis müdürü onayı → rezervasyon → 6 haneli teslim kodu → araç deposuna transfer.
- Araç deposu stoktur; teknisyene verilen malzeme sistemden kaybolmaz.
- Mahsuplaşma: teslim edilen = kullanılan + iade edilen + kalan.
- `stok_hareketleri` append-only; UPDATE/DELETE trigger ile engellenir, düzeltme ters hareketle yapılır.
- `stok_bakiyeleri` hareketlerden beslenen performans projeksiyonudur.

## Kurulum
1. PHP 8.2+ ve MySQL 8 kurun; PDO MySQL açık olmalı.
2. `sql/ege_medikal_erp.sql` dosyasını çalıştırın.
3. Web kökünü `public/` klasörüne yönlendirin.
4. Demo kullanıcı: `admin@ege.local` / `Demo123!`.
5. Gerçek kullanımdan önce demo parolasını değiştirin ve UAT/yedekleme/güvenlik testlerini tamamlayın.

## Güvenlik
PDO prepared statements, password_hash/password_verify, CSRF, session ID regeneration, HttpOnly/SameSite cookie, RBAC, tenant filtreleme, append-only stok defteri ve denetim kaydı kullanılır.
