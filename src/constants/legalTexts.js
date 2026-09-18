// legalTexts.js - Ustabul Yasal Metinler
// KVKK, Gizlilik Politikası, Kullanım Koşulları ve Sorumluluk Reddi

const LEGAL_TEXTS = {
  // ==================== GİZLİLİK POLİTİKASI ====================
  privacyPolicy: {
    title: "Gizlilik ve Kişisel Verilerin Korunması Politikası",
    lastUpdated: "20 Ocak 2025",
    sections: [
      {
        title: "1. VERİ SORUMLUSU",
        content: `Ustabul mobil uygulaması ("Uygulama") üzerinden toplanan kişisel verilerinizin veri sorumlusu Ustabul'dır.

İletişim Bilgileri:
- Adres: Konya, Türkiye
- E-posta: destek@ustabul.com
- Telefon: [TELEFON NUMARASI]
- KVKK Başvuru: kvkk@ustabul.com

Bu Gizlilik Politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında hazırlanmıştır.`,
      },
      {
        title: "2. TOPLANAN KİŞİSEL VERİLER",
        content: `Uygulamamızı kullanırken aşağıdaki kişisel verileriniz işlenebilir:

Kimlik Bilgileri:
- Ad, Soyad
- Doğum Tarihi

İletişim Bilgileri:
- Cep Telefonu Numarası
- E-posta Adresi
- Adres Bilgisi

Mesleki Bilgiler (Usta Kullanıcılar):
- Meslek/Uzmanlık Alanı
- İş Deneyimi
- Portföy Fotoğrafları
- Müşteri Değerlendirmeleri
- Tamamlanan İş Sayısı

İşlem Bilgileri:
- İlan Detayları
- Teklif Bilgileri
- Sözleşme ve Anlaşma Kayıtları
- Chat Mesajları
- Yüklenen Fotoğraflar
- Şikayet ve Engelleme Kayıtları

Finansal Bilgiler:
- Abonelik Ödemeleri
- İlan Açma Ücret Kayıtları
- Cüzdan İstatistikleri (kazanç bilgileri)

Teknik Bilgiler:
- IP Adresi
- Cihaz Bilgileri (Model, İşletim Sistemi)
- Uygulama Kullanım Logları
- Konum Bilgisi (İzin verildiğinde)
- Push Notification Token`,
      },
      {
        title: "3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI",
        content: `Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:

Hizmet Sunumu:
- Kullanıcı hesabı oluşturma ve yönetimi
- İlan-teklif eşleştirme süreçleri
- Usta-Müşteri arasında iletişim sağlama
- Sözleşme ve anlaşma süreçlerinin yönetimi
- Değerlendirme ve puanlama sistemi

Güvenlik:
- Platform güvenliğinin sağlanması
- Şikayet ve engelleme işlemleri

Ödeme İşlemleri:
- Abonelik ücretlerinin tahsili
- İlan açma ücretlerinin işlenmesi
- Finansal kayıtların tutulması

İletişim ve Bilgilendirme:
- Yeni teklif bildirimleri
- Mesaj bildirimleri
- İş durumu güncellemeleri
- Sistem bildirimleri

Yasal Yükümlülükler:
- 5651 sayılı İnternet Ortamında Yapılan Yayınların Düzenlenmesi Kanunu gereği kayıt tutma
- Elektronik Ticaret mevzuatı gereği kayıt saklama
- Vergi mevzuatı gereği belge saklama`,
      },
      {
        title: "4. KİŞİSEL VERİLERİN İŞLENME HUKUKİ SEBEPLERİ",
        content: `Kişisel verileriniz KVKK'nın 5. ve 6. maddelerinde belirtilen aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:

KVKK Madde 5/2(a) - Kanunlarda Açıkça Öngörülmesi:
- 5651 sayılı Kanun - İnternet ortamında trafik bilgilerinin saklanması
- Elektronik Ticaret Yönetmeliği - İşlem kayıtlarının saklanması

KVKK Madde 5/2(c) - Sözleşmenin İfası:
- Kullanıcı Sözleşmesi'nin kurulması ve ifası
- İlan-teklif süreçlerinin yürütülmesi
- Ödeme işlemlerinin gerçekleştirilmesi

KVKK Madde 5/2(ç) - Hukuki Yükümlülük:
- Yasal kayıt saklama yükümlülükleri
- Vergi mevzuatı gereği belgeleme

KVKK Madde 5/2(f) - Meşru Menfaat:
- Platform güvenliğinin sağlanması
- Hizmet kalitesinin artırılması

KVKK Madde 5/1 - Açık Rıza:
- Pazarlama ve tanıtım bildirimleri
- Konum bazlı hizmetler
- Portföy fotoğraflarının paylaşımı
- İstatistiksel analiz çalışmaları`,
      },
      {
        title: "5. KİŞİSEL VERİLERİN AKTARILMASI",
        content: `Kişisel verileriniz aşağıdaki durumlarda ve taraflarla paylaşılabilir:

Hizmet Sağlayıcılar:
- Bulut depolama hizmeti sağlayıcıları (Firebase/Google Cloud)
- Ödeme sistemleri (İyzico vb.)
- SMS/E-posta gönderim hizmet sağlayıcıları
- Push notification servisleri

Diğer Kullanıcılar:
- İlan ve teklif süreçlerinde ilgili taraflar
- Profil bilgileri (ad, meslek, değerlendirmeler)
- Portföy fotoğrafları (paylaşım izni ile)
- Chat mesajları (sadece görüşülen kişiyle)

Yasal Merciler:
- KVKK Madde 28/1 çerçevesinde yetkili kamu kurum ve kuruluşları
- Mahkeme kararı veya yasal düzenlemeler gereği yetkili merciler
- Kolluk kuvvetleri (yasal talep halinde)

Önemli Not: Kişisel verileriniz, açık rızanız olmaksızın pazarlama amacıyla üçüncü taraflara satılmaz veya kiralanmaz.

Yurt Dışı Aktarım:
Firebase/Google Cloud servisleri kullanılması nedeniyle verileriniz Amerika Birleşik Devletleri sunucularında saklanabilir. Bu aktarım KVKK Madde 9 kapsamında, yeterli koruma bulunan ülkelere aktarım olarak gerçekleştirilmektedir.`,
      },
      {
        title: "6. KİŞİSEL VERİLERİN SAKLANMA SÜRESİ",
        content: `Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca saklanır:

Hesap Aktif İken:
- Tüm kullanıcı verileri aktif olarak saklanır
- Chat kayıtları süresiz saklanır
- İlan ve teklif kayıtları süresiz saklanır

Hesap Silindikten Sonra:
- Yasal saklama yükümlülüğü olan veriler: 10 yıl
  - İşlem kayıtları (5651 sayılı Kanun gereği)
  - Finansal kayıtlar (Vergi mevzuatı gereği)
  
- Diğer veriler: 6 ay içinde silinir
  - Profil bilgileri
  - Chat geçmişi
  - Fotoğraflar

Özel Durumlar:
- Şikayet ve uyuşmazlık kayıtları: Çözümlenene kadar + 1 yıl
- Hukuki süreç devam eden kayıtlar: Süreç sonuna kadar + zamanaşımı süresi`,
      },
      {
        title: "7. KİŞİSEL VERİ SAHİBİNİN HAKLARI",
        content: `KVKK Madde 11 kapsamında aşağıdaki haklara sahipsiniz:

a) Kişisel verilerinizin işlenip işlenmediğini öğrenme
b) İşlenmişse bilgi talep etme
c) İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
d) Yurt içi/yurt dışı aktarıldığı üçüncü kişileri öğrenme
e) Eksik/yanlış işlenmişse düzeltilmesini isteme
f) KVKK'ya uygun şartlarda silinmesini/yok edilmesini isteme
g) Düzeltme/silme işlemlerinin üçüncü kişilere bildirilmesini isteme
h) Otomatik sistemlerle analiz sonucu aleyhinize çıkan sonuca itiraz etme
i) Kanuna aykırı işleme nedeniyle zarara uğramanız halinde tazminat talep etme

Başvuru Yöntemi:
Haklarınızı kullanmak için aşağıdaki kanallardan başvurabilirsiniz:

1. Uygulama İçi: Ayarlar > KVKK Başvurusu
2. E-posta: kvkk@ustabul.com
3. Posta: Konya, Türkiye

Başvuru Süreci:
- Başvurunuz 30 gün içinde değerlendirilir
- Kimlik teyidi yapılır
- Talep türüne göre işlem yapılır
- Sonuç tarafınıza bildirilir`,
      },
      {
        title: "8. GÜVENLİK ÖNLEMLERİ",
        content: `Kişisel verilerinizin güvenliği için aşağıdaki önlemler alınmıştır:

Teknik Önlemler:
- SSL/TLS şifreleme
- Firebase güvenlik kuralları
- Güvenli API iletişimi
- Düzenli güvenlik güncellemeleri
- Şifreli veri saklama

İdari Önlemler:
- Sınırlı erişim yetkilendirmesi
- Veri işleme kayıtlarının tutulması
- Çalışan gizlilik taahhütnameleri
- Düzenli güvenlik eğitimleri

Fiziksel Önlemler:
- Bulut hizmet sağlayıcılarının güvenlik standartları (Google Cloud)
- Yedekleme sistemleri
- Felaket kurtarma planları`,
      },
      {
        title: "9. POLİTİKA DEĞİŞİKLİKLERİ",
        content: `Bu Gizlilik Politikası, yasal düzenlemelerdeki değişiklikler veya uygulama güncellemeleri nedeniyle değiştirilebilir.

Değişiklik Bildirimi:
- Önemli değişiklikler uygulama içi bildirimle duyurulur
- Güncel versiyon her zaman uygulama içinde erişilebilirdir
- Son güncelleme tarihi üstte belirtilir

Kullanıcı Sorumluluğu:
Uygulamayı kullanmaya devam ederek güncel politikayı kabul etmiş sayılırsınız.`,
      },
      {
        title: "10. İLETİŞİM",
        content: `Gizlilik Politikası ile ilgili sorularınız için:

E-posta: privacy@ustabul.com
KVKK Başvuru: kvkk@ustabul.com
Genel Destek: destek@ustabul.com
Adres: Konya, Türkiye

Kişisel Verileri Koruma Kurulu'na başvuru hakkınız saklıdır.
KVKK Web: www.kvkk.gov.tr`,
      },
    ],
  },

  // ==================== KULLANIM KOŞULLARI ====================
  termsOfUse: {
    title: "Kullanım Koşulları ve Kullanıcı Sözleşmesi",
    lastUpdated: "20 Ocak 2025",
    sections: [
      {
        title: "1. TARAFLAR VE TANIMLAR",
        content: `1.1. Taraflar

Platform Sağlayıcı: Ustabul
Kullanıcı: Ustabul mobil uygulamasını kullanan gerçek kişi

1.2. Tanımlar

- Platform/Uygulama: Ustabul mobil uygulaması
- Müşteri: İlan açan kullanıcı
- Usta: Teklif veren hizmet sağlayıcı kullanıcı
- Onaylı Usta: Premium rozet satın almış usta
- İlan: Müşteri tarafından açılan hizmet talebi
- Teklif: Usta tarafından verilen fiyat önerisi
- Sözleşme: Platform üzerinden oluşturulan dijital anlaşma belgesi
- Cüzdan: Ustaların kazanç istatistiklerini görebileceği sayfa
- Abonelik: Ustaların teklif verebilmesi için gerekli ücretli üyelik`,
      },
      {
        title: "2. SÖZLEŞMENİN KONUSU VE KABULÜ",
        content: `2.1. Konu

Bu sözleşme, Ustabul platformunun kullanım şartlarını ve tarafların hak ve yükümlülüklerini düzenler.

2.2. Kabulü

- Kayıt olurken "Kullanım Koşullarını kabul ediyorum" kutucuğunu işaretleyerek bu sözleşmeyi kabul etmiş olursunuz
- Uygulamayı kullanmaya devam ederek sözleşme şartlarını kabul ettiğinizi beyan edersiniz
- 18 yaşından küçükler platform kullanamaz

2.3. Sözleşme Süresi

- Sözleşme, hesap oluşturulduğu anda yürürlüğe girer
- Hesap silinene kadar geçerlidir
- Platform, bildirimsiz değişiklik yapma hakkını saklı tutar`,
      },
      {
        title: "3. PLATFORMUN NİTELİĞİ VE HİZMETLER",
        content: `3.1. Platform Niteliği

Ustabul, müşteriler ile ustaları buluşturan bir ARACI PLATFORM'dur.

ÖNEMLİ: Platform:
- ❌ İş garantisi vermez
- ❌ Hizmet kalitesini garanti etmez
- ❌ Fiyat belirleme yapmaz
- ❌ Usta-müşteri arası anlaşmazlıklarda taraf olmaz
- ✅ Sadece iletişim ve eşleşme ortamı sağlar

3.2. Sunulan Hizmetler

Müşteriler İçin:
- İlan açma (ücretli)
- Gelen teklifleri değerlendirme
- Usta ile sözleşme yapma
- Chat üzerinden iletişim
- Usta değerlendirme ve puanlama
- Şikayet/engelleme

Ustalar İçin:
- Abonelik ile teklif verme
- İlan arama ve filtreleme
- Müşteri ile sözleşme yapma
- Chat üzerinden iletişim
- Portföy oluşturma
- Kazanç istatistikleri (Cüzdan)
- Onaylı usta olma (opsiyonel, ücretli)

3.3. Ücretli Hizmetler

- İlan Açma Ücreti: Müşterilerin ilan yayınlaması için
- Usta Aboneliği: Ustaların teklif verebilmesi için
- Onaylı Usta Ücreti: Özel rozet için

Ücret politikası uygulama içinde belirtilir ve değiştirilebilir.`,
      },
      {
        title: "4. KULLANICI YÜKÜMLÜLÜKLERİ",
        content: `4.1. Genel Yükümlülükler

Kullanıcı:
- Gerçek, doğru ve güncel bilgi vermekle yükümlüdür
- Hesap güvenliğinden sorumludur
- Şifresini kimseyle paylaşmayacaktır
- Platformu kötüye kullanmayacaktır
- Yasal düzenlemelere uyacaktır

4.2. Müşteri Yükümlülükleri

- İlanında gerçek ve net bilgi vermek
- Seçtiği usta ile dürüst anlaşma yapmak
- İş tamamlandıktan sonra değerlendirme yapmak
- Anlaşılan ücreti ödemek (platform dışı)
- Gereksiz şikayet/engelleme yapmamak

4.3. Usta Yükümlülükleri

- Uzmanlık alanında teklif vermek
- Gerçekçi ve uygulanabilir fiyat teklif etmek
- Sözleşmeye uygun hizmet sunmak
- Müşteri ile profesyonel iletişim kurmak
- Portföyünde gerçek çalışmalarını paylaşmak

4.4. Yasaklı Davranışlar

Platform kullanırken YASAKTIR:
- ❌ Sahte hesap açma
- ❌ Başka kullanıcı adına işlem yapma
- ❌ Dolandırıcılık, vurgun, hile
- ❌ Hakaret, tehdit, taciz
- ❌ Spam, reklam, zincir mesaj
- ❌ Telif hakkı ihlali
- ❌ Sistemi manipüle etme
- ❌ Cinsel içerik, müstehcenlik
- ❌ Nefret söylemi, ayrımcılık

İhlal Sonuçları:
1. Uyarı
2. Geçici askıya alma
3. Kalıcı hesap kapatma
4. Yasal işlem başlatma`,
      },
      {
        title: "5. SORUMLULUK REDDİ VE SINIRLAMALARI",
        content: `5.1. PLATFORM SORUMLULUĞUNUN OLMADIĞI DURUMLAR

Platform aşağıdaki konulardan SORUMLU DEĞİLDİR:

❌ Kullanıcı Arası Anlaşmazlıklar:
- İş kalitesi, zamanında tamamlanmaması
- Ücret ödenmemesi veya anlaşmazlığı
- Malzeme, işçilik sorunları
- Sözleşme ihlalleri
- Fiziksel veya maddi zararlar

❌ Dolandırıcılık ve Hile:
- Sahte kimlik kullanımı
- Ödeme aldıktan sonra kaybolma
- Kalitesiz hizmet sunma
- Müşteri tarafından ücret ödememe
- Platform dışı anlaşmalar

❌ Hizmet Kalitesi:
- İşin profesyonel yapılmaması
- Beklentilerin karşılanmaması
- Malzeme kalitesi
- İş süresi ve zamanlaması

❌ Üçüncü Taraflar:
- Ödeme sistemleri (İyzico vb.)
- SMS/Bildirim servisleri
- İnternet bağlantı sorunları

5.2. Kullanıcı Sorumluluğu

- Kullanıcılar, platform üzerinden yaptıkları anlaşmalardan bizzat sorumludur
- Platform, sadece iletişim ortamı sağlar
- Ücret ödemesi, iş teslimi, kalite gibi konular kullanıcılar arasındadır
- Herhangi bir zarar durumunda kullanıcılar birbirlerine karşı hukuki yollara başvurabilir

5.3. Platform Garantisi Yoktur

Platform GARANTİ VERMEZ:
- Kesintisiz hizmet
- Hatasız çalışma
- İş bulma garantisi (usta için)
- Kaliteli usta bulma garantisi (müşteri için)
- Veri kaybı olmayacağı

5.4. Zarar Sorumluluğu Sınırlaması

Platform, hiçbir şekilde aşağıdaki zararlardan sorumlu tutulamaz:
- Doğrudan/dolaylı maddi zararlar
- Kazanç kaybı
- Veri kaybı
- Manevi zararlar
- Üçüncü taraf iddiaları

Maksimum Sorumluluk: Platformun sorumluluğu, varsa kullanıcının son 3 ayda ödediği ücretlerle sınırlıdır.

5.5. Yasal İstisna

Yukarıdaki sorumluluk sınırlamaları, platformun kasıtlı veya ağır kusuru halinde geçerli değildir.`,
      },
      {
        title: "6. ŞİKAYET VE ENGELLEME SİSTEMİ",
        content: `6.1. Şikayet Mekanizması

Platform içi şikayet sistemi, kullanıcı deneyimini iyileştirmek içindir.

Şikayet Sebepleri:
- Kural ihlali
- Uygunsuz davranış
- Spam/taciz
- Sahte profil şüphesi

Önemli: Şikayet sistemi, ücret iade veya iş garantisi sağlamaz!

6.2. Şikayet Değerlendirme

- Şikayetler incelenir
- Kanıt talep edilebilir
- Gerekirse hesap askıya alınır veya kapatılır
- Sonuç bildirilir

6.3. Engelleme

- Kullanıcılar birbirini engelleyebilir
- Engellenen kişi iletişim kuramaz
- Engelleme kişisel tercih olup platform sorumluluğu yoktur

6.4. Uyuşmazlık Çözümü

Platform, kullanıcı arası uyuşmazlıklarda:
- Arabulucu değildir
- Hakem değildir
- Taraf olmaz

Kullanıcılar, anlaşmazlıklarını kendi aralarında veya hukuki yollarla çözmelidir.`,
      },
      {
        title: "7. ÖDEME VE İADE POLİTİKASI",
        content: `7.1. Ücretli Hizmetler

- İlan açma ücreti
- Usta aboneliği
- Onaylı usta ücreti

7.2. Ödeme Yöntemi

- Kredi/Banka kartı (İyzico vb.)
- Mobil ödeme (varsa)
- Diğer yöntemler (uygulama içinde belirtilir)

7.3. Platform Dışı Ödemeler

ÖNEMLİ: Müşteri-usta arası iş ücretleri PLATFORM DIŞINDA ödenir!

- Platform, iş ücretlerinden pay almaz
- İş ücreti, kullanıcılar arası anlaşmaya bağlıdır
- Ödeme yöntemi kullanıcılar arasında belirlenir
- Platform bu ödemelerden sorumlu değildir

7.4. İade Politikası

- İlan Ücreti: İlan yayınlandıktan sonra iade edilmez
- Abonelik: Aktif abonelik süresi için iade yapılmaz
- Onaylı Usta: Satın alındıktan sonra iade yapılmaz

İstisnai İade:
- Teknik hata nedeniyle çift ödeme
- Hizmetin hiç sunulmaması (platformun hatası)

İade süresi: Talep onaylandıktan sonra 14 iş günü`,
      },
      {
        title: "8. HESAP ASKIYA ALMA VE KAPATMA",
        content: `8.1. Platform Tarafından Askıya Alma

Platform aşağıdaki durumlarda hesabı askıya alabilir:
- Kural ihlali şüphesi
- Çoklu şikayet
- Dolandırıcılık şüphesi
- Sistem kötüye kullanımı

Süreç:
1. Hesap geçici olarak dondurulur
2. Kullanıcı bilgilendirilir
3. Açıklama talep edilir
4. Karar verilir (açma veya kapatma)

8.2. Kalıcı Hesap Kapatma

Platform tarafından kapatma sebepleri:
- Tekrarlayan kural ihlali
- Kötüye kullanım şüphesi
- Yasal zorunluluk

Kullanıcı tarafından kapatma:
- Kullanıcı istediği zaman hesabını kapatabilir
- Ayarlar > Hesabı Sil

8.3. Hesap Kapatılınca:
- Aktif ilanlar/teklifler iptal olur
- Chat geçmişi silinir
- Kişisel veriler KVKK'ya uygun işlenir
- Yasal saklama süresi olan veriler saklanır
- Abonelik iadesi yapılmaz`,
      },
      {
        title: "9. UYGULANACAK HUKUK VE YETKİ",
        content: `9.1. Uygulanacak Hukuk

Bu sözleşme Türkiye Cumhuriyeti kanunlarına tabidir.

9.2. Yetkili Mahkeme

Bu sözleşmeden doğacak uyuşmazlıklarda Konya Mahkemeleri ve İcra Daireleri yetkilidir.

9.3. Tüketici Hakları

Kullanıcılar, 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamındaki haklarını saklı tutar.

Tüketici Sorunları İçin:
- Tüketici Hakem Heyeti
- Tüketici Mahkemeleri
- Gümrük ve Ticaret Bakanlığı`,
      },
      {
        title: "10. İLETİŞİM BİLGİLERİ",
        content: `Kullanım Koşulları ile ilgili sorularınız için:

E-posta: destek@ustabul.com
Adres: Konya, Türkiye

Şikayet ve Talepler:
- Uygulama içi destek: Ayarlar > Yardım > İletişim
- E-posta: destek@ustabul.com

KVKK Başvuruları:
- kvkk@ustabul.com`,
      },
    ],
  },

  // ==================== AÇIK RIZA METNİ ====================
  consentText: {
    title: "Kişisel Verilerin İşlenmesine İlişkin Açık Rıza Metni",
    lastUpdated: "20 Ocak 2025",
    content: `AÇIK RIZA BEYANI

6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, aşağıda belirtilen kişisel verilerimin, belirtilen amaçlarla işlenmesine, saklanmasına ve aktarılmasına özgür irademle AÇIK RIZA veriyorum:

1. Rıza Verilen Kişisel Veriler:

- Ad, soyad
- Telefon numarası
- E-posta adresi
- Adres bilgisi
- Mesleki bilgiler ve portföy
- Yüklediğim fotoğraflar
- Chat mesajları
- Konum bilgisi (açarsam)
- Cihaz ve kullanım bilgileri
- IP adresi

2. Veri İşleme Amaçları:

- Ustabul platformunun sunduğu hizmetlerden faydalanmam
- İlan-teklif eşleştirilmesi
- Usta-müşteri iletişiminin sağlanması
- Ödeme işlemlerinin gerçekleştirilmesi
- Profil oluşturma ve gösterimi
- Değerlendirme ve puanlama sistemi
- Platform güvenliğinin sağlanması
- Bilgilendirme ve bildirim gönderimi
- İstatistiksel analiz çalışmaları
- Hizmet kalitesinin artırılması

3. Veri Aktarımı:

Kişisel verilerimin aşağıdaki taraflara aktarılmasına rıza veriyorum:

- Bulut hizmet sağlayıcıları (Firebase/Google Cloud)
- Ödeme kuruluşları (İyzico vb.)
- SMS/E-posta gönderim servisleri
- Diğer kullanıcılar (profil bilgileri, ilan/teklif süreçlerinde)
- Yasal zorunluluk halinde yetkili merciler

4. Haklarım:

KVKK Madde 11 kapsamında haklarımı biliyorum:
- Verilerimin işlenip işlenmediğini öğrenme
- İşlenmişse bilgi talep etme
- İşlenme amacını öğrenme
- Eksik/yanlışsa düzeltilmesini isteme
- Silinmesini/yok edilmesini isteme
- İtiraz etme
- Zarar görmem halinde tazminat talep etme

5. Rızanın Geri Alınması:

Bu rızamı istediğim zaman geri alabileceğimi biliyorum.
Geri alma: kvkk@ustabul.com veya Uygulama > Ayarlar > KVKK

6. Beyan:

✅ Yukarıdaki bilgileri okudum, anladım
✅ Gizlilik Politikasını okudum
✅ Özgür iradem ile rıza veriyorum
✅ 18 yaşından büyüğüm

Kullanıcı Adı/E-posta: ___________________
Tarih: ___________________
Onay: [Kayıt sırasında checkbox ile onaylanır]`,
  },
};

export default LEGAL_TEXTS;
