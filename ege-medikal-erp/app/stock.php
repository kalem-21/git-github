<?php
declare(strict_types=1);

function uuid_v4(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function stok_hareketi_ekle(
    PDO $pdo,
    string $tip,
    int $partiId,
    ?int $kaynakDepoId,
    ?int $hedefDepoId,
    float $miktar,
    ?string $referansTuru = null,
    ?int $referansId = null,
    ?string $aciklama = null
): int {
    $stmt = $pdo->prepare(
        'INSERT INTO stok_hareketleri
         (tenant_id,hareket_uuid,hareket_tipi,parti_id,kaynak_depo_id,hedef_depo_id,miktar,referans_turu,referans_id,aciklama,olusturan_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    );
    $stmt->execute([
        current_tenant_id(), uuid_v4(), $tip, $partiId, $kaynakDepoId, $hedefDepoId,
        $miktar, $referansTuru, $referansId, $aciklama, current_user_id()
    ]);
    return (int)$pdo->lastInsertId();
}

function mevcut_stok(PDO $pdo, int $depoId, int $partiId): float
{
    $stmt = $pdo->prepare(
        'SELECT COALESCE(miktar,0) FROM stok_bakiyeleri
         WHERE tenant_id=? AND depo_id=? AND parti_id=? FOR UPDATE'
    );
    $stmt->execute([current_tenant_id(), $depoId, $partiId]);
    $row = $stmt->fetchColumn();
    return $row === false ? 0.0 : (float)$row;
}

function kullanilabilir_partiler_fefo(PDO $pdo, int $malzemeId, int $depoId): array
{
    $stmt = $pdo->prepare(
        "SELECT sp.id, sp.lot_no, sp.skt, sb.miktar,
          COALESCE((SELECT SUM(sr.miktar) FROM stok_rezervasyonlari sr
                    WHERE sr.parti_id=sp.id AND sr.depo_id=sb.depo_id AND sr.durum='AKTIF'),0) AS rezerve
         FROM stok_partileri sp
         JOIN stok_bakiyeleri sb ON sb.parti_id=sp.id
         WHERE sp.tenant_id=? AND sp.malzeme_id=? AND sb.depo_id=?
           AND sp.durum='SERBEST'
           AND (sp.skt IS NULL OR sp.skt >= CURDATE())
           AND sb.miktar > 0
         ORDER BY (sp.skt IS NULL), sp.skt ASC, sp.id ASC
         FOR UPDATE"
    );
    $stmt->execute([current_tenant_id(), $malzemeId, $depoId]);
    return $stmt->fetchAll();
}

function fefo_rezerve_et(
    PDO $pdo,
    int $malzemeId,
    int $depoId,
    float $miktar,
    string $referansTuru,
    int $referansId
): array {
    $partiler = kullanilabilir_partiler_fefo($pdo, $malzemeId, $depoId);
    $kalan = $miktar;
    $alloc = [];
    foreach ($partiler as $p) {
        $musait = max(0.0, (float)$p['miktar'] - (float)$p['rezerve']);
        if ($musait <= 0) continue;
        $al = min($kalan, $musait);
        if ($al <= 0) continue;
        $ins = $pdo->prepare(
            "INSERT INTO stok_rezervasyonlari
             (tenant_id,depo_id,parti_id,miktar,referans_turu,referans_id,durum)
             VALUES (?,?,?,?,?,?,'AKTIF')"
        );
        $ins->execute([current_tenant_id(), $depoId, (int)$p['id'], $al, $referansTuru, $referansId]);
        $alloc[] = ['parti_id'=>(int)$p['id'],'miktar'=>$al,'lot_no'=>$p['lot_no'],'skt'=>$p['skt']];
        $kalan -= $al;
        if ($kalan <= 0.000001) break;
    }
    if ($kalan > 0.000001) {
        throw new RuntimeException('Yeterli kullanılabilir stok yok. Rezervasyon yapılamadı.');
    }
    return $alloc;
}

function rezervasyonu_tuketime_cevir(PDO $pdo, string $referansTuru, int $referansId, int $hedefDepoId, string $hareketTipi): void
{
    $stmt = $pdo->prepare(
        "SELECT sr.id,sr.depo_id,sr.parti_id,sr.miktar
         FROM stok_rezervasyonlari sr
         WHERE sr.tenant_id=? AND sr.referans_turu=? AND sr.referans_id=? AND sr.durum='AKTIF'
         FOR UPDATE"
    );
    $stmt->execute([current_tenant_id(), $referansTuru, $referansId]);
    $rows = $stmt->fetchAll();
    if (!$rows) throw new RuntimeException('Aktif rezervasyon bulunamadı.');

    foreach ($rows as $r) {
        $stok = mevcut_stok($pdo, (int)$r['depo_id'], (int)$r['parti_id']);
        if ($stok + 0.000001 < (float)$r['miktar']) {
            throw new RuntimeException('Rezervasyon için fiziksel stok yetersiz.');
        }
        stok_hareketi_ekle(
            $pdo, $hareketTipi, (int)$r['parti_id'], (int)$r['depo_id'], $hedefDepoId,
            (float)$r['miktar'], $referansTuru, $referansId, 'Rezervasyon fiziksel transfere çevrildi'
        );
        $upd = $pdo->prepare("UPDATE stok_rezervasyonlari SET durum='TUKETILDI' WHERE id=?");
        $upd->execute([(int)$r['id']]);
    }
}
