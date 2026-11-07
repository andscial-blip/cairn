export function Logo() {
  return (
    <svg className="logo" viewBox="0 0 40 40" aria-hidden="true">
      <defs><linearGradient id="cfg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#36475E" /><stop offset="1" stopColor="#2A374A" /></linearGradient></defs>
      <rect width="40" height="40" rx="9.5" fill="url(#cfg1)" />
      <path d="M27.66 13.57A10 10 0 1 0 27.66 26.43" fill="none" stroke="#C9D6EA" strokeWidth={5} />
      <path d="M28.66 15A10 10 0 0 1 28.66 25" fill="none" stroke="#E8BE5A" strokeWidth={5} />
    </svg>
  );
}
