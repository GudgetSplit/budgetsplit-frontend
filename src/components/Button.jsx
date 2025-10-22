export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`w-full rounded-xl px-4 py-3 font-semibold text-white bg-[#06623B] active:scale-[0.99] disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}