import { Link } from 'react-router-dom';
import { Leaf } from '@phosphor-icons/react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-6 animate-fade-in transition-colors duration-300">
      <div className="w-20 h-20 bg-primary-50 dark:bg-gray-800 border border-primary-100 dark:border-gray-700 rounded-3xl flex items-center justify-center mb-10 shadow-sm">
        <Leaf size={40} className="text-primary" weight="fill" />
      </div>
      
      <h1 className="text-8xl sm:text-9xl font-black text-gray-900 dark:text-white tracking-tighter mb-6 leading-none">
        404
      </h1>
      
      <p className="text-gray-500 dark:text-gray-400 text-lg sm:text-xl font-medium text-center max-w-sm mx-auto mb-12 leading-relaxed">
        Halaman tidak ditemukan atau Anda tidak memiliki akses ke area ini.
      </p>
      
      <Link 
        to="/dashboard" 
        className="inline-flex items-center justify-center bg-primary text-white font-bold rounded-2xl px-10 py-4 hover:bg-primary-hover hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20 active:scale-95 transition-all duration-300"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
};

export default NotFound;
