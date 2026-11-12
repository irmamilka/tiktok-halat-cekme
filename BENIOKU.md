# TikTok LIVE Halat Çekme

İzleyiciler yorumla takım seçer (**1 = Galatasaray**, **2 = Fenerbahçe**), beğeni ve hediyelerle halatı kendi taraflarına çeker. Halatı kendi bitiş çizgisine ilk çeken takım turu kazanır. Süre biterse önde olan kazanır.

| İzleyici ne yapar | Etkisi |
|---|---|
| `1`, `gs` veya `galatasaray` yazar | Galatasaray takımına katılır ve 1 çekiş yapar |
| `2`, `fb` veya `fenerbahçe` yazar | Fenerbahçe takımına katılır ve 1 çekiş yapar |
| Takımdayken herhangi bir yorum | 1 çekiş (kişi başı 1,5 sn'de bir) |
| Beğeni | Beğeni başına 0,4 çekiş |
| Hediye | Elmas başına 2 çekiş: Gül (1 elmas) = 2 çekiş, büyük hediyeler en fazla 100 çekiş |
| Takip / paylaşım | 5 çekiş |

Takım seçmeden beğeni veya hediye gönderen kişi otomatik olarak az kişili takıma eklenir. Tüm değerleri `config.json` içinden değiştirebilirsin.

## Mac kurulumu (adım adım)

1. https://nodejs.org adresinden **Node.js LTS** sürümünü indir (macOS Installer, .pkg) ve kur.
2. Zip dosyasına çift tıkla, çıkan `tiktok-halat-cekme` klasörünü örneğin Masaüstü'ne taşı.
3. Klasördeki `config.json` dosyasına sağ tıkla → **Birlikte Aç → TextEdit**. `"kullanici_adin_buraya"` yazan yere TikTok kullanıcı adını **@ olmadan** yaz ve kaydet (tırnak işaretlerini silme).
4. **Önce test et:** `demo-baslat.command` dosyasına çift tıkla. Terminal penceresi açılır, ilk seferde paketleri kurar (1-2 dk), sonra tarayıcıda sahte izleyicilerle oyun açılır. Durdurmak için Terminal penceresini kapat.
5. **Yayında:** TikTok yayınını başlat, sonra `baslat.command` dosyasına çift tıkla. Kontrol paneli tarayıcıda açılır ve "yayınına bağlandı" yazmalı. Terminal penceresi açık kaldığı sürece oyun çalışır.

### "Açılamıyor, geliştirici doğrulanamadı" uyarısı çıkarsa

İnternetten indirilen dosyalarda Mac bu uyarıyı verir. Bir kere izin vermen yeterli:

- **Yol 1:** `.command` dosyasına **sağ tıkla → Aç**, çıkan pencerede yine **Aç**'a bas.
- **Yol 2 (yeni macOS sürümleri):** Uyarıyı kapat, **Sistem Ayarları → Gizlilik ve Güvenlik** bölümüne gir, en altta "… engellendi" yazısının yanındaki **Yine de Aç** düğmesine bas ve şifreni gir.
- **Yol 3 (Terminal):** Aşağıdaki yedek yöntemi kullan, bu uyarıya hiç takılmaz.

### Yedek yöntem: Terminal ile başlatma

1. **Uygulamalar → İzlenceler → Terminal**'i aç.
2. `cd ` yaz (sonunda bir boşluk bırak), sonra `tiktok-halat-cekme` klasörünü Terminal penceresine sürükle bırak ve Enter'a bas.
3. İlk seferde bir kere: `npm install`
4. Test için: `npm run demo` · Yayında: `npm start`
5. Tarayıcıda `http://localhost:8080/panel` adresini aç. Durdurmak için Terminal'de **Ctrl + C**.

## Oyunu yayına ekleme

- **OBS:** Kaynaklar → + → **Tarayıcı** → URL `http://localhost:8080/` → genişlik **1080**, yükseklik **1920**.
- **TikTok LIVE Studio:** Kaynak ekle → **Link** (veya "Web sayfası") → aynı adres ve boyut.
- Kameranın üstüne şeffaf arka planla koymak istersen URL olarak `http://localhost:8080/?bg=transparent` kullan.
- Kontrol paneli (`http://localhost:8080/panel`) sadece sana görünür: yeni tur, duraklatma, sıfırlama ve test butonları burada.

## Windows kurulumu

Node.js LTS'i kur, `config.json` dosyasına kullanıcı adını yaz. Test için `demo-baslat.bat`, yayında `baslat.bat` dosyasına çift tıkla.

## Sunucuda çalıştırma ve telefondan yayın

Oyun bir sunucuda çalışınca bilgisayarın açık kalmak zorunda değil. Telefondan oyunun adresini açar, TikTok'ta **Mobil oyun** (ekran paylaşımı) ile yayına başlarsın.

Sunucuda ayarlanacak ortam değişkenleri:

| Değişken | Ne işe yarar |
|---|---|
| `PANEL_SIFRE` | Kontrol panelinin şifresi. Ayarlamazsan adresi bilen herkes oyunu yönetebilir. |
| `TIKTOK_KULLANICI` | TikTok kullanıcı adın (@ olmadan). Boş bırakırsan panelden yazıp **Bağlan**'a basabilirsin. |
| `EULER_API_KEY` | İsteğe bağlı. Bağlantı sorun çıkarırsa https://www.eulerstream.com adresinden ücretsiz anahtar alıp buraya yaz. |
| `DEMO` | `1` yaparsan sahte izleyicilerle demo modunda açılır. |

Render.com için klasördeki `render.yaml` hazır: Render'da **New → Blueprint** ile bu kodun bulunduğu GitHub deposunu seçmen yeterli.

Telefondan yayın:
1. Telefonda sunucu adresini (ör. `https://...onrender.com/`) tarayıcıda aç. iPhone'da Paylaş → **Ana Ekrana Ekle** yaparsan tam ekran açılır.
2. Ekrana bir kere dokun. Böylece Android'de tam ekran olur ve ekran kendiliğinden kapanmaz.
3. TikTok'ta **+** → **LIVE** → **Mobil oyun** seç, başlık yaz, **LIVE'a başla** de ve ekran paylaşımına izin ver.
4. Oyuna geri dön. İzleyiciler artık oyun ekranını görür.
5. Paneli (`/panel`) yayın sırasında telefonda açma, çünkü ekran paylaşıldığı için izleyiciler de görür. Paneli bilgisayardan ya da ikinci bir cihazdan aç.

## Sorun giderme

- **"şu an canlı yayında değil"**: Önce yayını başlat. Program 15 saniyede bir kendiliğinden yeniden dener.
- **Bağlanamıyor / imza hatası**: Bağlantı, ücretsiz bir imza sunucusu (Euler Stream) üzerinden yapılır. Çok sık bağlantıda limit olabilir. https://www.eulerstream.com adresinden ücretsiz API anahtarı alıp `config.json` içindeki `"eulerApiKey"` alanına yazabilirsin.
- **Ekranda hiçbir şey yok**: Terminal (Windows'ta siyah) pencerenin açık olduğundan emin ol.
- Yeni tur bitişten 10 saniye sonra kendiliğinden başlar.

Not: Bu araç TikTok'un resmi bir ürünü değildir. Yayın verisini okumak için açık kaynak `tiktok-live-connector` kütüphanesini kullanır.
