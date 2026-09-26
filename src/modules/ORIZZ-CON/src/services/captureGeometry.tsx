/**
 * Cattura lo schema di "Configurazione geometrica" come immagine PNG,
 * renderizzandolo offscreen (funziona anche se lo step 3 non è a video).
 */
import { createRoot } from 'react-dom/client';
import GeometrySchema from '../controllers/components/GeometrySchema';
import type { TankInput } from '../models/types';

export interface GeometryImage {
  dataUrl: string;
  width: number;
  height: number;
}

const rasterize = async (svg: SVGSVGElement): Promise<GeometryImage | null> => {
  const vb = svg.viewBox.baseVal;
  const w = vb && vb.width ? vb.width : svg.clientWidth || 900;
  const h = vb && vb.height ? vb.height : svg.clientHeight || 600;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  clone.removeAttribute('class');

  // I foreignObject contengono <input>: in fase di rasterizzazione non vengono
  // disegnati, quindi li sostituisco con testo SVG equivalente.
  const originals = Array.from(svg.querySelectorAll('foreignObject'));
  const clones = Array.from(clone.querySelectorAll('foreignObject'));
  clones.forEach((fo, i) => {
    const src = originals[i];
    const inputEl = src?.querySelector('input') as HTMLInputElement | null;
    const selectEl = src?.querySelector('select') as HTMLSelectElement | null;
    const unit = selectEl ? '' : (src?.querySelector('span')?.textContent?.trim() ?? '');
    const value = selectEl
      ? (selectEl.selectedOptions[0]?.textContent ?? selectEl.value ?? '')
      : (inputEl?.value ?? '');
    const x = Number(fo.getAttribute('x') ?? 0);
    const y = Number(fo.getAttribute('y') ?? 0);
    const foW = Number(fo.getAttribute('width') ?? 86) || 86;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(x + 1));
    rect.setAttribute('y', String(y + 1));
    rect.setAttribute('width', String(foW - 2));
    rect.setAttribute('height', '17');
    rect.setAttribute('rx', '3');
    rect.setAttribute('fill', '#ffffff');
    rect.setAttribute('stroke', '#94a3b8');
    rect.setAttribute('stroke-width', '1');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(x + 5));
    text.setAttribute('y', String(y + 13.5));
    const label = unit ? `${value} ${unit}` : value;
    // riduce il corpo del testo se l'etichetta e' troppo lunga per il riquadro
    const maxChars = Math.max(6, Math.floor((foW - 10) / 5.4));
    const fontSize = label.length > maxChars ? Math.max(6.5, (11 * maxChars) / label.length) : 11;
    text.setAttribute('font-size', String(Math.round(fontSize * 10) / 10));
    text.setAttribute('font-weight', '700');
    text.setAttribute('font-family', 'Helvetica, Arial, sans-serif');
    text.setAttribute('fill', '#0f172a');
    text.textContent = label;
    g.appendChild(rect);
    g.appendChild(text);
    fo.replaceWith(g);
  });

  // Sfondo bianco
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(w));
  bg.setAttribute('height', String(h));
  bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);

  const svgText = new XMLSerializer().serializeToString(clone);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;

  const img = new Image();
  const loaded = await new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
  if (!loaded) return null;

  const scale = 2.5;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return { dataUrl: canvas.toDataURL('image/png'), width: w, height: h };
};

export async function captureGeometryImage(input: TankInput): Promise<GeometryImage | null> {
  if (typeof document === 'undefined') return null;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;opacity:0;pointer-events:none;';
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(<GeometrySchema input={input} onChange={() => {}} />);
    await new Promise((r) => setTimeout(r, 150));
    // Il primo <svg> è l'icona di avviso: scelgo quello con il viewBox più grande.
    const svgs = Array.from(host.querySelectorAll('svg')) as SVGSVGElement[];
    const svg = svgs.sort(
      (a, b) => (b.viewBox?.baseVal?.width ?? 0) - (a.viewBox?.baseVal?.width ?? 0),
    )[0];
    if (!svg) return null;
    return await rasterize(svg);
  } catch (e) {
    console.error('Cattura schema geometrico fallita', e);
    return null;
  } finally {
    setTimeout(() => {
      root.unmount();
      host.remove();
    }, 0);
  }
}
