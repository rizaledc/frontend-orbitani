import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, User, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser } from '../../services/authService';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await loginUser({ username, password });

      // Save token first so Axios interceptor immediately uses it for the next request
      localStorage.setItem('orbitani_token', data.access_token);
      
      // IMMEDIATELY fetch user profile via the /me endpoint
      const profile = await api.get('/api/auth/me');
      
      // Store both profile data and token into zustand memory
      login(profile.data, data.access_token);

      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 400) {
        toast.error('Username atau Password Salah.');
      } else if (status === 422) {
        const detail = err.response?.data?.detail;
        const msg = Array.isArray(detail)
          ? detail.map((e) => e.msg || e.message).join('; ')
          : (typeof detail === 'string' ? detail : 'Format payload tidak valid.');
        toast.error(msg);
      } else if (!err.response) {
        toast.error('Kendala Server. Tidak dapat terhubung ke backend.');
      } else {
        const msg = err.response?.data?.detail || 'Gagal melakukan login. Silakan coba lagi.';
        toast.error(typeof msg === 'string' ? msg : 'Gagal melakukan login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-gray-950 transition-colors duration-300 animate-fade-in">

      {/* ──── LEFT PANEL (Animated Hero) 50% ──── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 items-center justify-center overflow-hidden">
        {/* Animated decorative shapes */}
        <div className="absolute top-1/4 -left-12 w-96 h-96 bg-primary-100/50 dark:bg-primary-900/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-secondary/10 dark:bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Brand Content */}
        <div className="relative z-10 text-center max-w-sm px-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <Leaf className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4">Orbitani</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
            Platform Pertanian Cerdas Berbasis AI & Remote Sensing untuk ekosistem pertanian modern.
          </p>
        </div>
      </div>

      {/* ──── RIGHT PANEL (Login Form) 50% ──── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-start relative px-6 py-8 sm:px-12 bg-white dark:bg-gray-950">

        {/* Back Button (Top Left) */}
        <div className="w-full max-w-md mx-auto mb-8 sm:mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
          >
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors shadow-sm">
              <ArrowLeft size={16} />
            </div>
            Kembali ke Beranda
          </Link>
        </div>

        {/* Card Shape container */}
        <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800 p-8 sm:p-10 mb-8">

          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-50 dark:bg-gray-800 rounded-2xl mb-4 shadow-sm border border-primary-100 dark:border-gray-700">
              <Leaf className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Orbitani</h1>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Masuk ke Akun</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Silakan masukkan kredensial Anda untuk melanjutkan ke dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="login-username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="masukkan username"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-900 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-900 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-6 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">atau</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
            Belum memiliki akun?{' '}
            <Link
              to="/register"
              className="text-primary font-bold hover:text-primary-hover transition-colors"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="w-full max-w-md mx-auto mt-auto pt-8">
          <p className="text-center text-xs text-gray-400 dark:text-gray-600">
            © 2026 Orbitani Corp — Support by{' '}
            <a href="https://kodinginaja.biz.id/" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-primary-light hover:underline font-bold transition-colors">
              Kodinginaja
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
