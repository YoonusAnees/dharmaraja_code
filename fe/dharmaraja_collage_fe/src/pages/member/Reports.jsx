export default function Reports() {
  const reports = [
    {
      title: "Quarterly Financial Report",
      type: "Quarterly",
      url: "#",
    },
    {
      title: "Annual Financial Report",
      type: "Annual",
      url: "#",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">Financial Reports</h1>
        <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">
          View and download OBA financial transparency reports.
        </p>
      </div>

      <div className="space-y-4">
        {reports.map((report, index) => (
          <div
            key={index}
            className="rounded-2xl bg-white/5 border border-white/5 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/10 hover:border-white/10 transition-all shadow-md"
          >
            <div>
              <h3 className="font-bold text-gold text-sm sm:text-base">{report.title}</h3>
              <p className="text-white/40 text-xs mt-0.5">{report.type} Publication</p>
            </div>

            <a
              href={report.url}
              className="w-full sm:w-auto bg-gold hover:bg-gold-hover text-black text-center px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-gold/10"
            >
              Download PDF
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}