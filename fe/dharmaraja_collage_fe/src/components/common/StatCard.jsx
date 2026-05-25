export default function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-5 text-center md:text-left shadow-lg transition-all hover:bg-white/10 hover:border-white/20">
      <p className="text-xs sm:text-sm text-white/50 font-medium tracking-wide uppercase">{title}</p>
      <h3 className="text-sm sm:text-xl md:text-2xl font-black mt-1.5 text-white truncate" title={value}>
        {value}
      </h3>
    </div>
  );
}