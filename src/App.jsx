// Hooks do React que controlam navegação, consulta, galerias e interações por toque.
import { useEffect, useMemo, useRef, useState } from 'react';
// Ícones usados na navegação, nos indicadores de status e nos cartões de inspeção.
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

// Classes visuais exibidas no slide “Classificação das superfícies” e suas imagens na máquina.
const classes = [
  { id: '1', label: 'Muito alta', detail: 'Visível no campo imediato de visão do observador.', example: 'Frente, painéis principais, regiões externas críticas', image: new URL('../img/classes/classe 1/classs1.png', import.meta.url).href, imageAlt: 'Área externa visível da máquina indicada em vermelho' },
  { id: '2', label: 'Média', detail: 'Visível, porém afastada do campo imediato de visão.', example: 'Áreas visíveis secundárias ou de observação eventual', image: new URL('../img/classes/classe2/class2.png', import.meta.url).href, imageAlt: 'Área lateral da máquina indicada em vermelho' },
  { id: '3', label: 'Baixa', detail: 'Não imediatamente visível.', example: 'Regiões internas, inferiores ou pouco aparentes', image: new URL('../img/classes/classe3/class3.png', import.meta.url).href, imageAlt: 'Área interna da máquina indicada em vermelho' },
  { id: '4', label: 'Oculta', detail: 'Permanentemente oculta após montagem.', example: 'Áreas internas cobertas ou escondidas', image: null, imageAlt: null },
];

// Limites oficiais da STD 120-0014 para cada classe de superfície e grupo de defeito A–F.
// Um limite nulo indica que a classe 4 não possui limite visual após a montagem final.
const surfaceClasses = [
  { id: '1A', label: '1A · máxima exigência', limits: { A: 3, B: 0, C: 0, D: 0, E: 0, F: 0 } },
  { id: '1B', label: '1B · alta exigência', limits: { A: 3, B: 2, C: 0, D: 0, E: 0, F: 0 } },
  { id: '2A', label: '2A · exposta por pouco tempo', limits: { A: 3, B: 2, C: 2, D: 0, E: 0, F: 0 } },
  { id: '2B', label: '2B · visível secundária', limits: { A: 3, B: 2, C: 2, D: 1, E: 1, F: 0 } },
  { id: '3', label: '3 · não imediatamente visível', limits: { A: 4, B: 2, C: 2, D: 2, E: 2, F: 1 } },
  { id: '4', label: '4 · oculta após montagem', limits: null },
];

// Catálogo de defeitos: identifica a norma aplicável, se o defeito é visual ou mensurável
// e os grupos associados a cada nível de visibilidade.
const defects = [
  { name: 'Escorrido de tinta', type: 'Mensurável', reference: 'STD 120-0014 · escorridos e gotas', measurement: 'run' },
  { name: 'Sujeira', type: 'Mensurável', reference: 'STD 120-0014 · sujeira e fibras', measurement: 'dirt' },
  { name: 'Contaminação', type: 'Mensurável', reference: 'STD 120-0014 · sujeira e fibras', measurement: 'dirt' },
  { name: 'Risco', type: 'Mensurável', reference: 'STD 120-0014 · risco superficial', measurement: 'scratch' },
  { name: 'Marca de lixamento', type: 'Visual', reference: 'STD 120-0014 · marca de lixamento isolada', visual: { pouco: ['A', 'B'], visivel: ['C', 'D'], muito: ['E', 'F'] } },
  { name: 'Poros', type: 'Visual', reference: 'STD 120-0014 · poros e pinholes', visual: { pouco: ['A', 'B', 'C', 'D'], visivel: ['E', 'F'], muito: [] } },
  { name: 'Fervura (poros/pinholes)', type: 'Visual', reference: 'STD 120-0014 · poros e pinholes', visual: { pouco: ['A', 'B', 'C', 'D'], visivel: ['E', 'F'], muito: [] } },
  { name: 'Bolhas', type: 'Visual', reference: 'STD 120-0014 · bolhas', visual: { pouco: ['A', 'B', 'C', 'D'], visivel: ['E', 'F'], muito: [] } },
  { name: 'Diferença da coloração', type: 'Visual', reference: 'STD 120-0014 · desvio de cor', visual: { pouco: ['A', 'B'], visivel: ['C', 'D'], muito: ['E', 'F'] } },
  { name: 'Mapeamento da chapa', type: 'Visual', reference: 'STD 120-0014 · flamagem', visual: { pouco: ['A'], visivel: ['B', 'C', 'D'], muito: ['E', 'F'] } },
  { name: 'Casca de laranja', type: 'Específico', reference: 'Comparar com padrão aprovado', policy: 'consult' },
  { name: 'Ferrugem', type: 'Específico', reference: 'Outra especificação técnica', policy: 'block' },
  { name: 'Falha de pintura', type: 'Processo', reference: 'IT 177 · cobertura e proteção', policy: 'block' },
  { name: 'Desplacamento', type: 'Processo', reference: 'IT 177 · aderência e proteção', policy: 'block' },
];

// Três escolhas visuais simples para o inspetor, associadas à escala Volvo I–III.
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

// Filtro simples de quantidade. O maior número de cada faixa é usado para um resultado seguro.
const quantityLevels = [
  { id: 'quase-nada', label: 'Quase nada', count: 1, detail: '1 defeito' },
  { id: 'pouco', label: 'Pouco', count: 3, detail: '2 a 3 defeitos' },
  { id: 'bastante', label: 'Bastante', count: 4, detail: '4 ou mais defeitos' },
];

// Faixas simples em milímetros para defeitos mensuráveis, preservando os grupos A–F da norma.
const measurementScales = {
  dirt: {
    label: 'Tamanho da partícula',
    levels: [
      { id: 'quase-nada', label: 'Quase nada', groups: ['A'], detail: 'até 1 mm' },
      { id: 'pouco', label: 'Pouco', groups: ['B', 'C', 'D'], detail: 'acima de 1 até 3 mm' },
      { id: 'bastante', label: 'Bastante', groups: ['E', 'F'], detail: 'acima de 3 até 10 mm' },
    ],
  },
  scratch: {
    label: 'Comprimento do risco',
    levels: [
      { id: 'quase-nada', label: 'Quase nada', groups: ['A'], detail: 'até 0,5 mm' },
      { id: 'pouco', label: 'Pouco', groups: ['B', 'C', 'D'], detail: 'acima de 0,5 até 2 mm' },
      { id: 'bastante', label: 'Bastante', groups: ['E', 'F'], detail: 'acima de 2 até 20 mm' },
    ],
  },
  run: {
    label: 'Extensão do escorrido',
    levels: [
      { id: 'quase-nada', label: 'Quase nada', groups: ['A'], detail: 'até 0,3 mm' },
      { id: 'pouco', label: 'Pouco', groups: ['B', 'C'], detail: 'acima de 0,3 até 5 mm' },
      { id: 'bastante', label: 'Bastante', groups: ['D', 'E', 'F'], detail: 'acima de 5 até 30 mm' },
    ],
  },
};

// Lista ordenada usada ao somar a capacidade não usada de defeitos mais visíveis.
const defectGroups = ['A', 'B', 'C', 'D', 'E', 'F'];

// Retorna a quantidade permitida para um grupo. Com a caixa marcada, limites não usados
// de defeitos mais visíveis podem ser somados, conforme descrito na STD 120-0014.
function groupLimit(surfaceClass, group, canTransfer) {
  if (!surfaceClass.limits) return Infinity;
  const start = defectGroups.indexOf(group);
  if (!canTransfer) return surfaceClass.limits[group];
  return defectGroups.slice(start).reduce((total, item) => total + surfaceClass.limits[item], 0);
}

// Fonte única dos rótulos e ícones usados na navegação dos slides.
const nav = [
  { label: 'Início', Icon: ShieldCheck },
  { label: 'Fluxo', Icon: GitBranch },
  { label: 'Condições', Icon: SunMedium },
  { label: 'Classes', Icon: Layers3 },
  { label: 'Matriz', Icon: ClipboardCheck },
  { label: 'Atenção', Icon: AlertTriangle },
  { label: 'Exemplos', Icon: ImageOff },
];

// Partículas verdes distribuídas em volta de toda a caixa de liberação.
const releaseParticles = Array.from({ length: 24 }, (_, index) => {
  const side = Math.floor(index / 6);
  const position = `${((index % 6) + 1) * (100 / 7)}%`;
  const directions = [[-110, -90, -70], [70, 90, 110], [160, 180, 200], [-20, 0, 20]];
  return {
    x: side < 2 ? position : side === 2 ? '0%' : '100%',
    y: side < 2 ? (side === 0 ? '0%' : '100%') : position,
    angle: `${directions[side][index % 3]}deg`,
    distance: `${20 + (index % 3) * 8}px`,
  };
});

// Galerias de fotos exibidas no slide final. Cada item tem uma capa e todos os exemplos disponíveis.
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

// Renderiza o ícone de status usado na matriz e no resultado da decisão.
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

// Mostra uma reação visual contínua para cada tipo de resultado da consulta.
// Verde explode no contorno; vermelho cai pela base; amarelo pulsa enquanto exige avaliação.
function OutcomeReaction({ outcome }) {
  if (outcome === '✓') {
    return <span className="outcome-reaction reaction-release" aria-hidden="true">{releaseParticles.map((particle, index) => <i key={index} style={{ '--x': particle.x, '--y': particle.y, '--angle': particle.angle, '--distance': particle.distance }} />)}</span>;
  }
  if (outcome === '✕') {
    return <span className="outcome-reaction reaction-reject" aria-hidden="true">{Array.from({ length: 11 }, (_, index) => <i key={index} style={{ '--delay': `${index * .14}s` }} />)}</span>;
  }
  return <span className="outcome-reaction reaction-review" aria-hidden="true"><i /><i /></span>;
}

// Cabeçalho reutilizável no início de cada seção da apresentação.
function SectionHeader({ eyebrow, title, text }) {
  return <header className="section-header">
    <span className="eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    {text && <p>{text}</p>}
  </header>;
}

// Lembrete reutilizável que mantém a referência aos documentos técnicos em todos os slides.
function FooterRule() {
  return <p className="footer-rule">QUALIDADE É CONFORMIDADE <span>•</span> CONSULTE SEMPRE O DESENHO TÉCNICO E A INSTRUÇÃO APLICÁVEL</p>;
}

// Apresentação principal: concentra os estados de interação e renderiza as sete seções do guia.
function App() {
  // Estado da navegação e da prévia de imagem das classes.
  const [active, setActive] = useState(0);
  const [selectedClass, setSelectedClass] = useState('1');
  const [hoveredClass, setHoveredClass] = useState(null);
  const [classPreviewPosition, setClassPreviewPosition] = useState({ x: 0, y: 0 });
  const classHoverTimer = useRef(null);
  const touchStart = useRef(null);
  // Estado da ferramenta de decisão baseada nas normas.
  const [selectedDefect, setSelectedDefect] = useState('Escorrido de tinta');
  const [selectedSurfaceClass, setSelectedSurfaceClass] = useState('1A');
  const [selectedVisibility, setSelectedVisibility] = useState('pouco');
  const [selectedMeasurementLevel, setSelectedMeasurementLevel] = useState('quase-nada');
  const [selectedQuantity, setSelectedQuantity] = useState('quase-nada');
  const [noHigherDefects, setNoHigherDefects] = useState(false);
  // Estado do checklist opcional e da galeria de fotos dos defeitos.
  const [showChecklist, setShowChecklist] = useState(false);
  const [openGallery, setOpenGallery] = useState(null);
  const [expandedGalleryImage, setExpandedGalleryImage] = useState(null);
  const sections = useMemo(() => ['inicio', 'fluxo', 'condicoes', 'classes', 'matriz', 'atencao', 'exemplos'], []);

  // Troca de seção mantendo a navegação entre o primeiro e o último slide.
  const go = (index) => {
    const next = Math.max(0, Math.min(sections.length - 1, index));
    setActive(next);
  };

  // Abre a imagem da classe selecionada após um pequeno tempo de espera no mouse.
  const startClassPreview = (id, event) => {
    setClassPreviewPosition({ x: event.clientX, y: event.clientY });
    window.clearTimeout(classHoverTimer.current);
    classHoverTimer.current = window.setTimeout(() => setHoveredClass(id), 550);
  };

  // Cancela a prévia pendente e fecha uma imagem de classe já aberta.
  const stopClassPreview = () => {
    window.clearTimeout(classHoverTimer.current);
    setHoveredClass(null);
  };

  // Guarda o início do toque. Galerias ignoram o deslize para preservar a interação com as fotos.
  const startSwipe = (event) => {
    if (openGallery) return;
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  // Troca o slide somente em um deslize horizontal intencional; a rolagem vertical é preservada.
  const finishSwipe = (event) => {
    if (!touchStart.current || openGallery) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(deltaX) < 58 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    go(deltaX < 0 ? active + 1 : active - 1);
  };

  // Atualiza variáveis CSS para que brilhos e cartões acompanhem o cursor sem recriar a tela.
  const updateHoverParallax = (event) => {
    if (event.pointerType === 'touch') return;
    const element = event.currentTarget;
    const bounds = element.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    element.style.setProperty('--pointer-x', `${x * 100}%`);
    element.style.setProperty('--pointer-y', `${y * 100}%`);
    element.style.setProperty('--parallax-x', `${(x - .5) * 22}px`);
    element.style.setProperty('--parallax-y', `${(y - .5) * 16}px`);
    element.style.setProperty('--tilt-x', `${(x - .5) * 5}deg`);
    element.style.setProperty('--tilt-y', `${(y - .5) * -5}deg`);
  };

  // Centraliza novamente os efeitos quando o cursor deixa a área interativa.
  const resetHoverParallax = (event) => {
    const element = event.currentTarget;
    element.style.setProperty('--pointer-x', '50%');
    element.style.setProperty('--pointer-y', '50%');
    element.style.setProperty('--parallax-x', '0px');
    element.style.setProperty('--parallax-y', '0px');
    element.style.setProperty('--tilt-x', '0deg');
    element.style.setProperty('--tilt-y', '0deg');
  };

  // Ativa a navegação por teclado e a tecla Esc para fechar uma galeria aberta.
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

  // Evita que um temporizador de hover continue após o componente ser removido.
  useEffect(() => () => window.clearTimeout(classHoverTimer.current), []);

  // Transforma as escolhas do inspetor nos dados atuais de defeito, classe e grupo da norma.
  const defectCriterion = defects.find((item) => item.name === selectedDefect) ?? defects[0];
  const visibility = visibilityLevels.find((item) => item.id === selectedVisibility) ?? visibilityLevels[0];
  const measurementScale = measurementScales[defectCriterion.measurement];
  const measurementLevel = measurementScale?.levels.find((item) => item.id === selectedMeasurementLevel) ?? measurementScale?.levels[0];
  const selectedStandardClass = surfaceClasses.find((item) => item.id === selectedSurfaceClass) ?? surfaceClasses[0];
  const quantity = quantityLevels.find((item) => item.id === selectedQuantity) ?? quantityLevels[0];
  const count = quantity.count;
  const matchingGroups = defectCriterion.type === 'Mensurável'
    ? measurementLevel?.groups
    : defectCriterion.visual?.[selectedVisibility] ?? null;
  const allowedGroups = matchingGroups?.filter((group) => groupLimit(selectedStandardClass, group, noHigherDefects) >= count) ?? [];
  const blockedGroups = matchingGroups?.filter((group) => !allowedGroups.includes(group)) ?? [];
  // Aplica a decisão de liberação por prioridade: bloqueio de processo, consulta externa,
  // aparência inválida, classe 4, limite excedido, grupo condicionado ou liberação direta.
  let outcome = '!';
  let outcomeText = 'Avaliação necessária';
  let outcomeDetail = '';

  if (defectCriterion.policy === 'block') {
    outcome = '✕';
    outcomeText = 'Não liberar';
    outcomeDetail = defectCriterion.name === 'Ferrugem'
      ? 'A norma Volvo direciona corrosão para outra especificação técnica; o procedimento interno exige peça livre de ferrugem antes da pintura.'
      : 'O procedimento IT 177 exige segregação e avaliação para decapagem; retoque não é permitido para esta não conformidade.';
  } else if (defectCriterion.policy === 'consult') {
    outcomeDetail = 'A STD 120-0014 não fixa grupo A–F para este defeito. Compare com o padrão aprovado e a especificação da peça antes de liberar.';
  } else if (!matchingGroups?.length) {
    outcome = '✕';
    outcomeText = 'Não liberar';
    outcomeDetail = `${visibility.code} — ${visibility.standard} não é uma aparência permitida para ${defectCriterion.name.toLowerCase()} na STD 120-0014.`;
  } else if (!selectedStandardClass.limits) {
    outcome = '✓';
    outcomeText = 'Pode liberar visualmente';
    outcomeDetail = 'A classe 4 não tem limite visual pela STD 120-0014. Confirme que não há efeito em montagem, função ou corrosão.';
  } else if (!allowedGroups.length) {
    outcome = '✕';
    outcomeText = 'Não liberar';
    outcomeDetail = `${count} ocorrência${count > 1 ? 's' : ''} no${matchingGroups.length > 1 ? 's' : ''} grupo${matchingGroups.length > 1 ? 's' : ''} ${matchingGroups.join('/')} excede${matchingGroups.length > 1 ? 'm' : ''} o limite da classe ${selectedStandardClass.id}.`;
  } else if (blockedGroups.length) {
    outcome = '!';
    outcomeText = 'Liberar condicionado';
    outcomeDetail = `${visibility.code} pode corresponder aos grupos ${matchingGroups.join('/')}. Para ${count} ocorrência${count > 1 ? 's' : ''}, a classe ${selectedStandardClass.id} aceita ${allowedGroups.join('/')} e não aceita ${blockedGroups.join('/')}. Confirme o grupo antes de liberar.`;
  } else {
    outcome = '✓';
    outcomeText = 'Pode liberar';
    outcomeDetail = `${count} ocorrência${count > 1 ? 's' : ''} no${matchingGroups.length > 1 ? 's' : ''} grupo${matchingGroups.length > 1 ? 's' : ''} ${matchingGroups.join('/')} ${matchingGroups.length > 1 ? 'estão' : 'está'} dentro do limite da classe ${selectedStandardClass.id}.`;
  }
  // Explica quando a regra de quantidade adicional foi usada na decisão.
  const transferDetail = noHigherDefects && selectedStandardClass.limits
    ? ' A quantidade adicional foi aplicada porque não há defeitos mais visíveis nesta área.'
    : '';
  const displayClass = classes.find((item) => item.id === selectedClass) ?? classes[0];
  const previewClass = classes.find((item) => item.id === hoveredClass);
  const previewStyle = previewClass ? {
    '--class-color': `var(--class-${previewClass.id})`,
    left: Math.max(16, Math.min(classPreviewPosition.x + 20, window.innerWidth - 336)),
    top: Math.max(80, Math.min(classPreviewPosition.y + 20, window.innerHeight - 314)),
  } : undefined;

  // Estrutura da apresentação: navegação, sete slides, galeria modal e controles anterior/próximo.
  return (
    <main onTouchStart={startSwipe} onTouchEnd={finishSwipe}>
      {/* Cabeçalho fixo: marca, navegação de desktop e contador do slide atual. */}
      <nav className="topbar" aria-label="Navegação da apresentação">
        <button className="brand" onClick={() => go(0)} aria-label="Voltar ao início"><span><ShieldCheck size={16} /></span> GUIA DE QUALIDADE</button>
        <div className="nav-links gooey-nav">
          {nav.map(({ label, Icon }, index) => <button key={label} className={active === index ? 'active' : ''} onClick={() => go(index)}><Icon size={14} /><span>{label}</span><i /></button>)}
        </div>
        <span className="slide-counter">{String(active + 1).padStart(2, '0')} / 07</span>
      </nav>

      {/* Navegação lateral compacta disponível em desktop e celular. */}
      <aside className="slide-rail" aria-label="Paginação lateral">
        {nav.map(({ label, Icon }, index) => <button key={label} className={active === index ? 'active' : ''} onClick={() => go(index)} aria-label={`Ir para ${label}`}><span>{String(index + 1).padStart(2, '0')}</span><i /><Icon size={15} /></button>)}
      </aside>

      {/* Slide 1: introdução e entrada do guia. */}
      <section id="inicio" className={`hero presentation-section ${active === 0 ? 'section-active' : ''}`} onPointerMove={updateHoverParallax} onPointerLeave={resetHoverParallax}>
        <div className="hero-photo" role="img" aria-label="Equipamento Volvo amarelo em campo" />
        <div className="hero-overlay" />
        <div className="hero-tech-grid" aria-hidden="true" />
        <div className="hero-content">
          <p className="kicker">GUIA DE INSPEÇÃO</p>
          <h1>Requisitos de<br /><em>superfície pintada</em></h1>
          <p className="hero-copy">Critérios de avaliação visual aplicados após a pintura, incluindo classes e condições de inspeção.</p>
          <div className="hero-objective"><span>OBJETIVO DO MATERIAL</span><p>Padronizar as normas no setor, facilitando a identificação da classe, a avaliação do defeito e a tomada de decisão.</p></div>
          <button className="primary-button" onClick={() => go(1)}>Iniciar guia <ArrowDown size={18} /></button>
        </div>
        <FooterRule />
      </section>

      {/* Slide 2: fluxo de inspeção e lembretes obrigatórios para decisão. */}
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

      {/* Slide 3: condições controladas de avaliação presentes nas instruções de trabalho. */}
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

      {/* Slide 4: classes de superfície com prévia por hover ou segundo toque. */}
      <section id="classes" className={`presentation-section classes-section ${active === 3 ? 'section-active' : ''}`}>
        <SectionHeader eyebrow="02" title="Classificação das superfícies" text="Passe o mouse sobre uma classe para ver onde a peça fica na máquina." />
        <div className="class-scale" aria-label="Escala de exigência estética">
          {classes.map((item, index) => <button key={item.id} className={`class-item class-${item.id} ${selectedClass === item.id ? 'selected' : ''}`} onClick={(event) => { setClassPreviewPosition({ x: event.clientX, y: event.clientY }); if (selectedClass === item.id) setHoveredClass(item.id); else { setSelectedClass(item.id); setHoveredClass(null); } }} onPointerDown={(event) => { if (event.pointerType !== 'mouse') setClassPreviewPosition({ x: event.clientX, y: event.clientY }); }} onMouseEnter={(event) => { if (item.id === selectedClass) startClassPreview(item.id, event); }} onMouseMove={(event) => { if (item.id === selectedClass) setClassPreviewPosition({ x: event.clientX, y: event.clientY }); }} onMouseLeave={stopClassPreview} onBlur={stopClassPreview}><span className="class-number">{item.id}</span><span className="class-label">{item.label}</span><small>{index === 0 ? 'MAIOR EXIGÊNCIA ESTÉTICA' : index === 3 ? 'MENOR EXIGÊNCIA ESTÉTICA' : ''}</small></button>)}
        </div>
        <div className="class-details">
          <article className={`visible class-detail-${displayClass.id}`} style={{ '--class-color': `var(--class-${displayClass.id})` }}><span>CLASSE {displayClass.id}</span><h3>{displayClass.label}</h3><p>{displayClass.detail}</p><p className="example"><b>Exemplo de aplicação</b>{displayClass.example}</p></article>
        </div>
        {previewClass && <aside className="class-hover-popup" style={previewStyle}><div className="class-hover-popup-title"><span>CLASSE {previewClass.id}</span><strong>{previewClass.label}</strong></div>{previewClass.image ? <img src={previewClass.image} alt={previewClass.imageAlt} /> : <div className="class-hover-popup-hidden"><Eye size={34} /><span>Oculta após a montagem</span></div>}<p>{previewClass.image ? 'Local da peça indicado na máquina.' : 'Esta região não fica visível após a montagem.'}</p></aside>}
        <FooterRule />
      </section>

      {/* Slide 5: matriz da STD 120-0014 e decisão de liberação interativa. */}
      <section id="matriz" className={`presentation-section matrix-section ${active === 4 ? 'section-active' : ''}`}>
        <SectionHeader eyebrow="02.2" title="Defeitos e classes" text="A norma cruza aparência, grupo A–F, classe da superfície e quantidade. Escolha o defeito para consultar a regra correta." />
        <div className="matrix-wrap"><table><thead><tr><th>DEFEITO</th><th>TIPO</th><th>I · PRATICAMENTE INVISÍVEL</th><th>II · POUCO VISÍVEL</th><th>III · CLARAMENTE VISÍVEL</th></tr></thead><tbody>{defects.map((item) => <tr key={item.name} className={selectedDefect === item.name ? 'chosen' : ''} onClick={() => setSelectedDefect(item.name)}><th>{item.name}</th><td>{item.type}</td>{item.type === 'Visual' ? <><td>{item.visual.pouco.length ? item.visual.pouco.join('/') : '—'}</td><td>{item.visual.visivel.length ? item.visual.visivel.join('/') : '—'}</td><td>{item.visual.muito.length ? item.visual.muito.join('/') : '—'}</td></> : <td colSpan="3">{item.type === 'Mensurável' ? 'Medir em mm para enquadrar no grupo A–F' : item.policy === 'block' ? 'Não liberar automaticamente' : 'Comparar com o padrão aprovado'}</td>}</tr>)}</tbody></table></div>
        <div className="legend"><span><Status value="✓" /> PODE LIBERAR</span><span><Status value="!" /> LIBERAR CONDICIONADO / AVALIAR</span><span><Status value="✕" /> NÃO LIBERAR</span></div>
        <div className="decision-tool border-glow">
          <div className="decision-intro"><span className="eyebrow">DECISÃO PELA NORMA</span><h3>Pode liberar ou não?</h3><p>Para defeitos visuais, informe a aparência e a quantidade. Para os mensuráveis, escolha a faixa simples de milímetros.</p></div>
          <label>Defeito<select value={selectedDefect} onChange={(event) => setSelectedDefect(event.target.value)}>{defects.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
          <label>Classe da superfície<select value={selectedSurfaceClass} onChange={(event) => setSelectedSurfaceClass(event.target.value)}>{surfaceClasses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          {defectCriterion.type === 'Mensurável' ? <label>{measurementScale.label}<select value={selectedMeasurementLevel} onChange={(event) => setSelectedMeasurementLevel(event.target.value)}>{measurementScale.levels.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.detail}</option>)}</select></label> : <label>Visibilidade<select value={selectedVisibility} onChange={(event) => setSelectedVisibility(event.target.value)}>{visibilityLevels.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.label}</option>)}</select></label>}
          <label>Quantidade de defeitos<select value={selectedQuantity} onChange={(event) => setSelectedQuantity(event.target.value)}>{quantityLevels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          {defectCriterion.type === 'Visual' || defectCriterion.type === 'Mensurável' ? <label className="transfer-choice"><input type="checkbox" checked={noHigherDefects} onChange={(event) => setNoHigherDefects(event.target.checked)} /> Não há defeitos mais visíveis nesta área</label> : null}
          <div className={`outcome outcome-${outcome}`}><Status value={outcome} /><strong>{outcomeText}</strong><span className="outcome-context">{selectedDefect} · Classe {selectedSurfaceClass}</span><OutcomeReaction key={`${outcome}-${selectedDefect}-${selectedSurfaceClass}-${selectedQuantity}-${selectedMeasurementLevel}-${selectedVisibility}`} outcome={outcome} /></div>
          <div className={`criterion-note criterion-${defectCriterion.type.toLowerCase()}`}><span>{matchingGroups?.length ? `GRUPO ${matchingGroups.join('/')}` : defectCriterion.type}</span><strong>{defectCriterion.reference}</strong><p>{measurementLevel ? `${measurementLevel.label}: ${measurementLevel.detail}. ` : ''}{outcomeDetail}{transferDetail}</p></div>
        </div>
        <p className="fine-print">Quantidade simplificada: escolha entre quase nada, pouco ou bastante conforme a presença de defeitos na área avaliada. Para milímetros, as três faixas são adaptadas a cada tipo de defeito conforme a tabela da STD 120-0014. A quantidade adicional só vale quando não existem defeitos mais visíveis na mesma área.</p>
        <FooterRule />
      </section>

      {/* Slide 6: pontos críticos de inspeção e checklist opcional. */}
      <section id="atencao" className={`presentation-section attention-section ${active === 5 ? 'section-active' : ''}`}>
        <SectionHeader eyebrow="03" title="Pontos de atenção" text="Todos os exemplos abaixo são casos de reprova." />
        <div className="attention-grid magic-bento">
          <article className="attention-card photo-card magic-bento-card" onPointerMove={updateHoverParallax} onPointerLeave={resetHoverParallax}><img src="/assets/weld.jpg" alt="Ponto de solda e canto de peça" /><p>Olhar com atenção as bordas, quinas internas e regiões onde a tinta tende a acumular.</p></article>
          <article className="attention-card photo-card magic-bento-card" onPointerMove={updateHoverParallax} onPointerLeave={resetHoverParallax}><img src="/assets/bubbles.jpg" alt="Peça pintada com bolhas" /><p>Verificar locais onde a peça foi apoiada, pendurada ou tocada durante o processo.</p></article>
          <article className="attention-card magic-bento-card" onPointerMove={updateHoverParallax} onPointerLeave={resetHoverParallax}><Paintbrush className="card-icon" size={38} /><h3>Falhas e resíduos</h3><p>Verificar se contém falhas de pintura e resíduos na peça, como sujeira.</p></article>
          <article className="attention-card magic-bento-card" onPointerMove={updateHoverParallax} onPointerLeave={resetHoverParallax}><ThermometerSun className="card-icon" size={38} /><h3>Forno e camadas</h3><p>Verificar a temperatura e a velocidade do forno, além do nível de camadas, para evitar desplacamento.</p></article>
          <article className="attention-card magic-bento-card" onPointerMove={updateHoverParallax} onPointerLeave={resetHoverParallax}><Eye className="card-icon" size={38} /><h3>Cor e brilho</h3><p>Verificar desvios de cor e brilho, bem como respingos na superfície.</p></article>
        </div>
        <button className="checklist-toggle" onClick={() => setShowChecklist(!showChecklist)}>{showChecklist ? 'Ocultar checklist' : 'Abrir checklist de inspeção'} <span>{showChecklist ? '−' : '+'}</span></button>
        {showChecklist && <div className="checklist"><label><input type="checkbox" /> Bordas, quinas internas e áreas de acúmulo verificadas</label><label><input type="checkbox" /> Pontos de apoio, gancho ou contato verificados</label><label><input type="checkbox" /> Falhas, sujeira, cor, brilho e respingos verificados</label><label><input type="checkbox" /> Condições de forno e camadas verificadas</label></div>}
        <FooterRule />
      </section>

      {/* Slide 7: exemplos de defeitos. Selecionar um cartão abre todas as fotos do problema. */}
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

      {/* Modal que mantém a galeria ampliada separada da navegação de slides. */}
      {openGallery && <div className="gallery-modal" role="dialog" aria-modal="true" aria-label={`Fotos de ${openGallery.label}`}>
        <button className="gallery-modal-backdrop" onClick={() => { setOpenGallery(null); setExpandedGalleryImage(null); }} aria-label="Fechar galeria" />
        <div className="gallery-modal-panel">
          <header><div><span className="eyebrow">NÃO CONFORMIDADE</span><h2>{openGallery.label}</h2><p>{openGallery.images.length} {openGallery.images.length === 1 ? 'foto registrada' : 'fotos registradas'}</p></div><button className="gallery-modal-close" onClick={() => { setOpenGallery(null); setExpandedGalleryImage(null); }} aria-label="Fechar galeria"><X /></button></header>
          <div className="gallery-modal-grid">{openGallery.images.map((image, index) => <figure key={image} className={expandedGalleryImage === image ? 'expanded' : ''} onClick={() => setExpandedGalleryImage(expandedGalleryImage === image ? null : image)} role="button" tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpandedGalleryImage(expandedGalleryImage === image ? null : image); } }}><img src={image} alt={`${openGallery.label} — foto ${index + 1}`} /><figcaption>Foto {String(index + 1).padStart(2, '0')}</figcaption></figure>)}</div>
        </div>
      </div>}

      {/* Botões de anterior e próximo para a navegação em desktop. */}
      <div className="floating-controls" aria-label="Controles de slide"><button onClick={() => go(active - 1)} disabled={active === 0} aria-label="Seção anterior"><ChevronLeft /></button><button onClick={() => go(active + 1)} disabled={active === sections.length - 1} aria-label="Próxima seção"><ChevronRight /></button></div>
    </main>
  );
}

export default App;
