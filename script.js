// ============================================
//  LIGAS ACADÊMICAS – DAMAS
//  Edite apenas as variáveis abaixo
// ============================================

const CONFIG = {
  SHEET_ID:   "COLE_AQUI_O_ID_DA_PLANILHA_DE_LIGAS",
  SHEET_NAME: "Ligas",
};

const ICONES = {
  "clínicas médicas": "🫀",
  "cirúrgicas": "🔪",
  "pediatria": "🧸",
  "saúde coletiva": "👥",
  "diagnóstico e apoio": "🔬",
};

function sl(s){ return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }

function statusClass(s){
  const v = sl(s);
  if(v.includes("aberto")) return "status-aberto";
  if(v.includes("breve"))  return "status-breve";
  return "status-encerrado";
}

let todas = [];
let filtroArea   = "";
let filtroBusca  = "";
let filtroStatus = "";
let mostrarTodas = false;
const LIMITE = 8;

const statusOpcoes = ["", "Aberto", "Em breve", "Encerrado"];
let statusIdx = 0;

// ── CARREGAR PLANILHA ──
async function carregarLigas(){
  try {
    const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}`;
    const res  = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)[1]);
    const cols = json.table.cols.map(c => c.label.toLowerCase().trim().replace(/\s+/g,"_"));

    todas = (json.table.rows || [])
      .map(row => {
        const obj = {};
        cols.forEach((col, i) => {
          const cell = row.c[i];
          obj[col] = cell ? (cell.f || cell.v || "") : "";
        });
        return obj;
      })
      .filter(l => l.sigla && sl(l.ativo || "sim") !== "não" && sl(l.ativo || "sim") !== "nao")
      .sort((a, b) => a.sigla.localeCompare(b.sigla));

    renderizar();
  } catch(e) {
    document.getElementById("ligas-grid").innerHTML =
      `<div class="loading-wrap">⚠️ Não foi possível carregar as ligas.<br><small>Verifique o SHEET_ID e se a planilha está publicada.</small></div>`;
  }
}

// ── FILTRAR ──
function filtradas(){
  return todas.filter(l => {
    if(filtroArea   && sl(l.area_medica)     !== sl(filtroArea))   return false;
    if(filtroBusca  && !sl(l.sigla).includes(filtroBusca)
                    && !sl(l.nome_completo).includes(filtroBusca)
                    && !sl(l.subarea||"").includes(filtroBusca))    return false;
    if(filtroStatus && sl(l.status_seletivo) !== sl(filtroStatus)) return false;
    return true;
  });
}

// ── CARD ──
function card(l){
  const cor  = l.cor_card || "#1A3D2B";
  const icon = ICONES[sl(l.area_medica)] || "🩺";
  const st   = statusClass(l.status_seletivo);
  const capa = l.capa_url ? `background-image:url('${l.capa_url}')` : `background:${cor}`;
  const siglaEsc = (l.sigla || "").replace(/'/g, "\\'");

  return `
  <div class="liga-card" onclick="abrirModal('${siglaEsc}')">
    <div class="card-capa">
      <div class="card-capa-bg" style="${capa}"></div>
      <div class="card-capa-overlay"></div>
      <div class="card-capa-borda"></div>
      <div class="card-logo-wrap">
        ${l.logo_url
          ? `<img src="${l.logo_url}" style="width:42px;height:42px;border-radius:50%;object-fit:cover">`
          : `<div class="card-logo-icon">${icon}</div>`}
      </div>
    </div>
    <div class="card-body">
      <div class="card-sigla">${l.sigla}</div>
      <div class="card-nome">${l.nome_completo}</div>
      <div class="card-desc">${l.descricao_curta}</div>
      <div class="card-meta">
        ${l.qtd_membros ? `<div class="card-meta-item">👤 ${l.qtd_membros} membros</div>` : ""}
        ${l.dia_reuniao && l.horario_reuniao ? `<div class="card-meta-item">🕐 ${l.dia_reuniao} • ${l.horario_reuniao}</div>` : ""}
      </div>
      ${l.status_seletivo ? `<div class="card-status ${st}">${l.status_seletivo}</div>` : ""}
      <button class="card-btn">Conhecer liga →</button>
    </div>
  </div>`;
}

// ── RENDERIZAR ──
function renderizar(){
  const f    = filtradas();
  const grid = document.getElementById("ligas-grid");
  const vw   = document.getElementById("ver-todas-wrap");

  if(!f.length){
    grid.innerHTML = `<div class="loading-wrap">Nenhuma liga encontrada.</div>`;
    vw.style.display = "none";
    return;
  }

  const exibir = mostrarTodas ? f : f.slice(0, LIMITE);
  grid.innerHTML = exibir.map(card).join("");
  vw.style.display = (!mostrarTodas && f.length > LIMITE) ? "" : "none";
}

// ── AÇÕES DE FILTRO ──
function filtrar(){
  filtroBusca  = document.getElementById("busca-input").value.toLowerCase();
  mostrarTodas = false;
  renderizar();
}

function filtrarArea(btn, area){
  filtroArea   = area;
  mostrarTodas = false;
  document.querySelectorAll(".area-pill").forEach(b => b.classList.remove("ativa"));
  btn.classList.add("ativa");
  renderizar();
}

function ciclarStatus(){
  statusIdx    = (statusIdx + 1) % statusOpcoes.length;
  filtroStatus = statusOpcoes[statusIdx];
  document.getElementById("label-status").textContent = filtroStatus || "Todos";
  const btn = document.getElementById("btn-filtros");
  btn.classList.toggle("ativo", !!filtroStatus);
  renderizar();
}

function verTodas(){
  mostrarTodas = true;
  renderizar();
}

// ── MODAL ──
function abrirModal(sigla){
  const l = todas.find(x => x.sigla === sigla);
  if(!l) return;

  const cor  = l.cor_card || "#1A3D2B";
  const icon = ICONES[sl(l.area_medica)] || "🩺";
  const st   = statusClass(l.status_seletivo);
  const capa = l.capa_url ? `background-image:url('${l.capa_url}')` : `background:${cor}`;

  document.getElementById("modal-content").innerHTML = `
    <div class="modal-capa">
      <div class="modal-capa-bg" style="${capa}"></div>
      <div class="modal-capa-overlay"></div>
      <div class="modal-logo-wrap">
        ${l.logo_url
          ? `<img src="${l.logo_url}" style="width:52px;height:52px;border-radius:50%;object-fit:cover">`
          : `<div class="modal-logo-icon">${icon}</div>`}
      </div>
    </div>
    <div class="modal-body">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
        <div class="modal-sigla">${l.sigla}</div>
        ${l.status_seletivo ? `<span class="card-status ${st}" style="margin:0">${l.status_seletivo}</span>` : ""}
      </div>
      <div class="modal-nome">${l.nome_completo}</div>
      <div class="modal-desc">${l.descricao_longa || l.descricao_curta}</div>
      <div class="modal-grid">
        ${l.area_medica    ? `<div class="modal-info-item"><div class="modal-info-label">Área</div><div class="modal-info-value">${l.area_medica}${l.subarea ? " · " + l.subarea : ""}</div></div>` : ""}
        ${l.qtd_membros    ? `<div class="modal-info-item"><div class="modal-info-label">Membros</div><div class="modal-info-value">👤 ${l.qtd_membros}</div></div>` : ""}
        ${l.dia_reuniao    ? `<div class="modal-info-item"><div class="modal-info-label">Reuniões</div><div class="modal-info-value">🕐 ${l.dia_reuniao}${l.horario_reuniao ? " às " + l.horario_reuniao : ""}</div></div>` : ""}
        ${l.presidente     ? `<div class="modal-info-item"><div class="modal-info-label">Presidente</div><div class="modal-info-value">${l.presidente}</div></div>` : ""}
        ${l.vice_presidente? `<div class="modal-info-item"><div class="modal-info-label">Vice-Presidente</div><div class="modal-info-value">${l.vice_presidente}</div></div>` : ""}
        ${l.email          ? `<div class="modal-info-item"><div class="modal-info-label">E-mail</div><div class="modal-info-value">${l.email}</div></div>` : ""}
      </div>
      <div class="modal-acoes">
        ${l.link_edital
          ? `<a class="modal-btn-principal" href="${l.link_edital}" target="_blank">Participar do processo seletivo ↗</a>`
          : `<button class="modal-btn-principal" style="opacity:.5;cursor:default">Sem edital no momento</button>`}
        ${l.instagram ? `<a class="modal-btn-sec" href="https://instagram.com/${l.instagram.replace("@","")}" target="_blank">📸 ${l.instagram}</a>` : ""}
        ${l.whatsapp  ? `<a class="modal-btn-sec" href="https://wa.me/55${l.whatsapp}" target="_blank">💬 WhatsApp</a>` : ""}
      </div>
    </div>`;

  document.getElementById("modal-overlay").classList.add("open");
}

function fecharModal(){
  document.getElementById("modal-overlay").classList.remove("open");
}

document.addEventListener("keydown", e => { if(e.key === "Escape") fecharModal(); });

// ── INICIAR ──
carregarLigas();
