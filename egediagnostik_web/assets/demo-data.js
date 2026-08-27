window.EGE_DEMO_KEY='ege_diagnostik_demo_db_v3';
window.EGE_DEMO_DEFAULT=function(){
 const now=new Date().toISOString();
 return {
  roles:[{id:1,name:'Sistem Yöneticisi',slug:'admin'},{id:2,name:'Eğitim Kullanıcısı',slug:'student'}],
  users:[
   {id:1,role_id:1,first_name:'EGE',last_name:'Yönetici',email:'admin@egediagnostik.com.tr',phone:'',institution:'EGE Diagnostik',status:'active',last_login_at:now},
   {id:2,role_id:2,first_name:'EGE',last_name:'Akademi',email:'egitim@egediagnostik.com.tr',phone:'',institution:'EGE Diagnostik',status:'active',last_login_at:null}
  ],
  courses:[
   {id:1,title:'Doğru Sonuç ve Kalite Temelleri',slug:'dogru-sonuc-kalite-temelleri',level:'Temel',duration_minutes:55,summary:'Kurulum, validasyon, kalibrasyon, kalite kontrol, aplikasyon ve kullanıcı rehberliğinin temel ilkeleri.',cover_url:'',is_active:true},
   {id:2,title:'Tomografi ve MR Teknik Farkındalık',slug:'ct-mr-teknik-farkindalik',level:'Teknik',duration_minutes:70,summary:'CT ve MR/Emar sistemlerinde teknik süreklilik, çevresel koşullar, planlı bakım ve kullanıcı farkındalığı.',cover_url:'',is_active:true}
  ],
  sections:[
   {id:1,course_id:1,title:'1. Doğru Sonuç Zinciri',sort_order:1},{id:2,course_id:1,title:'2. Kalite ve Kullanıcı Rehberliği',sort_order:2},
   {id:3,course_id:2,title:'1. Görüntüleme Sistemlerine Giriş',sort_order:1},{id:4,course_id:2,title:'2. Teknik Süreklilik',sort_order:2}
  ],
  lessons:[
   {id:1,section_id:1,title:'Cihazın çalışması ile doğru sonuç arasındaki fark',content:'Bir sistemin hata vermeden çalışması tek başına yeterli değildir. Kurulum koşulları, validasyon, kalibrasyon, kalite kontrol ve kullanıcı uygulaması birlikte değerlendirilmelidir.',video_type:'url',video_url:'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',duration_seconds:420,sort_order:1,is_active:true},
   {id:2,section_id:1,title:'Kurulum, validasyon ve devreye alma',content:'Altyapı kontrolü, ilk çalışma doğrulaması ve performans değerlendirmesi doğru sonuç zincirinin başlangıç noktasıdır.',video_type:'url',video_url:'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',duration_seconds:510,sort_order:2,is_active:true},
   {id:3,section_id:2,title:'Kalibrasyon, kalite kontrol ve aplikasyon',content:'Kalibrasyon ve kalite kontrol ölçüm güvenilirliğini; aplikasyon desteği ise metodun ve kullanıcı iş akışının doğru yürütülmesini destekler.',video_type:'url',video_url:'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',duration_seconds:620,sort_order:1,is_active:true},
   {id:4,section_id:3,title:'Tomografi sistemlerinde temel teknik yapı',content:'CT sistemlerinde güç, soğutma, gantry, tüp, dedektör, masa ve görüntü rekonstrüksiyon zinciri birlikte değerlendirilir.',video_type:'url',video_url:'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',duration_seconds:560,sort_order:1,is_active:true},
   {id:5,section_id:3,title:'MR/Emar sistemlerinde temel teknik yapı',content:'MR sistemlerinde magnet, gradient, RF, soğutma, çevresel güvenlik ve kullanıcı iş akışı cihaz sürekliliğinin temel parçalarıdır.',video_type:'url',video_url:'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',duration_seconds:610,sort_order:2,is_active:true},
   {id:6,section_id:4,title:'Planlı bakım ve performans sürekliliği',content:'Önleyici bakım, tekrar eden risklerin izlenmesi ve doğru kullanıcı alışkanlıkları görüntüleme sistemlerinde kesintisiz hizmeti destekler.',video_type:'url',video_url:'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',duration_seconds:690,sort_order:1,is_active:true}
  ],
  progress:[],
  exams:[
   {id:1,course_id:1,title:'Doğru Sonuç Temel Değerlendirme',question_count:3,pass_score:70,time_limit_minutes:10,max_attempts:3,is_active:true},
   {id:2,course_id:2,title:'CT / MR Teknik Farkındalık Sınavı',question_count:3,pass_score:70,time_limit_minutes:12,max_attempts:3,is_active:true}
  ],
  questions:[
   {id:1,exam_id:1,question_text:'Bir cihazın yalnızca çalışıyor görünmesi doğru sonuç için yeterli midir?',option_a:'Evet, her zaman yeterlidir',option_b:'Hayır; kurulum, kalite, kalibrasyon ve kullanım koşulları da değerlendirilmelidir',option_c:'Sadece yeni cihazlarda yeterlidir',option_d:'Sadece yazılım güncelse yeterlidir',correct_option:'B',explanation:'Doğru sonuç bütün sistem koşullarının birlikte değerlendirilmesini gerektirir.',is_active:true},
   {id:2,exam_id:1,question_text:'Önleyici bakımın temel amacı nedir?',option_a:'Sadece arıza sonrası parça değiştirmek',option_b:'Cihazı daha sık kapatmak',option_c:'Riskleri erken fark ederek performans sürekliliğini desteklemek',option_d:'Kalite kontrolünü kaldırmak',correct_option:'C',explanation:'Önleyici bakım riskleri oluşmadan azaltmayı hedefler.',is_active:true},
   {id:3,exam_id:1,question_text:'Aplikasyon desteği hangi alanı güçlendirir?',option_a:'Metod, protokol ve kullanıcı iş akışını',option_b:'Yalnızca cihaz kasasını',option_c:'Sadece elektrik hattını',option_d:'Yalnızca satın alma sürecini',correct_option:'A',explanation:'Aplikasyon desteği doğru metod ve kullanıcı iş akışına rehberlik eder.',is_active:true},
   {id:4,exam_id:2,question_text:'Tomografi sistemlerinde teknik süreklilik hangi yaklaşımla ele alınmalıdır?',option_a:'Sadece arıza olduğunda',option_b:'Altyapı, bakım, kritik bileşenler ve performans birlikte değerlendirilerek',option_c:'Sadece kullanıcı şikayeti varsa',option_d:'Yalnızca cihaz yaşı dikkate alınarak',correct_option:'B',explanation:'CT sistemleri çok bileşenli teknik bir bütün olarak değerlendirilir.',is_active:true},
   {id:5,exam_id:2,question_text:'MR/Emar sistemlerinde kullanıcı rehberliği neden önemlidir?',option_a:'İş akışı ve sistem kullanımının doğru yürütülmesine katkı sağlar',option_b:'Sadece randevu sayısını artırır',option_c:'Teknik bakımı gereksiz kılar',option_d:'Kalibrasyonun yerine geçer',correct_option:'A',explanation:'Doğru kullanıcı yaklaşımı teknik sürekliliğin bir parçasıdır.',is_active:true},
   {id:6,exam_id:2,question_text:'Görüntüleme sistemlerinde planlı bakımın hedefi nedir?',option_a:'Sadece estetik temizlik',option_b:'Performans ve teknik sürekliliği desteklemek',option_c:'Cihazı daha fazla kapalı tutmak',option_d:'Kullanıcı eğitimini kaldırmak',correct_option:'B',explanation:'Planlı bakım performans sürekliliğine katkı sağlar.',is_active:true}
  ],
  results:[],attempts:[],certificates:[]
 };
};
if(/\/admin(?:\.html)?$/.test(location.pathname)){
 const a=document.createElement('script');a.src='/assets/cms-admin.js';
 a.onload=()=>{const b=document.createElement('script');b.src='/assets/cms-advanced.js';document.body.appendChild(b)};
 document.body.appendChild(a);
}
