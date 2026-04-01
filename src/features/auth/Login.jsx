import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser } from '../../services/authService';
import useAuthStore from '../../store/authStore';

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
    console.log("Mencoba login ke Azure...");
    try {
      const data = await loginUser({ username, password });
      console.log("Response Backend:", data);
      
      localStorage.setItem('orbitani_token', data.access_token);
      login(data.user, data.access_token);
      
      console.log("Login Berhasil, Token Tersimpan!");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-light to-accent/30 px-4 py-8">
      {/* Decorative floating shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Orbitani</h1>
          <p className="text-white/70 text-sm mt-1">Platform Pertanian Cerdas Berbasis AI & Satelit</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-text">Selamat Datang</h2>
            <p className="text-gray-500 text-sm mt-1">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-neutral-text mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="masukkan username"
                  className="w-full pl-11 pr-4 py-3 bg-neutral rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-neutral-text mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-neutral rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">atau</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-500">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="text-primary font-semibold hover:text-primary-light transition-colors"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/50 mt-6">
          © 2026 Orbitani — Powered by AI & Google Earth Engine
        </p>
      </div>
    </div>
  );
};

export default Login;
