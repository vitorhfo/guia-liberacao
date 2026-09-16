import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Eye,
  GitBranch,
  ImageOff,
  Layers3,
  Lightbulb,
  Minus,
  Paintbrush,
  Ruler,
  ShieldCheck,
  SunMedium,
  ThermometerSun,
  X,
  ZoomIn,
} from 'lucide-react';

const classes = [
  { id: '1', label: 'Muito alta', detail: 'Visível no campo imediato de visão do observador.', example: 'Frente, painéis principais, regiões externas críticas', image: new URL('../img/classes/classe 1/classs1.png', import.meta.url).href, imageAlt: 'Área externa visível da máquina indicada em vermelho' },
  { id: '2', label: 'Média', detail: 'Visível, porém afastada do campo imediato de visão.', example: 'Áreas visíveis secundárias ou de observação eventual', image: new URL('../img/classes/classe2/class2.png', import.meta.url).href, imageAlt: 'Área lateral da máquina indicada em vermelho' },
  { id: '3', label: 'Baixa', detail: 'Não imediatamente visível.', example: 'Regiões internas, inferiores ou pouco aparentes', image: new URL('../img/classes/classe3/class3.png', import.meta.url).href, imageAlt: 'Área interna da máquina indicada em vermelho' },
  { id: '4', label: 'Oculta', detail: 'Permanentemente oculta após montagem.', example: 'Áreas internas cobertas ou escondidas', image: null, imageAlt: null },
];

const defects = [
  ['Escorrido de tinta', ['✕', '!', '!', '✓']],
  ['Sujeira', ['✕', '!', '✓', '✓']],
  ['Casca de laranja', ['✕', '!', '✓', '✓']],
  ['Contaminação', ['✕', '!', '!', '—']],
  ['Ferrugem', ['✕', '!', '—', '—']],
  ['Risco', ['✕', '!', '✓', '✓']],
  ['Marca de lixamento', ['✕', '!', '!', '✓']],
  ['Poros', ['✕', '!', '✓', '✓']],
  ['Bolhas', ['✕', '✕', '!', '✓']],
  ['Falha de pintura', ['✕', '✕', '!', '✓']],
  ['Diferença da coloração', ['✕', '!', '—', '—']],
  ['Mapeamento da chapa', ['✕', '!', '✓', '✓']],
];

const visibilityLevels = [
  {
    id: 'pouco',
    label: 'Pouco visível',
    code: 'I',
    standard: 'Praticamente invisível',
    detail: 'Só é percebido durante a inspeção visual controlada.',
  },
  {
    id: 'visivel',
    label: 'Visível',
    code: 'II',
    standard: 'Muito pouco visível',
    detail: 'É percebido de forma leve nas condições de inspeção.',
  },
  {
    id: 'muito',
    label: 'Muito visível',
    code: 'III',
    standard: 'Claramente visível',
    detail: 'É evidente para o inspetor nas condições de inspeção.',
  },
];

const visualDecisionRows = [
  { id: 'pouco', group: 'A / B', range: 'Faixa inicial da escala', decision: 'Libera se a célula for ✓' },
  { id: 'visivel', group: 'C / D', range: 'Faixa intermediária', decision: 'Libera se a célula for ✓' },
  { id: 'muito', group: 'E / F', range: 'Faixa final da escala', decision: 'Não liberar' },
];

const measurementScales = {
  dirt: {
    label: 'Tamanho da partícula',
    bands: [{ group: 'A', max: 1 }, { group: 'B', max: 2 }, { group: 'C/D', max: 3 }, { group: 'E', max: 5 }, { group: 'F', max: 10 }], visibleEnd: 2,
  },
  scratch: {
    label: 'Comprimento do risco',
    bands: [{ group: 'A', max: 0.5 }, { group: 'B', max: 1 }, { group: 'C/D', max: 2 }, { group: 'E', max: 10 }, { group: 'F', max: 20 }], visibleEnd: 2,
  },
  run: {
    label: 'Extensão do escorrido',
    bands: [{ group: 'A', max: 0.3 }, { group: 'B', max: 1 }, { group: 'C', max: 5 }, { group: 'D', max: 10 }, { group: 'E', max: 20 }, { group: 'F', max: 30 }], visibleEnd: 3,
  },
};

function likelyMeasurementRange(scale, visibility) {
  if (!scale) return null;
  const ranges = {
    pouco: { start: 0, end: 1, label: 'A/B' },
    visivel: { start: 2, end: scale.visibleEnd, label: 'C/D' },
    muito: { start: scale.visibleEnd + 1, end: scale.bands.length - 1, label: 'E/F' },
  };
  const range = ranges[visibility];
  const first = scale.bands[range.start];
  const last = scale.bands[range.end];
  return {
    group: range.label,
    text: range.start === 0 ? `até ${last.max} mm` : `acima de ${scale.bands[range.start - 1].max} até ${last.max} mm`,
    first,
    last,
  };
}

const defectCriteria = {
  'Escorrido de tinta': { type: 'Mensurável', reference: 'Escorridos e gotas', detail: 'Meça a extensão em mm conforme a tabela de defeitos mensuráveis.', measurement: 'run' },
  Sujeira: { type: 'Mensurável', reference: 'Sujeira e fibras', detail: 'Meça o tamanho da partícula em mm conforme a tabela de defeitos mensuráveis.', measurement: 'dirt' },
  'Casca de laranja': { type: 'Visual', reference: 'Acabamento textural', detail: 'Não aparece nominalmente na tabela; compare com o padrão aprovado e a especificação aplicável.' },
  Contaminação: { type: 'Mensurável', reference: 'Sujeira e fibras', detail: 'Quando houver partícula no filme, meça o tamanho em mm; para outra contaminação, consulte a especificação.', measurement: 'dirt' },
  Ferrugem: { type: 'Específico', reference: 'Especificação aplicável', detail: 'A aceitação de corrosão deve seguir os documentos técnicos e normas específicas do produto.' },
  Risco: { type: 'Mensurável', reference: 'Risco superficial', detail: 'Meça o comprimento do risco em mm conforme a tabela de defeitos mensuráveis.', measurement: 'scratch' },
  'Marca de lixamento': { type: 'Visual', reference: 'Marca de lixamento isolada', detail: 'Avalie pela escala visual I, II ou III da tabela de defeitos não mensuráveis.' },
  Poros: { type: 'Visual', reference: 'Poros e pinholes', detail: 'Avalie pela escala visual I, II ou III da tabela de defeitos não mensuráveis.' },
  Bolhas: { type: 'Visual', reference: 'Bolhas', detail: 'Avalie pela escala visual I, II ou III da tabela de defeitos não mensuráveis.' },
  'Falha de pintura': { type: 'Específico', reference: 'Cobertura e proteção', detail: 'Compare com a especificação da peça, pois a falha pode comprometer a proteção do substrato.' },
  'Diferença da coloração': { type: 'Visual', reference: 'Desvio de cor', detail: 'Avalie pela escala visual I, II ou III da tabela de defeitos não mensuráveis.' },
  'Mapeamento da chapa': { type: 'Visual', reference: 'Flamagem / aparência não uniforme', detail: 'Avalie pela escala visual I, II ou III da tabela de defeitos não mensuráveis.' },
};

const nav = [
  { label: 'Início', Icon: ShieldCheck },
  { label: 'Fluxo', Icon: GitBranch },
  { label: 'Condições', Icon: SunMedium },
  { label: 'Classes', Icon: Layers3 },
  { label: 'Matriz', Icon: ClipboardCheck },
  { label: 'Atenção', Icon: AlertTriangle },
  { label: 'Exemplos', Icon: ImageOff },
];

const defectGalleries = [
  {
    label: 'Contaminação',
    images: [
      new URL('../img/defeitos/contaminacao/IMG-20260627-WA0009.jpg', import.meta.url).href,
      new URL('../img/defeitos/contaminacao/IMG-20260627-WA0010.jpg', import.meta.url).href,
      new URL('../img/defeitos/contaminacao/IMG-20260627-WA0011.jpg', import.meta.url).href,
      new URL('../img/defeitos/contaminacao/IMG-20260627-WA0012.jpg', import.meta.url).href,
    ],
  },
  {
    label: 'Falha de cobertura',
    images: [
      new URL('../img/defeitos/falhaDeCobertura/IMG-20260720-WA0073.jpeg', import.meta.url).href,
      new URL('../img/defeitos/falhaDeCobertura/Imagem2-final.jpg', import.meta.url).href,
      new URL('../img/defeitos/falhaDeCobertura/Imagem3-final.jpg', import.meta.url).href,
    ],
  },
  {
    label: 'Desplacamento',
    images: [
      new URL('../img/defeitos/desplacamento/Imagem4-tratada.png', import.meta.url).href,
      new URL('../img/defeitos/desplacamento/Imagem5-tratada.png', import.meta.url).href,
      new URL('../img/defeitos/desplacamento/Imagem6-final.jpg', import.meta.url).href,
      new URL('../img/defeitos/desplacamento/Imagem7-tratada.png', import.meta.url).href,
    ],
  },
  {
    label: 'Ferrugem',
    images: [
      new URL('../img/defeitos/ferrugem/IMG-20260611-WA0043.jpeg', import.meta.url).href,
      new URL('../img/defeitos/ferrugem/IMG-20260613-WA0010.jpeg', import.meta.url).href,
      new URL('../img/defeitos/ferrugem/IMG-20260615-WA0056.jpeg', import.meta.url).href,
      new URL('../img/defeitos/ferrugem/IMG-20260617-WA0028.jpg', import.meta.url).href,
      new URL('../img/defeitos/ferrugem/IMG-20260810-WA0050.jpeg', import.meta.url).href,
    ],
  },
  {
    label: 'Fervura',
    images: [
      new URL('../img/defeitos/fervura/IMG-20260711-WA0004.jpeg', import.meta.url).href,
      new URL('../img/defeitos/fervura/IMG-20260721-WA0004(1).jpg', import.meta.url).href,
      new URL('../img/defeitos/fervura/IMG-20260725-WA0037.jpg', import.meta.url).href,
      new URL('../img/defeitos/fervura/IMG-20260730-WA0038.jpg', import.meta.url).href,
      new URL('../img/defeitos/fervura/IMG-20260820-WA0001.jpg', import.meta.url).href,
    ],
  },
  {
    label: 'Sujeira',
    images: [
      new URL('../img/defeitos/sujeira/IMG-20260723-WA0002.jpg', import.meta.url).href,
      new URL('../img/defeitos/sujeira/IMG-20260730-WA0030.jpg', import.meta.url).href,
      new URL('../img/defeitos/sujeira/IMG-20260730-WA0031.jpg', import.meta.url).href,
      new URL('../img/defeitos/sujeira/Imagem1-tratada.jpg', import.meta.url).href,
    ],
  },
];

function Status({ value }) {
  const status = {
    '✓': { label: 'Pode liberar', Icon: Check },
    '!': { label: 'Avaliar', Icon: CircleHelp },
    '✕': { label: 'Reprovar', Icon: X },
    '—': { label: 'Consultar norma', Icon: Minus },
  }[value];
  const Icon = status.Icon;
  return <span className={`status status-${value}`} title={status.label} aria-label={status.label}><Icon size={15} strokeWidth={3} /></span>;
}

function SectionHeader({ eyebrow, title, text }) {
  return <header className="section-header">
    <span className="eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    {text && <p>{text}</p>}
  </header>;
}

function FooterRule() {
  return <p className="footer-rule">QUALIDADE É CONFORMIDADE <span>•</span> CONSULTE SEMPRE O DESENHO TÉCNICO E A INSTRUÇÃO APLICÁVEL</p>;
}

function App() {
  const [active, setActive] = useState(0);
  const [selectedClass, setSelectedClass] = useState('1');
  const [hoveredClass, setHoveredClass] = useState(null);
  const [classPreviewPosition, setClassPreviewPosition] = useState({ x: 0, y: 0 });
  const classHoverTimer = useRef(null);
  const [selectedDefect, setSelectedDefect] = useState('Escorrido de tinta');
  const [selectedVisibility, setSelectedVisibility] = useState('pouco');
  const [showChecklist, setShowChecklist] = useState(false);
  const [openGallery, setOpenGallery] = useState(null);
  const [expandedGalleryImage, setExpandedGalleryImage] = useState(null);
  const sections = useMemo(() => ['inicio', 'fluxo', 'condicoes', 'classes', 'matriz', 'atencao', 'exemplos'], []);

  const go = (index) => {
    const next = Math.max(0, Math.min(sections.length - 1, index));
    setActive(next);
  };

  const startClassPreview = (id, event) => {
    setClassPreviewPosition({ x: event.clientX, y: event.clientY });
    window.clearTimeout(classHoverTimer.current);
    classHoverTimer.current = window.setTimeout(() => setHoveredClass(id), 550);
  };

  const stopClassPreview = () => {
    window.clearTimeout(classHoverTimer.current);
    setHoveredClass(null);
  };

  useEffect(() => {
    const onKey = (event) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
      if (openGallery) {
        if (event.key === 'Escape') { setOpenGallery(null); setExpandedGalleryImage(null); }
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') go(active + 1);
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') go(active - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, openGallery]);

  useEffect(() => () => window.clearTimeout(classHoverTimer.current), []);

  const row = defects.find(([name]) => name === selectedDefect);
  const matrixOutcome = row?.[1][Number(selectedClass) - 1] ?? '—';
  const defectCriterion = defectCriteria[selectedDefect] ?? defectCriteria['Falha de pintura'];
  const visibility = visibilityLevels.find((item) => item.id === selectedVisibility) ?? visibilityLevels[0];
  const measurementScale = measurementScales[defectCriterion.measurement];
  const likelyRange = likelyMeasurementRange(measurementScale, selectedVisibility);
  const canRelease = matrixOutcome === '✓' && selectedVisibility !== 'muito';
  const outcome = canRelease ? '✓' : '✕';
  const outcomeText = canRelease ? 'Pode liberar' : 'Não pode liberar';
  const outcomeDetail = measurementScale
    ? `${visibility.label}: provavelmente se enquadra no grupo ${likelyRange.group}, ${likelyRange.text}. ${canRelease ? 'Pode liberar pela regra direta.' : 'Não libera pela regra direta.'}`
    : `${visibility.code} — ${visibility.standard}. ${canRelease ? 'Pode liberar pela regra direta.' : 'Não libera pela regra direta.'} ${defectCriterion.detail}`;
  const displayClass = classes.find((item) => item.id === selectedClass) ?? classes[0];
  const previewClass = classes.find((item) => item.id === hoveredClass);
  const previewStyle = previewClass ? {
    '--class-color': `var(--class-${previewClass.id})`,
    left: Math.max(16, Math.min(classPreviewPosition.x + 20, window.innerWidth - 336)),
    top: Math.max(80, Math.min(classPreviewPosition.y + 20, window.innerHeight - 314)),
  } : undefined;

  return (
    <main>
      <nav className="topbar" aria-label="Navegação da apresentação">
        <button className="brand" onClick={() => go(0)} aria-label="Voltar ao início"><span><ShieldCheck size={16} /></span> GUIA DE QUALIDADE</button>
        <div className="nav-links">
          {nav.map(({ label, Icon }, index) => <button key={label} className={active === index ? 'active' : ''} onClick={() => go(index)}><Icon size={14} /><span>{label}</span><i /></button>)}
        </div>
        <span className="slide-counter">{String(active + 1).padStart(2, '0')} / 07</span>
      </nav>

      <aside className="slide-rail" aria-label="Paginação lateral">
        {nav.map(({ label, Icon }, index) => <button key={label} className={active === index ? 'active' : ''} onClick={() => go(index)} aria-label={`Ir para ${label}`}><span>{String(index + 1).padStart(2, '0')}</span><i /><Icon size={15} /></button>)}
      </aside>

      <section id="inicio" className={`hero presentation-section ${active === 0 ? 'section-active' : ''}`}>
        <div className="hero-photo" role="img" aria-label="Equipamento Volvo amarelo em campo" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="kicker">GUIA DE INSPEÇÃO</p>
          <h1>Requisitos de<br /><em>superfície pintada</em></h1>
          <p className="hero-copy">Critérios de avaliação visual aplicados após a pintura, incluindo classes e condições de inspeção.</p>
          <div className="hero-objective"><span>OBJETIVO DO MATERIAL</span><p>Padronizar as normas no setor, facilitando a identificação da classe, a avaliação do defeito e a tomada de decisão.</p></div>
          <button className="primary-button" onClick={() => go(1)}>Iniciar guia <ArrowDown size={18} /></button>
        </div>
        <FooterRule />
      </section>

      <section id="fluxo" className={`presentation-section flow-section ${active === 1 ? 'section-active' : ''}`}>
        <SectionHeader eyebrow="ITS" title="Fluxo integrado de inspeção" text="Como decidir usando as duas normas" />
        <div className="flow-layout">
          <div className="steps">
            <article className="step"><span>01</span><div><h3>Identifique a etapa</h3><p>Antes da pintura: <strong>ITS 176</strong></p><p>Depois da pintura: <strong>ITS 177</strong></p></div></article>
            <article className="step"><span>02</span><div><h3>Confirme a classe</h3><p>Verifique na ordem de produção: <strong>1, 2, 3 ou 4</strong>.</p></div></article>
            <article className="step"><span>03</span><div><h3>Decida</h3><p>Liberar, avaliar ou reprovar. Na dúvida, acionar Qualidade.</p></div></article>
          </div>
          <aside className="critical-note"><ShieldCheck size={43} strokeWidth={1.6} /><div><h3>Critérios que não podem ser esquecidos</h3><p><strong>Quantidade:</strong> verifique o nível do defeito e sua visibilidade conforme a classe.</p><p><strong>Função:</strong> não liberar se prejudicar montagem, função ou gerar corrosão.</p></div></aside>
        </div>
        <div className="warning-band">EM CASO DE DÚVIDA, NÃO LIBERAR AUTOMATICAMENTE. CONSULTAR A NORMA, O DESENHO OU O RESPONSÁVEL DA QUALIDADE.</div>
        <FooterRule />
      </section>

      <section id="condicoes" className={`presentation-section conditions-section ${active === 2 ? 'section-active' : ''}`}>
        <SectionHeader eyebrow="ITS 176 + ITS 177" title="Condições padrão de avaliação" text="A inspeção visual depende de condições controladas." />
        <div className="conditions-layout">
          <div className="condition-list">
            <div><b><ShieldCheck /></b><p><strong>Superfície limpa</strong><br />ITS 176: superfícies limpas. ITS 177: recém-pintadas.</p></div>
            <div><b><Lightbulb /></b><p><strong>Iluminação</strong><br />1500 a 2000 lux recomendados no local de inspeção.</p></div>
            <div><b><SunMedium /></b><p><strong>Luz difusa</strong><br />Iluminação uniforme, sem direção marcada.</p></div>
            <div><b><Ruler /></b><p><strong>Ângulo</strong><br />Avaliar preferencialmente em ângulo reto à superfície.</p></div>
            <div><b><Eye /></b><p><strong>Visão lateral</strong><br />Pode avaliar ligeiramente de lado para cobrir ângulos.</p></div>
            <div><b><Ruler /></b><p><strong>Distância</strong><br />Avaliar a 1 m de distância.</p></div>
          </div>
          <div className="area-rule"><img src="/assets/field.jpg" alt="Equipamento Volvo em ambiente industrial" /><div><span>AVALIAÇÃO EM ÁREA</span><p><strong>Classes 1</strong> Máximo de 2 defeitos<br /><i>Praticamente invisível</i></p><p><strong>Classes 2</strong> Máximo de 3 defeitos<br /><i>Pouco visível</i></p></div></div>
        </div>
        <div className="attention-message"><b>ATENÇÃO</b><span>DEFEITOS CLARAMENTE VISÍVEIS: REPROVAR</span></div>
        <p className="fine-print">Termos como “praticamente invisível”, “muito pouco visível” e “claramente visível” dependem da avaliação de inspetor experiente.</p>
        <FooterRule />
      </section>

      <section id="classes" className={`presentation-section classes-section ${active === 3 ? 'section-active' : ''}`}>
        <SectionHeader eyebrow="02" title="Classificação das superfícies" text="Passe o mouse sobre uma classe para ver onde a peça fica na máquina." />
        <div className="class-scale" aria-label="Escala de exigência estética">
          {classes.map((item, index) => <button key={item.id} className={`class-item class-${item.id} ${selectedClass === item.id ? 'selected' : ''}`} onClick={(event) => { setSelectedClass(item.id); startClassPreview(item.id, event); }} onPointerDown={(event) => { if (event.pointerType !== 'mouse') { setClassPreviewPosition({ x: event.clientX, y: event.clientY }); setHoveredClass(item.id); } }} onMouseEnter={(event) => { if (item.id === selectedClass) startClassPreview(item.id, event); }} onMouseMove={(event) => { if (item.id === selectedClass) setClassPreviewPosition({ x: event.clientX, y: event.clientY }); }} onMouseLeave={stopClassPreview} onBlur={stopClassPreview}><span className="class-number">{item.id}</span><span className="class-label">{item.label}</span><small>{index === 0 ? 'MAIOR EXIGÊNCIA ESTÉTICA' : index === 3 ? 'MENOR EXIGÊNCIA ESTÉTICA' : ''}</small></button>)}
        </div>
        <div className="class-details">
          <article className={`visible class-detail-${displayClass.id}`} style={{ '--class-color': `var(--class-${displayClass.id})` }}><span>CLASSE {displayClass.id}</span><h3>{displayClass.label}</h3><p>{displayClass.detail}</p><p className="example"><b>Exemplo de aplicação</b>{displayClass.example}</p></article>
        </div>
        {previewClass && <aside className="class-hover-popup" style={previewStyle}><div className="class-hover-popup-title"><span>CLASSE {previewClass.id}</span><strong>{previewClass.label}</strong></div>{previewClass.image ? <img src={previewClass.image} alt={previewClass.imageAlt} /> : <div className="class-hover-popup-hidden"><Eye size={34} /><span>Oculta após a montagem</span></div>}<p>{previewClass.image ? 'Local da peça indicado na máquina.' : 'Esta região não fica visível após a montagem.'}</p></aside>}
        <FooterRule />
      </section>

      <section id="matriz" className={`presentation-section matrix-section ${active === 4 ? 'section-active' : ''}`}>
        <SectionHeader eyebrow="02.2" title="Defeitos e classes" text="Clique numa linha da matriz e registre a visibilidade observada para consultar o resultado." />
        <div className="matrix-wrap"><table><thead><tr><th>DEFEITO</th>{classes.map((item) => <th key={item.id}>CLASSE {item.id}</th>)}</tr></thead><tbody>{defects.map(([name, results]) => <tr key={name} className={selectedDefect === name ? 'chosen' : ''} onClick={() => setSelectedDefect(name)}>{<th>{name}</th>}{results.map((result, index) => <td key={`${name}-${index}`}><Status value={result} /></td>)}</tr>)}<tr className="matrix-visual-heading"><th colSpan="5">REGRA VISUAL VOLVO — CLIQUE EM UMA LINHA PARA USAR NA CONSULTA</th></tr>{visualDecisionRows.map((row) => { const item = visibilityLevels.find((level) => level.id === row.id); return <tr key={row.id} className={`matrix-visual-row ${row.id} ${selectedVisibility === row.id ? 'selected' : ''}`} onClick={() => setSelectedVisibility(row.id)}><th><b>{item.code}</b>{item.label}</th><td>{row.group}</td><td colSpan="2">{row.range}</td><td><strong>{row.decision}</strong></td></tr>; })}</tbody></table></div>
        <div className="legend"><span><Status value="✓" /> PODE LIBERAR</span><span><Status value="!" /> AVALIAR</span><span><Status value="✕" /> REPROVAR</span><span><Status value="—" /> CONSULTAR NORMA</span></div>
        <div className="decision-tool">
          <div className="decision-intro"><span className="eyebrow">DECISÃO DIRETA</span><h3>Pode liberar ou não?</h3><p>Informe como o defeito aparece. A consulta mostra a faixa provável em milímetros quando houver escala Volvo.</p></div>
          <label>Defeito<select value={selectedDefect} onChange={(event) => setSelectedDefect(event.target.value)}>{defects.map(([name]) => <option key={name}>{name}</option>)}</select></label>
          <label>Classe<select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>{classes.map((item) => <option key={item.id} value={item.id}>{item.id} — {item.label}</option>)}</select></label>
          <label>Visibilidade<select value={selectedVisibility} onChange={(event) => setSelectedVisibility(event.target.value)}>{visibilityLevels.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.code}</option>)}</select></label>
          <div className={`outcome outcome-${outcome}`}><Status value={outcome} /><strong>{outcomeText}</strong><span>{selectedDefect} · Classe {selectedClass}</span></div>
          <div className={`criterion-note criterion-${defectCriterion.type.toLowerCase()}`}><span>{likelyRange ? `${likelyRange.group} · FAIXA PROVÁVEL` : defectCriterion.type === 'Visual' ? `ESCALA ${visibility.code}` : defectCriterion.type.toUpperCase()}</span><strong>{defectCriterion.reference}</strong><p>{outcomeDetail}</p></div>
        </div>
        <p className="fine-print">Padrão direto do guia: grupos A/B representam pouco visível; C/D representam visível; E/F representam muito visível. Para defeitos mensuráveis, a consulta apresenta uma faixa provável da tabela Volvo; a medição real em mm deve confirmar o enquadramento. A liberação depende da célula “Pode liberar” na matriz e defeitos muito visíveis não liberam pela regra direta.</p>
        <FooterRule />
      </section>

      <section id="atencao" className={`presentation-section attention-section ${active === 5 ? 'section-active' : ''}`}>
        <SectionHeader eyebrow="03" title="Pontos de atenção" text="Todos os exemplos abaixo são casos de reprova." />
        <div className="attention-grid">
          <article className="attention-card photo-card"><img src="/assets/weld.jpg" alt="Ponto de solda e canto de peça" /><p>Olhar com atenção as bordas, quinas internas e regiões onde a tinta tende a acumular.</p></article>
          <article className="attention-card photo-card"><img src="/assets/bubbles.jpg" alt="Peça pintada com bolhas" /><p>Verificar locais onde a peça foi apoiada, pendurada ou tocada durante o processo.</p></article>
          <article className="attention-card"><Paintbrush className="card-icon" size={38} /><h3>Falhas e resíduos</h3><p>Verificar se contém falhas de pintura e resíduos na peça, como sujeira.</p></article>
          <article className="attention-card"><ThermometerSun className="card-icon" size={38} /><h3>Forno e camadas</h3><p>Verificar a temperatura e a velocidade do forno, além do nível de camadas, para evitar desplacamento.</p></article>
          <article className="attention-card"><Eye className="card-icon" size={38} /><h3>Cor e brilho</h3><p>Verificar desvios de cor e brilho, bem como respingos na superfície.</p></article>
        </div>
        <button className="checklist-toggle" onClick={() => setShowChecklist(!showChecklist)}>{showChecklist ? 'Ocultar checklist' : 'Abrir checklist de inspeção'} <span>{showChecklist ? '−' : '+'}</span></button>
        {showChecklist && <div className="checklist"><label><input type="checkbox" /> Bordas, quinas internas e áreas de acúmulo verificadas</label><label><input type="checkbox" /> Pontos de apoio, gancho ou contato verificados</label><label><input type="checkbox" /> Falhas, sujeira, cor, brilho e respingos verificados</label><label><input type="checkbox" /> Condições de forno e camadas verificadas</label></div>}
        <FooterRule />
      </section>

      <section id="exemplos" className={`presentation-section examples-section ${active === 6 ? 'section-active' : ''}`}>
        <SectionHeader eyebrow="03.2" title="Exemplos de não conformidades" text="Selecione um problema para abrir todas as fotos registradas." />
        <div className="gallery defect-gallery">
          {defectGalleries.map((gallery) => <button key={gallery.label} className="defect-gallery-card" onClick={() => { setOpenGallery(gallery); setExpandedGalleryImage(null); }}>
            <img src={gallery.images[0]} alt={`Exemplo de ${gallery.label.toLowerCase()}`} />
            <span className="defect-gallery-shade" />
            <span className="defect-gallery-meta"><span><X size={14} /> REPROVAR</span><strong>{gallery.label}</strong><small>{gallery.images.length} {gallery.images.length === 1 ? 'foto' : 'fotos'} <ZoomIn size={14} /></small></span>
          </button>)}
        </div>
        <div className="final-call"><p>Na dúvida, não liberar automaticamente.</p><button className="primary-button" onClick={() => go(1)}>Revisar fluxo <ArrowUp size={18} /></button></div>
        <FooterRule />
      </section>

      {openGallery && <div className="gallery-modal" role="dialog" aria-modal="true" aria-label={`Fotos de ${openGallery.label}`}>
        <button className="gallery-modal-backdrop" onClick={() => { setOpenGallery(null); setExpandedGalleryImage(null); }} aria-label="Fechar galeria" />
        <div className="gallery-modal-panel">
          <header><div><span className="eyebrow">NÃO CONFORMIDADE</span><h2>{openGallery.label}</h2><p>{openGallery.images.length} {openGallery.images.length === 1 ? 'foto registrada' : 'fotos registradas'}</p></div><button className="gallery-modal-close" onClick={() => { setOpenGallery(null); setExpandedGalleryImage(null); }} aria-label="Fechar galeria"><X /></button></header>
          <div className="gallery-modal-grid">{openGallery.images.map((image, index) => <figure key={image} className={expandedGalleryImage === image ? 'expanded' : ''} onClick={() => setExpandedGalleryImage(expandedGalleryImage === image ? null : image)} role="button" tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpandedGalleryImage(expandedGalleryImage === image ? null : image); } }}><img src={image} alt={`${openGallery.label} — foto ${index + 1}`} /><figcaption>Foto {String(index + 1).padStart(2, '0')}</figcaption></figure>)}</div>
        </div>
      </div>}

      <div className="floating-controls" aria-label="Controles de slide"><button onClick={() => go(active - 1)} disabled={active === 0} aria-label="Seção anterior"><ChevronLeft /></button><button onClick={() => go(active + 1)} disabled={active === sections.length - 1} aria-label="Próxima seção"><ChevronRight /></button></div>
    </main>
  );
}

export default App;
