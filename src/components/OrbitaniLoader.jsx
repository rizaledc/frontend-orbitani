/**
 * OrbitaniLoader — Reusable bouncing dots loader with red-yellow-green sequence.
 *
 * @param {string}  className   Extra wrapper classes
 * @param {'sm'|'md'|'lg'} size  Dot size preset (default: 'md')
 */
export default function OrbitaniLoader({ className = '', size = 'md' }) {
  const sizeMap = { sm: 'h-1.5 w-1.5', md: 'h-3 w-3', lg: 'h-5 w-5' };
  const dot = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex space-x-2 justify-center items-center ${className}`}>
      <div
        className={`${dot} bg-red-500 rounded-full animate-bounce`}
        style={{ animationDelay: '0ms' }}
      />
      <div
        className={`${dot} bg-yellow-500 rounded-full animate-bounce`}
        style={{ animationDelay: '150ms' }}
      />
      <div
        className={`${dot} bg-green-500 rounded-full animate-bounce`}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}
