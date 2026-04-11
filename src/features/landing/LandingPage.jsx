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
  Sun,
  Moon,
  Desktop,
} from '@phosphor-icons/react';
import useThemeStore from '../../store/themeStore';

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

/* ─── Theme Toggle Component ───────────────────────────────── */
const ThemeToggle = () => {
  const { theme, setTheme } = useThemeStore();
  return (
    <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl items-center gap-1 border border-gray-200 dark:border-gray-700 shadow-inner">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${theme === 'light'
            ? 'bg-white text-primary shadow-sm dark:bg-gray-700'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        title="Light Mode"
      >
        <Sun size={16} weight={theme === 'light' ? 'fill' : 'bold'} />
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${theme === 'system'
            ? 'bg-white text-primary shadow-sm dark:bg-gray-700'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        title="System Preference"
      >
        <Desktop size={16} weight={theme === 'system' ? 'fill' : 'bold'} />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${theme === 'dark'
            ? 'bg-white text-primary shadow-sm dark:bg-gray-700'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        title="Dark Mode"
      >
        <Moon size={16} weight={theme === 'dark' ? 'fill' : 'bold'} />
      </button>
    </div>
  );
};

/* ─── Main Component ───────────────────────────────────────── */
const LandingPage = () => {
  useSEO({
    title: 'Orbitani — Platform B2B Remote Sensing & AI Pertanian',
    description:
      'Solusi enterprise untuk manajemen lahan pertanian. Orbitani mengombinasikan citra Google Earth Engine, analitik Machine Learning, dan AI Generatif untuk agribisnis.',
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans overflow-x-hidden transition-colors duration-300 animate-fade-in">

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-6 lg:px-12
                      bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="flex items-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Orbitani</span>
        </div>

        {/* Navigation Links for Desktop */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <a href="#beranda" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Beranda</a>
          <a href="#tentang-kami" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Tentang Kami</a>
          <a href="#solusi" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Solusi</a>
          <a href="#cara-kerja" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Cara Kerja</a>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            to="/login"
            className="group flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl
                       hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-300 text-sm shadow-sm"
          >
            Akses Platform
            <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
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
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12">
            Platform B2B yang memadukan citra satelit dan keahlian AI untuk menghasilkan rekomendasi tanam presisi serta memastikan setiap langkah strategis agribisnis Anda selalu akurat.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="group flex items-center justify-center gap-2.5 px-8 py-4 bg-primary text-white font-bold rounded-2xl
                         text-base hover:bg-primary-hover hover:-translate-y-1 hover:shadow-lg active:scale-95 transition-all duration-300 shadow-sm w-full sm:w-auto"
            >
              Mulai Manajemen Lahan
              <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <a
              href="#solusi"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold
                         rounded-2xl text-base border border-gray-200 dark:border-gray-700
                         hover:bg-gray-50 hover:shadow-md hover:-translate-y-1 dark:hover:bg-gray-800 active:scale-95 transition-all duration-300 w-full sm:w-auto"
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
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {/* Tech Item 1 */}
            <div className="group flex items-center gap-2.5 text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary-light transition-colors duration-300 cursor-pointer">
              <Globe size={28} weight="duotone" className="group-hover:scale-110 transition-transform duration-300" />
              <span className="font-bold text-lg tracking-tight">Google Earth Engine</span>
            </div>
            {/* Tech Item 2 */}
            <div className="group flex items-center gap-2.5 text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary-light transition-colors duration-300 cursor-pointer">
              <CloudCheck size={28} weight="duotone" className="group-hover:scale-110 transition-transform duration-300" />
              <span className="font-bold text-lg tracking-tight">Microsoft Azure</span>
            </div>
            {/* Tech Item 3 */}
            <div className="group flex items-center gap-2.5 text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary-light transition-colors duration-300 cursor-pointer">
              <Brain size={28} weight="duotone" className="group-hover:scale-110 transition-transform duration-300" />
              <span className="font-bold text-lg tracking-tight">Gemini AI Engine</span>
            </div>
            {/* Tech Item 4 */}
            <div className="group flex items-center gap-2.5 text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary-light transition-colors duration-300 cursor-pointer">
              <Database size={28} weight="duotone" className="group-hover:scale-110 transition-transform duration-300" />
              <span className="font-bold text-lg tracking-tight">Machine Learning Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEW: Tentang Kami (About Us) ────────────────────── */}
      <section id="tentang-kami" className="py-24 px-6 bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">

          {/* Kiri: Narasi */}
          <div className="lg:w-1/2">
            <span className="inline-block bg-primary-50 dark:bg-gray-800 text-primary font-bold text-xs uppercase tracking-widest
                             px-4 py-1.5 rounded-full mb-6 border border-primary-100 dark:border-gray-700">
              Tentang Orbitani
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
              Membangun Masa Depan <span className="text-primary block mt-1">Pertanian Digital</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-6">
              Kami lahir dari sebuah visi sederhana namun mendesak: <strong>Membawa revolusi data ke pedesaan dan sektor agrikultur di Indonesia.</strong> Orbitani didirikan oleh gabungan pakar agronomi dan rekayasawan teknologi yang memahami pahitnya ketidakpastian lahan, ancaman hama tak terdeteksi, dan iklim ekstrem yang kian fluktuatif.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
              Lewat algoritma <em>Machine Learning</em>, kami mentransformasi piksel satelit geospasial mentah menjadi pedoman prediksi akurat yang tergelar manis di atas layar perangkat Anda—mereduksi kerugian hasil panen dan merajut kembali harapan akan ketahanan pangan masa depan.
            </p>
          </div>

          {/* Kanan: Pilar Nilai (Core Values Grid) */}
          <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">

            {/* Value 1 */}
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 group hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Leaf size={24} className="text-primary" weight="duotone" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sustainable</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Mendorong rasionalisasi pupuk untuk masa depan lahan lestari.</p>
            </div>

            {/* Value 2 */}
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 lg:translate-y-6 group hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Cpu size={24} className="text-primary" weight="duotone" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Inovatif</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Menyokong keputusan krusial berbasis riset jaringan syaraf buatan.</p>
            </div>

            {/* Value 3 */}
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 group hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Globe size={24} className="text-primary" weight="duotone" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Mata Angkasa</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Pengawasan lahan 24/7 tanpa perlu menjejakkan kaki ke lumpur persawahan.</p>
            </div>

            {/* Value 4 */}
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 lg:translate-y-6 group hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users size={24} className="text-primary" weight="duotone" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Kolaboratif</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Arsitektur B2B multi-tenant untuk dinas, koperasi, maupun privat.</p>
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
                  <div className="group w-24 h-24 rounded-full bg-white dark:bg-gray-950 border-[6px] border-gray-50 dark:border-gray-900 flex items-center justify-center shadow-sm mb-6
                                  ring-1 ring-gray-200 dark:ring-gray-700 cursor-default
                                  hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/10 dark:hover:border-primary/20 hover:ring-primary/20
                                  transition-all duration-500 ease-in-out z-10 relative">
                    <span className="text-2xl font-black text-primary transition-colors duration-500">{step.step}</span>
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
            Mulai Transformasi Agribisnis Anda Hari Ini
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Bergabunglah dengan ekosistem analitik Orbitani. Daftarkan organisasi Anda untuk merasakan kemudahan pemantauan lahan presisi dan pengambilan keputusan berbasis data satelit.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-primary text-white font-bold
                       rounded-2xl text-base hover:bg-primary-hover hover:-translate-y-1 hover:shadow-xl active:scale-95 transition-all duration-300 shadow-sm"
          >
            Buat Akun Organisasi
            <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1.5 transition-transform" />
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

            {/* Column 2: Platform & Fitur */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><Link to="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Peta Eksplorasi Lahan</Link></li>
                <li><Link to="/chat" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Asisten Pakar AI</Link></li>
                <li><Link to="/analytics" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Laporan Analitik</Link></li>
                <li><Link to="/history" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Arsip Historis Satelit</Link></li>
              </ul>
            </div>

            {/* Column 3: Jelajah */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6">Jelajah</h4>
              <ul className="space-y-4">
                <li><a href="#beranda" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Beranda Utama</a></li>
                <li><a href="#solusi" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Solusi Enterprise</a></li>
                <li><a href="#cara-kerja" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Cara Kerja Platform</a></li>
                <li><a href="#tentang-kami" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Tentang Kami</a></li>
              </ul>
            </div>

            {/* Column 4: Bantuan & Akses */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6">Bantuan & Akses</h4>
              <ul className="space-y-4">
                <li><Link to="/support" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Pusat Bantuan CS</Link></li>
                <li><Link to="/users" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Manajemen Pengguna</Link></li>
                <li><Link to="/register" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Daftar Organisasi</Link></li>
                <li><Link to="/login" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Portal Login Anggota</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">
                © 2026 Orbitani Corp
              </p>
              <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
              <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">
                Supported by{' '}
                <a href="https://kodinginaja.biz.id/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold transition-colors">
                  Kodinginaja
                </a>
              </p>
            </div>
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
