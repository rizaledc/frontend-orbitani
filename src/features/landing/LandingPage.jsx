import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapTrifold,
  ChatCircleDots,
  ChartBar,
  Leaf,
  Globe,
  ArrowRight,
  Cpu,
  Database,
  CloudCheck,
  Brain,
  Target,
  Users,
  Buildings,
  Briefcase,
} from '@phosphor-icons/react';

/* ─── SEO Head Updater ─────────────────────────────────────── */
const useSEO = ({ title, description }) => {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [title, description]);
};

/* ─── Data: Enterprise Features ──────────────────────────────── */
const FEATURES = [
  {
    id: 'feature-map',
    icon: MapTrifold,
    title: 'Pemetaan Lahan Akurat',
    description:
      'Integrasi langsung dengan Google Earth Engine memberikan citra satelit resolusi tinggi. Lakukan pemantauan indeks vegetasi (NDVI) dan perubahan lahan secara real-time tanpa delay.',
    badge: 'Real-Time GIS',
  },
  {
    id: 'feature-ai',
    icon: Brain,
    title: 'Analitik AI Generatif',
    description:
      'Model machine learning dan Gemini AI menganalisis ribuan titik data lahan, memberikan rekomendasi agronomis presisi tinggi untuk pemupukan dan penanganan hama.',
    badge: 'AI-Powered',
  },
  {
    id: 'feature-security',
    icon: Database,
    title: 'Infrastruktur Keamanan Data',
    description:
      'Dibangun di atas ekosistem cloud enterprise dengan enkripsi end-to-end. Data panen, titik koordinat, dan laporan finansial Anda sepenuhnya aman dan terisolasi.',
    badge: 'Enterprise Grade',
  },
];

/* ─── Data: How It Works (Stepper) ───────────────────────────── */
const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Pemetaan WebGIS',
    desc: 'Registrasikan poligon lahan Anda melalui sistem pemetaan interaktif berbasis web.',
    icon: MapTrifold,
  },
  {
    step: '02',
    title: 'Sinkronisasi Satelit',
    desc: 'Sistem menarik historis dan data satelit aktual secara otomatis (NDVI, cuaca, tanah).',
    icon: Globe,
  },
  {
    step: '03',
    title: 'Analisis AI Terpusat',
    desc: 'Mesin AI memproses data satelit untuk mendeteksi anomali pertumbuhan dan hama.',
    icon: Cpu,
  },
  {
    step: '04',
    title: 'Keputusan Agronomi',
    desc: 'Dapatkan laporan dan rekomendasi intervensi presisi untuk memaksimalkan hasil panen.',
    icon: Target,
  },
];

/* ─── Data: Use Cases ────────────────────────────────────────── */
const USE_CASES = [
  {
    title: 'Koperasi Tani',
    icon: Users,
    desc: 'Bantu anggota koperasi meningkatkan produktivitas dengan pemantauan kolektif. Identifikasi risiko panen gagal pada tingkat kelompok sebelum terjadi.',
  },
  {
    title: 'Perusahaan Agribisnis',
    icon: Buildings,
    desc: 'Manajemen ribuan hektar lahan terpusat. Gunakan analitik prediktif untuk estimasi suplai bahan baku dan optimasi rantai pasok industri secara akurat.',
  },
  {
    title: 'Penyuluh & Dinas',
    icon: Briefcase,
    desc: 'Laporan komprehensif berbasis data satelit untuk memvalidasi keberhasilan program subsidi pupuk dan pemetaan area krisis ketahanan pangan.',
  },
];

/* ─── Stats Data ───────────────────────────────────────────── */
const STATS = [
  { value: '10+', label: 'Wilayah Terintegrasi' },
  { value: 'Real-time', label: 'Data Satelit Terekstrak' },
  { value: 'AI', label: 'Rekomendasi Cerdas' },
  { value: '99.9%', label: 'Uptime Sistem' },
];

/* ─── Main Component ───────────────────────────────────────── */
const LandingPage = () => {
  useSEO({
    title: 'Orbitani — Platform B2B Remote Sensing & AI Pertanian',
    description:
      'Solusi enterprise untuk manajemen lahan pertanian. Orbitani mengombinasikan citra Google Earth Engine, analitik Machine Learning, dan AI Generatif untuk agribisnis.',
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans overflow-x-hidden transition-colors duration-300">

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-6 lg:px-12
                      bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-primary-50 dark:bg-gray-800 rounded-xl flex items-center justify-center border border-primary-100 dark:border-gray-700">
            <Leaf size={22} className="text-primary" weight="fill" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Orbitani</span>
        </div>

        {/* Navigation Links for Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#beranda" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Beranda</a>
          <a href="#solusi" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Solusi Enterprise</a>
          <a href="#cara-kerja" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Cara Kerja</a>
          <a href="#use-cases" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Studi Kasus</a>
        </div>

        <Link
          to="/login"
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl
                     hover:bg-primary-hover active:scale-95 transition-all duration-200 text-sm shadow-sm"
        >
          Masuk / Login
          <ArrowRight size={16} weight="bold" />
        </Link>
      </nav>

      {/* ── Hero Section ────────────────────────────────────── */}
      <section id="beranda" className="relative pt-32 pb-20 px-6 bg-white dark:bg-gray-950">
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                          rounded-full px-4 py-1.5 text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-widest mb-10">
            <Cpu size={14} weight="bold" className="text-primary" />
            AI · Remote Sensing · Enterprise Validated
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tight mb-8">
            <span className="block leading-[1.1]">Transformasi Agribisnis</span>
            <span className="block mt-2 text-primary">
              dengan Geospatial Intelligence
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
            Orbitani adalah platform perangkat lunak B2B yang mengintegrasikan citra satelit resolusi tinggi dan analitik kecerdasan buatan untuk mereduksi risiko gagal panen dan memfasilitasi pengambilan keputusan strategis.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2.5 px-8 py-4 bg-primary text-white font-bold rounded-2xl
                         text-base hover:bg-primary-hover active:scale-95 transition-all duration-300 shadow-sm w-full sm:w-auto"
            >
              Mulai Manajemen Lahan
              <ArrowRight size={20} weight="bold" />
            </Link>
            <a
              href="#solusi"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold
                         rounded-2xl text-base border border-gray-200 dark:border-gray-700
                         hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            >
              Eksplorasi Solusi
            </a>
          </div>

          {/* Stats Row */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden
                          border border-gray-100 dark:border-gray-800 max-w-4xl mx-auto shadow-sm">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-900 px-6 py-8 text-center">
                <p className="text-3xl font-black text-primary leading-none">{s.value}</p>
                <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-3 font-semibold uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEW: Tech Stack / Data Partners Banner ──────────── */}
      <section id="teknologi" className="py-12 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mb-8">
            Teknologi di Balik Akurasi Orbitani
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Tech Item 1 */}
             <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
               <Globe size={28} weight="duotone" />
               <span className="font-bold text-lg tracking-tight">Google Earth Engine</span>
             </div>
             {/* Tech Item 2 */}
             <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
               <CloudCheck size={28} weight="duotone" />
               <span className="font-bold text-lg tracking-tight">Microsoft Azure</span>
             </div>
             {/* Tech Item 3 */}
             <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
               <Brain size={28} weight="duotone" />
               <span className="font-bold text-lg tracking-tight">Gemini AI Engine</span>
             </div>
             {/* Tech Item 4 */}
             <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
               <Database size={28} weight="duotone" />
               <span className="font-bold text-lg tracking-tight">Machine Learning Data</span>
             </div>
          </div>
        </div>
      </section>

      {/* ── REWRITE: Solusi Enterprise Section ──────────────── */}
      <section id="solusi" className="py-24 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <span className="inline-block bg-primary-50 dark:bg-gray-800 text-primary font-bold text-xs uppercase tracking-widest
                             px-4 py-1.5 rounded-full mb-6 border border-primary-100 dark:border-gray-700">
              Solusi Enterprise
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
              Arsitektur Cerdas untuk Agribisnis Modern
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
              Kami menyadari bahwa keamanan data dan reliabilitas operasional adalah mutlak bagi organisasi Anda. Seluruh pemrosesan spasial dan data operasional diamankan di dalam infrastruktur terenkripsi dengan jaminan akurasi pemetaan berskala tinggi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div
                key={f.id}
                className="group bg-white dark:bg-gray-900 rounded-[2rem] p-10 border border-gray-100 dark:border-gray-800
                           hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
              >
                {/* Decorative background accent */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-gray-50 dark:bg-gray-800 rounded-full blur-2xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 transition-colors" />

                <span className="inline-block mb-8 py-1.5 px-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">
                  {f.badge}
                </span>

                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center mb-8 border border-gray-100 dark:border-gray-700 shadow-sm
                                group-hover:-translate-y-1 transition-transform duration-300">
                  <f.icon size={26} className="text-primary" weight="duotone" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 relative z-10">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed relative z-10">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEW: Cara Kerja Orbitani (Stepper) ──────────────── */}
      <section id="cara-kerja" className="py-24 px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-tight mb-4">
                Alur Integrasi Mulus
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-base">
                Proses pengambilan keputusan dari akuisisi data spasial hingga rekomendasi lapangan.
              </p>
            </div>
          </div>

          <div className="relative">
            {/* Desktop Horizontal Line */}
            <div className="hidden lg:block absolute top-[52px] left-12 right-12 h-px bg-gray-200 dark:bg-gray-800" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">
              {HOW_IT_WORKS.map((step, idx) => (
                <div key={idx} className="relative flex flex-col items-center lg:items-start">
                  
                  {/* Step Number Circle */}
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-950 border-[6px] border-gray-50 dark:border-gray-900 flex items-center justify-center shadow-sm mb-6
                                  ring-1 ring-gray-200 dark:ring-gray-700 group">
                    <span className="text-2xl font-black text-primary">{step.step}</span>
                  </div>

                  <div className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                      <step.icon size={18} className="text-primary" weight="fill" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{step.title}</h3>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NEW: Use Cases / Target Audience ────────────────── */}
      <section id="use-cases" className="py-24 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-4">Didesain Spesifik untuk Skala Anda</h2>
            <p className="text-gray-500 dark:text-gray-400 text-base max-w-2xl mx-auto">
              Tidak ada solusi satu ukuran untuk semua. Konfigurasi platform kami mendukung berbagai jenis struktur organisasi pertanian.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {USE_CASES.map((useCase, idx) => (
              <div key={idx} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-8 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <div className="w-12 h-12 bg-primary-50 dark:bg-gray-800 text-primary rounded-xl flex items-center justify-center mb-6">
                  <useCase.icon size={24} weight="duotone" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{useCase.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-950 rounded-[2.5rem] p-12 md:p-20 text-center border border-gray-200 dark:border-gray-800 shadow-xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
            Inisiasi Manajemen Cerdas Hari Ini
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Daftarkan organisasi Anda dan rasakan perbedaannya. Tanpa kontrak yang mengikat, berbasis langganan efisien.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-primary text-white font-bold
                       rounded-2xl text-base hover:bg-primary-hover active:scale-95 transition-all duration-300 shadow-sm"
          >
            Buat Akun Organisasi
            <ArrowRight size={20} weight="bold" />
          </Link>
        </div>
      </section>

      {/* ── REWRITE: Fat Footer ─────────────────────────────── */}
      <footer className="bg-white dark:bg-gray-950 pt-20 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          {/* Top grid area */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 pb-16 border-b border-gray-200 dark:border-gray-800">
            {/* Column 1: Logo & Desc (Spans 2 cols on lg) */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-10 h-10 bg-primary-50 dark:bg-gray-800 rounded-xl flex items-center justify-center border border-primary-100 dark:border-gray-700">
                  <Leaf size={22} className="text-primary" weight="fill" />
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Orbitani</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
                Platform SaaS Agronomi dan Manajemen Spasial Terpadu. Menjawab tantangan keamanan pangan menggunakan Data Satelit dan Artificial Intelligence.
              </p>
              <div className="flex items-center gap-4 text-gray-400">
                {/* Placeholder socials */}
                <a href="#linkedin" className="hover:text-primary transition-colors"><Globe size={24} weight="fill" /></a>
                <a href="#mail" className="hover:text-primary transition-colors"><ChartBar size={24} weight="fill" /></a>
              </div>
            </div>

            {/* Column 2: Produk */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6">Produk</h4>
              <ul className="space-y-4">
                <li><a href="#gis" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Platform WebGIS</a></li>
                <li><a href="#ai" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Asisten Pakar AI</a></li>
                <li><a href="#analytics" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Dashboard Analitik</a></li>
                <li><a href="#api" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Enterprise API</a></li>
              </ul>
            </div>

            {/* Column 3: Perusahaan */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6">Perusahaan</h4>
              <ul className="space-y-4">
                <li><a href="#about" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Tentang Kami</a></li>
                <li><a href="#careers" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Karir</a></li>
                <li><a href="#blog" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Blog Agrotech</a></li>
                <li><a href="#contact" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Hubungi Sales</a></li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><a href="#privacy" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Kebijakan Privasi</a></li>
                <li><a href="#terms" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Syarat & Ketentuan</a></li>
                <li><a href="#security" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Keamanan Data</a></li>
                <li><a href="#sla" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Service Level Agreement</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">
              © 2026 PT Orbitani Teknologi Terra. Hak cipta dilindungi undang-undang.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-gray-400 dark:text-gray-500 text-xs">Lokasi Server: Indonesia (ID-JKT)</span>
              <span className="flex items-center gap-1.5 text-primary text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Sistem Online
              </span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
