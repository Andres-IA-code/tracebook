import { useState } from "react";
import { Calculator, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CVSS_METRICS, DEFAULT_METRICS, calculateCvss, parseVector, canonicalSeverity, type BaseMetrics } from "@/lib/cvss";

export function CvssBadge({ score, severity }: { score?: number | undefined; severity: string }) {
  const label = canonicalSeverity(severity);
  const tone = label === "Crítica" ? "critical" : label === "Alta" ? "high" : label === "Media" ? "medium" : label === "Baja" ? "low" : "info";
  return <span className={`severity cvss-badge cvss-${tone}`}>{score === undefined ? "" : `${score.toFixed(1)} · `}{label}</span>;
}

function CvssCalculator({ vector, apply, close }: { vector: string; apply: (score: number, vector: string) => void; close: () => void }) {
  const [metrics, setMetrics] = useState<BaseMetrics>(() => parseVector(vector) ?? { ...DEFAULT_METRICS });
  const result = calculateCvss(metrics);
  return <div className="modal-backdrop cvss-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) close(); }} onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); close(); } }}><section className="modal cvss-calculator" role="dialog" aria-modal="true" aria-label="Calculadora CVSS 3.1"><div className="modal-head"><h2>CVSS 3.1</h2><Button type="button" variant="ghost" size="icon" aria-label="Cerrar calculadora" onClick={close}><X/></Button></div><div className="cvss-calculator-body">
    <div className="cvss-result" aria-live="polite"><CvssBadge score={result.score} severity={result.severity}/><code>{result.vector}</code></div>
    <div className="cvss-metrics">{CVSS_METRICS.map(metric => <fieldset key={metric.key}><legend>{metric.label} ({metric.key})</legend><div>{metric.options.map(([value, label]) => <Button type="button" key={value} variant={metrics[metric.key] === value ? "default" : "outline"} aria-pressed={metrics[metric.key] === value} onClick={() => setMetrics({ ...metrics, [metric.key]: value })}>{label}</Button>)}</div></fieldset>)}</div>
    <small>CVSS pertenece a FIRST y se utiliza con su autorización.</small><div className="modal-actions"><Button type="button" variant="outline" onClick={close}>Cancelar</Button><Button type="button" autoFocus onClick={() => { apply(result.score, result.vector); close(); }}>Aplicar</Button></div>
  </div></section></div>;
}

export function CvssFields({ cwe, score, vector, onCwe, onScore, onVector, onCalculate }: { cwe: string; score: string; vector: string; onCwe: (value: string) => void; onScore: (value: string) => void; onVector: (value: string) => void; onCalculate: (score: number, vector: string) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="cvss-fields"><div className="form-grid"><label className="form-field">CWE<input name="cwe" value={cwe} onChange={e => onCwe(e.target.value)} placeholder="CWE-89" pattern="CWE-[1-9][0-9]*" title="Usá el formato CWE-89"/></label><label className="form-field">CVSS · Puntuación<input name="cvssScore" type="number" min="0" max="10" step="0.1" value={score} onChange={e => onScore(e.target.value)}/></label></div><div className="cvss-vector-row"><label className="form-field">CVSS · Vector<input name="cvssVector" value={vector} onChange={e => onVector(e.target.value)} placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"/></label><Button type="button" variant="outline" onClick={() => setOpen(true)}><Calculator/>Calcular</Button></div>{open && <CvssCalculator vector={vector} apply={onCalculate} close={() => setOpen(false)}/>}</div>;
}

export function CvssDetail({ value }: { value: { cwe?: string; cvssScore?: number | undefined; cvssVector?: string; severity: string } }) {
  return <div className="cvss-detail"><div><div className="field-title">CWE</div><div className="text-box">{value.cwe || "Sin completar"}</div></div><div><div className="field-title">CVSS 3.1</div>{value.cvssScore === undefined ? <div className="text-box">Sin puntuación</div> : <CvssBadge score={value.cvssScore} severity={value.severity}/>}</div>{value.cvssVector && <code>{value.cvssVector}</code>}</div>;
}