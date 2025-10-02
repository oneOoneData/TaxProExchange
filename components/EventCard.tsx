export default function EventCard({ e }:{ e:any }) {
  const dt = new Date(e.start_date);
  const when = dt.toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" });
  const where = e.location_state ? `${e.location_city ? e.location_city + ", " : ""}${e.location_state}` : "Virtual / Online";
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white">
      <div className="text-sm opacity-70">{when} • {where}</div>
      <h3 className="text-lg font-semibold mt-1">{e.title}</h3>
      {e.description && <p className="text-sm mt-1 line-clamp-3">{e.description}</p>}
      <div className="flex flex-wrap gap-2 mt-2">
        {(e.tags ?? []).map((t:string)=>(<span key={t} className="px-2 py-0.5 rounded-full border text-xs">{t.replace("software_","")}</span>))}
      </div>
      <a href={e.url} target="_blank" className="inline-block mt-3 text-sm underline">View / Register</a>
    </div>
  );
}
