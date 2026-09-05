-- EGE MEDİKAL ERP - MySQL 8.x
-- UTF8MB4 / InnoDB / append-only stok hareketi
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS ege_medikal_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci;
USE ege_medikal_erp;

CREATE TABLE IF NOT EXISTS tenantlar (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ad VARCHAR(160) NOT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roller (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kod VARCHAR(40) NOT NULL UNIQUE,
  ad VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS kullanicilar (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  rol_id BIGINT UNSIGNED NOT NULL,
  ad_soyad VARCHAR(140) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  parola_hash VARCHAR(255) NOT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenantlar(id),
  FOREIGN KEY (rol_id) REFERENCES roller(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS kurumlar (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  kod VARCHAR(40) NOT NULL,
  ad VARCHAR(180) NOT NULL,
  il VARCHAR(80), ilce VARCHAR(80), adres VARCHAR(255),
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_kurum (tenant_id,kod),
  FOREIGN KEY (tenant_id) REFERENCES tenantlar(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS kurum_bolumleri (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kurum_id BIGINT UNSIGNED NOT NULL,
  ad VARCHAR(120) NOT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_kurum_bolum (kurum_id,ad),
  FOREIGN KEY (kurum_id) REFERENCES kurumlar(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cihaz_siniflari (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, ad VARCHAR(100) NOT NULL UNIQUE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS markalar (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, ad VARCHAR(100) NOT NULL UNIQUE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS cihaz_modelleri (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cihaz_sinifi_id BIGINT UNSIGNED NOT NULL,
  marka_id BIGINT UNSIGNED NOT NULL,
  model VARCHAR(120) NOT NULL,
  gorsel VARCHAR(255), aktif TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_model (cihaz_sinifi_id,marka_id,model),
  FOREIGN KEY (cihaz_sinifi_id) REFERENCES cihaz_siniflari(id),
  FOREIGN KEY (marka_id) REFERENCES markalar(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS malzeme_turleri (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,kod VARCHAR(30) NOT NULL UNIQUE,ad VARCHAR(80) NOT NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS malzemeler (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  tur_id BIGINT UNSIGNED NOT NULL,
  kod VARCHAR(64) NOT NULL,
  ad VARCHAR(180) NOT NULL,
  uretici_kodu VARCHAR(80), barkod VARCHAR(80), birim VARCHAR(30) NOT NULL DEFAULT 'Adet',
  min_stok DECIMAL(14,3) NOT NULL DEFAULT 0,
  kritik_stok DECIMAL(14,3) NOT NULL DEFAULT 0,
  hedef_stok DECIMAL(14,3) NOT NULL DEFAULT 0,
  max_stok DECIMAL(14,3) NOT NULL DEFAULT 0,
  seri_takip TINYINT(1) NOT NULL DEFAULT 0,
  lot_takip TINYINT(1) NOT NULL DEFAULT 0,
  skt_takip TINYINT(1) NOT NULL DEFAULT 0,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_malzeme (tenant_id,kod),
  KEY ix_malzeme_ad(ad), KEY ix_malzeme_barkod(barkod),
  FOREIGN KEY (tenant_id) REFERENCES tenantlar(id),
  FOREIGN KEY (tur_id) REFERENCES malzeme_turleri(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS malzeme_cihaz_uyumluluklari (
  malzeme_id BIGINT UNSIGNED NOT NULL,
  cihaz_modeli_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (malzeme_id,cihaz_modeli_id),
  FOREIGN KEY (malzeme_id) REFERENCES malzemeler(id),
  FOREIGN KEY (cihaz_modeli_id) REFERENCES cihaz_modelleri(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cihazlar (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  cihaz_modeli_id BIGINT UNSIGNED NOT NULL,
  kurum_id BIGINT UNSIGNED NULL,
  bolum_id BIGINT UNSIGNED NULL,
  seri_no VARCHAR(100) NOT NULL,
  qr_kod VARCHAR(100) NOT NULL,
  durum ENUM('AKTIF_KURUMDA','PASIF_DEPODA','SERVISTE','HURDA','KARANTINA') NOT NULL DEFAULT 'PASIF_DEPODA',
  depo_giris_tarihi DATE NULL,
  garanti_bitis DATE NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cihaz_seri (tenant_id,seri_no), UNIQUE KEY uq_cihaz_qr (tenant_id,qr_kod),
  FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (cihaz_modeli_id) REFERENCES cihaz_modelleri(id),
  FOREIGN KEY (kurum_id) REFERENCES kurumlar(id), FOREIGN KEY (bolum_id) REFERENCES kurum_bolumleri(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS envanter_montajlari (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cihaz_id BIGINT UNSIGNED NOT NULL,
 montaj_tarihi DATETIME NOT NULL, teknisyen_id BIGINT UNSIGNED NOT NULL, form_no VARCHAR(50) NOT NULL,
 aciklama TEXT, imza_verisi MEDIUMTEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (cihaz_id) REFERENCES cihazlar(id), FOREIGN KEY (teknisyen_id) REFERENCES kullanicilar(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bakim_planlari (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, tenant_id BIGINT UNSIGNED NOT NULL, cihaz_modeli_id BIGINT UNSIGNED NOT NULL,
 ad VARCHAR(120) NOT NULL, periyot_tipi ENUM('GUNLUK','HAFTALIK','AYLIK','3_AY','6_AY','YILLIK','GUN') NOT NULL,
 periyot_degeri INT NOT NULL DEFAULT 1, kontrol_listesi JSON, aktif TINYINT(1) DEFAULT 1,
 FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (cihaz_modeli_id) REFERENCES cihaz_modelleri(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bakim_takipleri (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cihaz_id BIGINT UNSIGNED NOT NULL, bakim_plani_id BIGINT UNSIGNED NOT NULL,
 planlanan_tarih DATE NOT NULL, durum ENUM('BEKLIYOR','TAMAMLANDI','GECIKTI','IPTAL') NOT NULL DEFAULT 'BEKLIYOR',
 tamamlanma_tarihi DATETIME NULL, servis_formu_id BIGINT UNSIGNED NULL,
 KEY ix_bakim_tarih(planlanan_tarih,durum), FOREIGN KEY (cihaz_id) REFERENCES cihazlar(id), FOREIGN KEY (bakim_plani_id) REFERENCES bakim_planlari(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS servis_formlari (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, tenant_id BIGINT UNSIGNED NOT NULL, form_no VARCHAR(32) NOT NULL,
 cihaz_id BIGINT UNSIGNED NOT NULL, kurum_id BIGINT UNSIGNED NOT NULL, bolum_id BIGINT UNSIGNED NULL, teknisyen_id BIGINT UNSIGNED NOT NULL,
 tip ENUM('ARIZA','BAKIM','KURULUM','KONTROL') NOT NULL DEFAULT 'ARIZA', baslangic_at DATETIME NOT NULL, bitis_at DATETIME NULL,
 bildirilen_ariza TEXT, tespit_edilen_ariza TEXT, yapilan_islem TEXT, musteri_istekleri TEXT,
 sonuc ENUM('FAAL','CALISMIYOR','PARCA_BEKLIYOR','MERKEZE_ALINACAK','DEVAM_EDIYOR') NOT NULL DEFAULT 'DEVAM_EDIYOR',
 kurum_yetkilisi VARCHAR(140), servis_imza MEDIUMTEXT, kurum_imza MEDIUMTEXT, tamamlandi TINYINT(1) NOT NULL DEFAULT 0,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_servis_form_no(tenant_id,form_no),
 FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (cihaz_id) REFERENCES cihazlar(id), FOREIGN KEY (kurum_id) REFERENCES kurumlar(id),
 FOREIGN KEY (bolum_id) REFERENCES kurum_bolumleri(id), FOREIGN KEY (teknisyen_id) REFERENCES kullanicilar(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS depolar (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, tenant_id BIGINT UNSIGNED NOT NULL, ust_depo_id BIGINT UNSIGNED NULL,
 kurum_id BIGINT UNSIGNED NULL, sorumlu_kullanici_id BIGINT UNSIGNED NULL, kod VARCHAR(50) NOT NULL, ad VARCHAR(140) NOT NULL,
 tur ENUM('ANA','ALT','KURUM','ARAC','KARANTINA','IADE','HURDA') NOT NULL, aktif TINYINT(1) DEFAULT 1,
 UNIQUE KEY uq_depo(tenant_id,kod), FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (ust_depo_id) REFERENCES depolar(id),
 FOREIGN KEY (kurum_id) REFERENCES kurumlar(id), FOREIGN KEY (sorumlu_kullanici_id) REFERENCES kullanicilar(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stok_partileri (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, tenant_id BIGINT UNSIGNED NOT NULL, malzeme_id BIGINT UNSIGNED NOT NULL,
 lot_no VARCHAR(100) NULL, skt DATE NULL, seri_no VARCHAR(100) NULL,
 lot_no_norm VARCHAR(100) GENERATED ALWAYS AS (COALESCE(NULLIF(TRIM(lot_no),''),'~')) STORED,
 skt_norm DATE GENERATED ALWAYS AS (COALESCE(skt,'9999-12-31')) STORED,
 seri_no_norm VARCHAR(100) GENERATED ALWAYS AS (COALESCE(NULLIF(TRIM(seri_no),''),'~')) STORED,
 durum ENUM('SERBEST','KARANTINA','BLOKE','SKT_GECMIS','HURDA') NOT NULL DEFAULT 'SERBEST',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_parti(tenant_id,malzeme_id,lot_no_norm,skt_norm,seri_no_norm), KEY ix_parti_skt(skt), KEY ix_parti_lot(lot_no),
 FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (malzeme_id) REFERENCES malzemeler(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stok_bakiyeleri (
 tenant_id BIGINT UNSIGNED NOT NULL, depo_id BIGINT UNSIGNED NOT NULL, parti_id BIGINT UNSIGNED NOT NULL,
 miktar DECIMAL(14,3) NOT NULL DEFAULT 0, guncellendi_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY(tenant_id,depo_id,parti_id), FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (depo_id) REFERENCES depolar(id), FOREIGN KEY (parti_id) REFERENCES stok_partileri(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stok_hareketleri (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, tenant_id BIGINT UNSIGNED NOT NULL, hareket_uuid CHAR(36) NOT NULL UNIQUE,
 hareket_tipi ENUM('SATIN_ALMA_GIRIS','KURUM_IADE','SERVIS_IADE','KURUM_SEVKIYAT','SERVIS_KULLANIM','HURDA_CIKIS','DEPOLAR_ARASI_TRANSFER','ARAC_DEPO_TRANSFER','SAYIM_FAZLASI','SAYIM_EKSIGI','KARANTINA_ALMA','KARANTINA_CIKARMA','SKT_GECMIS','TERS_KAYIT') NOT NULL,
 parti_id BIGINT UNSIGNED NOT NULL, kaynak_depo_id BIGINT UNSIGNED NULL, hedef_depo_id BIGINT UNSIGNED NULL,
 miktar DECIMAL(14,3) NOT NULL, referans_turu VARCHAR(50), referans_id BIGINT UNSIGNED, ters_hareket_id BIGINT UNSIGNED NULL,
 aciklama VARCHAR(500), olusturan_id BIGINT UNSIGNED NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (parti_id) REFERENCES stok_partileri(id), FOREIGN KEY (kaynak_depo_id) REFERENCES depolar(id), FOREIGN KEY (hedef_depo_id) REFERENCES depolar(id), FOREIGN KEY (ters_hareket_id) REFERENCES stok_hareketleri(id), FOREIGN KEY (olusturan_id) REFERENCES kullanicilar(id), CHECK(miktar>0), CHECK(kaynak_depo_id IS NOT NULL OR hedef_depo_id IS NOT NULL)
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_stok_hareket_insert AFTER INSERT ON stok_hareketleri FOR EACH ROW
BEGIN
 IF NEW.kaynak_depo_id IS NOT NULL THEN
   INSERT INTO stok_bakiyeleri(tenant_id,depo_id,parti_id,miktar) VALUES(NEW.tenant_id,NEW.kaynak_depo_id,NEW.parti_id,-NEW.miktar)
   ON DUPLICATE KEY UPDATE miktar=miktar-NEW.miktar;
 END IF;
 IF NEW.hedef_depo_id IS NOT NULL THEN
   INSERT INTO stok_bakiyeleri(tenant_id,depo_id,parti_id,miktar) VALUES(NEW.tenant_id,NEW.hedef_depo_id,NEW.parti_id,NEW.miktar)
   ON DUPLICATE KEY UPDATE miktar=miktar+NEW.miktar;
 END IF;
END$$
CREATE TRIGGER trg_stok_hareket_no_update BEFORE UPDATE ON stok_hareketleri FOR EACH ROW BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Stok hareketleri değiştirilemez; ters hareket oluşturunuz.'; END$$
CREATE TRIGGER trg_stok_hareket_no_delete BEFORE DELETE ON stok_hareketleri FOR EACH ROW BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Stok hareketleri silinemez; ters hareket oluşturunuz.'; END$$
DELIMITER ;

CREATE TABLE IF NOT EXISTS stok_rezervasyonlari (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, tenant_id BIGINT UNSIGNED NOT NULL, depo_id BIGINT UNSIGNED NOT NULL, parti_id BIGINT UNSIGNED NOT NULL,
 miktar DECIMAL(14,3) NOT NULL, referans_turu ENUM('KURUM_SIPARIS','SERVIS_PARCA') NOT NULL, referans_id BIGINT UNSIGNED NOT NULL,
 durum ENUM('AKTIF','TUKETILDI','IPTAL') NOT NULL DEFAULT 'AKTIF', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 KEY ix_rez_aktif(depo_id,parti_id,durum), FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (depo_id) REFERENCES depolar(id), FOREIGN KEY (parti_id) REFERENCES stok_partileri(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS kurum_siparisleri (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, tenant_id BIGINT UNSIGNED NOT NULL, siparis_no VARCHAR(40) NOT NULL,
 kurum_id BIGINT UNSIGNED NOT NULL, isteyen_kullanici_id BIGINT UNSIGNED NULL,
 durum ENUM('TASLAK','SIPARIS_VERILDI','STOK_AYRILDI','HAZIRLANIYOR','SEVK_EDILDI','TESLIM_EDILDI','IPTAL') NOT NULL DEFAULT 'SIPARIS_VERILDI',
 notlar TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_siparis_no(tenant_id,siparis_no),
 FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (kurum_id) REFERENCES kurumlar(id), FOREIGN KEY (isteyen_kullanici_id) REFERENCES kullanicilar(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS kurum_siparis_kalemleri (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, siparis_id BIGINT UNSIGNED NOT NULL, malzeme_id BIGINT UNSIGNED NOT NULL,
 miktar DECIMAL(14,3) NOT NULL, karsilanan_miktar DECIMAL(14,3) NOT NULL DEFAULT 0,
 FOREIGN KEY (siparis_id) REFERENCES kurum_siparisleri(id), FOREIGN KEY (malzeme_id) REFERENCES malzemeler(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS servis_parca_talepleri (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, tenant_id BIGINT UNSIGNED NOT NULL, talep_no VARCHAR(40) NOT NULL,
 servis_formu_id BIGINT UNSIGNED NOT NULL, teknisyen_id BIGINT UNSIGNED NOT NULL, malzeme_id BIGINT UNSIGNED NOT NULL, miktar DECIMAL(14,3) NOT NULL,
 durum ENUM('ONAY_BEKLIYOR','ONAYLANDI','REDDEDILDI','REZERVE','TESLIM_EDILDI','KAPANDI') NOT NULL DEFAULT 'ONAY_BEKLIYOR',
 onaylayan_id BIGINT UNSIGNED NULL, onay_at DATETIME NULL, teslim_kodu CHAR(6) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_talep_no(tenant_id,talep_no), FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (servis_formu_id) REFERENCES servis_formlari(id), FOREIGN KEY (teknisyen_id) REFERENCES kullanicilar(id), FOREIGN KEY (malzeme_id) REFERENCES malzemeler(id), FOREIGN KEY (onaylayan_id) REFERENCES kullanicilar(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS arac_mahsuplasmalari (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, tenant_id BIGINT UNSIGNED NOT NULL, arac_depo_id BIGINT UNSIGNED NOT NULL, teknisyen_id BIGINT UNSIGNED NOT NULL,
 donem_baslangic DATE NOT NULL, donem_bitis DATE NOT NULL, teslim_edilen DECIMAL(14,3) DEFAULT 0, kullanilan DECIMAL(14,3) DEFAULT 0,
 iade_edilen DECIMAL(14,3) DEFAULT 0, kalan DECIMAL(14,3) DEFAULT 0, fark DECIMAL(14,3) DEFAULT 0,
 durum ENUM('TASLAK','ONAY_BEKLIYOR','ONAYLANDI','FARKLI') NOT NULL DEFAULT 'TASLAK', onaylayan_id BIGINT UNSIGNED NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (arac_depo_id) REFERENCES depolar(id), FOREIGN KEY (teknisyen_id) REFERENCES kullanicilar(id), FOREIGN KEY (onaylayan_id) REFERENCES kullanicilar(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS denetim_kayitlari (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, tenant_id BIGINT UNSIGNED NOT NULL, kullanici_id BIGINT UNSIGNED NULL,
 olay VARCHAR(80) NOT NULL, tablo VARCHAR(80), kayit_id BIGINT UNSIGNED NULL, ip VARCHAR(45), veri JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 KEY ix_audit_tarih(tenant_id,created_at), FOREIGN KEY (tenant_id) REFERENCES tenantlar(id), FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id)
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW v_malzeme_stok_ozeti AS
SELECT m.tenant_id,m.id malzeme_id,m.kod,m.ad,mt.ad tur,m.birim,m.min_stok,m.kritik_stok,
 COALESCE(SUM(CASE WHEN sp.durum='SERBEST' AND (sp.skt IS NULL OR sp.skt>=CURDATE()) THEN sb.miktar ELSE 0 END),0) kullanilabilir_stok,
 MIN(CASE WHEN sp.durum='SERBEST' AND sp.skt>=CURDATE() AND sb.miktar>0 THEN sp.skt END) en_yakin_skt
FROM malzemeler m JOIN malzeme_turleri mt ON mt.id=m.tur_id LEFT JOIN stok_partileri sp ON sp.malzeme_id=m.id LEFT JOIN stok_bakiyeleri sb ON sb.parti_id=sp.id
GROUP BY m.tenant_id,m.id,m.kod,m.ad,mt.ad,m.birim,m.min_stok,m.kritik_stok;

INSERT IGNORE INTO tenantlar(id,ad,aktif) VALUES(1,'EGE DİAGNOSTİK',1);
INSERT IGNORE INTO roller(id,kod,ad) VALUES(1,'SISTEM_ADMIN','Sistem Yöneticisi'),(2,'SERVIS_MUDURU','Servis Müdürü'),(3,'TEKNISYEN','Teknik Servis'),(4,'DEPO','Depo Görevlisi'),(5,'KURUM','Kurum Kullanıcısı');
INSERT IGNORE INTO kullanicilar(id,tenant_id,rol_id,ad_soyad,email,parola_hash,aktif) VALUES(1,1,1,'Serdar GÜNLÜ','admin@ege.local','$2y$12$ubEGSVvq4q03r8dFletEQuQBW4bsipT7bcn1pslrbsk8rnqEgfAAC',1);
INSERT IGNORE INTO malzeme_turleri(id,kod,ad) VALUES(1,'REAKTIF','Reaktif'),(2,'PARCA','Cihaz Parçası'),(3,'BAKIM_SETI','Bakım Seti'),(4,'SARF','Sarf Malzemesi');
