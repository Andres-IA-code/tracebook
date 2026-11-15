import { useRef, useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moveEvidence, type Evidence } from "@/lib/finding-details";

export function FindingEvidence({ items, onChange }: { items: Evidence[]; onChange?: (items: Evidence[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Evidence | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  async function attach(files: File[]) {
    if (!onChange || loading) return;
    setLoading(true); setError("");
    const added: Evidence[] = []; const rejected: string[] = [];
    for (const file of files) {
      if (!["image/png", "image/jpeg"].includes(file.type)) { rejected.push(file.name); continue; }
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader(); reader.onerror = () => reject(new Error("lectura"));
          reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("lectura"));
          reader.readAsDataURL(file);
        });
        await new Promise<void>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(); image.onerror = () => reject(new Error("imagen")); image.src = dataUrl; });
        added.push({ id: crypto.randomUUID(), name: file.name, dataUrl, caption: "" });
      } catch { rejected.push(file.name); }
    }
    if (added.length) onChange([...items, ...added]);
    if (rejected.length) setError(`No se pudieron adjuntar: ${rejected.join(", ")}. Solo se admiten imágenes PNG/JPG válidas.`);
    setLoading(false);
  }
  return <div className="finding-evidences">
    {onChange && <div className={`evidence-dropzone${dragging ? " dragging" : ""}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void attach(Array.from(e.dataTransfer.files)); }}>
      <input ref={input} type="file" accept="image/png,image/jpeg" multiple hidden aria-label="Adjuntar evidencias" onChange={e => { void attach(Array.from(e.target.files ?? [])); e.target.value = ""; }}/>
      <Button type="button" variant="outline" disabled={loading} onClick={() => input.current?.click()}><Upload/>{loading ? "Adjuntando…" : "Adjuntar imágenes"}</Button><small>PNG / JPG</small>
    </div>}
    {error && <p role="alert">{error}</p>}
    {!items.length && <p className="field-help">Sin evidencias adjuntas</p>}
    <div className="evidence-gallery">{items.map((item, index) => <figure key={item.id}>
      <Button type="button" variant="ghost" className="evidence-thumbnail" aria-label={`Ampliar ${item.name}`} onClick={() => setPreview(item)}><img src={item.dataUrl} alt={item.caption || item.name}/></Button>
      <figcaption>{onChange ? <label className="form-field">Pie de foto<input aria-label={`Pie de foto de ${item.name}`} value={item.caption} onChange={e => onChange(items.map(x => x.id === item.id ? { ...x, caption: e.target.value } : x))}/></label> : <span>{item.caption || item.name}</span>}</figcaption>
      {onChange && <div className="evidence-actions"><Button type="button" variant="outline" size="icon" title="Mover antes" aria-label={`Mover antes ${item.name}`} disabled={index === 0} onClick={() => onChange(moveEvidence(items, item.id, -1))}><ArrowUp/></Button><Button type="button" variant="outline" size="icon" title="Mover después" aria-label={`Mover después ${item.name}`} disabled={index === items.length - 1} onClick={() => onChange(moveEvidence(items, item.id, 1))}><ArrowDown/></Button><Button type="button" variant="outline" size="icon" title="Eliminar evidencia" aria-label={`Eliminar evidencia ${item.name}`} onClick={() => onChange(items.filter(x => x.id !== item.id))}><Trash2/></Button></div>}
    </figure>)}</div>
    {preview && <div className="modal-backdrop evidence-preview" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setPreview(null); }} onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); setPreview(null); } }}><section className="modal evidence-full" role="dialog" aria-modal="true" aria-label={preview.name}><div className="modal-head"><h2>{preview.name}</h2><Button type="button" variant="ghost" size="icon" autoFocus aria-label="Cerrar imagen" onClick={() => setPreview(null)}><X/></Button></div><div className="evidence-full-image"><img src={preview.dataUrl} alt={preview.caption || preview.name}/></div><p>{preview.caption}</p></section></div>}
  </div>;
}

export function TechnicalDetailView({ value }: { value: { description?: string; affectedAsset?: string; impact?: string; reproductionSteps?: string; recommendation?: string; references?: string[] } }) {
  return <div className="technical-detail">{[["Activo afectado", value.affectedAsset], ["Descripción", value.description], ["Impacto", value.impact], ["Pasos para reproducir", value.reproductionSteps], ["Recomendación", value.recommendation]].filter(([label]) => value.affectedAsset !== undefined || !["Activo afectado", "Pasos para reproducir"].includes(label ?? "")).map(([label, content]) => <div key={label}><div className="field-title">{label}</div><div className="text-box">{content || "Sin completar"}</div></div>)}<div><div className="field-title">Referencias</div>{value.references?.length ? <ul className="finding-references">{value.references.map((reference, index) => <li key={index}>{reference}</li>)}</ul> : <div className="text-box">Sin referencias</div>}</div></div>;
}