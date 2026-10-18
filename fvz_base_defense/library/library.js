import {publicationBar} from '../publication-ui.js?v=production-38';
import {adminOrigin,privateEditor} from '../live-release.js?v=production-38';
import { rules, assetCatalog } from "../config.js";
import { documents, openQuestions } from "./content.js?v=20261018-survivors-v5";

const $ = (selector) => document.querySelector(selector);
const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const categories = {
  all: "전체",
  plants: "식물",
  enemies: "좀비",
  bases: "기지",
  backgrounds: "배경",
  props: "환경 장식",
  effects: "효과",
  ui: "인터페이스",
};
const reviewNames = {
  ready: "사용 가능",
  review: "검토 중",
  replace: "교체 검토",
  archived: "보관",
};
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "등록된 기록 없음";
const bytes = (value) =>
  value < 1024 ? `${value}B` : `${(value / 1024).toFixed(1)}KB`;
const assetUrl = (asset) =>
  `../assets/${encodeURIComponent(asset.file)}?v=${library.state.revision || 0}`;
const metaFor = (id) => library.state.assets[id] || {};
const reviewFor = (asset) =>
  metaFor(asset.id).reviewStatus || asset.reviewStatus ||
  (asset.usage === "stored" ? "archived" : "ready");
const nameFor = (asset) => metaFor(asset.id).name || asset.name;
let library = {
  ...assetCatalog,
  state: { revision: 0, assets: {} },
  writable: false,
};
let qa = null,
  selected = null,
  replacement = null,
  previewMode = "checkered",
  toastTimer;
const drafts = new Map();
const filters = {
  search: "",
  category: "all",
  review: "all",
  usage: "all",
  favorites: false,
};

async function callApi(path, body) {
  const response = await fetch(`../api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "저장하지 못했습니다.");
  return value;
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 3500);
}
function download(name, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type })),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function updateAsset(value) {
  const index = library.assets.findIndex(
    (asset) => asset.id === value.asset.id,
  );
  if (index < 0) library.assets.push(value.asset);
  else library.assets[index] = value.asset;
  library.state.assets[value.asset.id] = value.meta;
  library.state.revision = value.revision;
  $("#nav-count").textContent = library.assets.length;
}
function heading(title, subtitle, action = "") {
  return `<div class="page-heading"><div><span class="eyebrow">Flower vs Zombie : Base Defense DESIGN LIBRARY</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${action}</div>`;
}
function renderBlock(block) {
  if (block.type === "p") return `<p>${esc(block.text)}</p>`;
  if (block.type === "h3") return `<h3>${esc(block.text)}</h3>`;
  if (block.type === "list") {
    const tag = block.ordered ? "ol" : "ul";
    return `<${tag}>${block.items.map((text) => `<li>${esc(text)}</li>`).join("")}</${tag}>`;
  }
  if (block.type === "table")
    return `<div class="table-wrap"><table><thead><tr>${block.headings.map((text) => `<th scope="col">${esc(text)}</th>`).join("")}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((text) => `<td>${esc(text)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  if (block.type === "callout")
    return `<div class="note pending"><strong>${esc(block.label)}</strong><p>${esc(block.text)}</p></div>`;
  if (block.type === "figure")
    return `<figure><a href="evidence/${esc(block.src)}" target="_blank" rel="noopener"><img loading="lazy" src="evidence/${esc(block.src)}" alt="${esc(block.caption)}"></a><figcaption>${esc(block.caption)}</figcaption></figure>`;
  if (block.type === "flow")
    return `<div class="system-flow">${block.items.map(([title, text]) => `<article><strong>${esc(title)}</strong><span>${esc(text)}</span></article>`).join("")}</div>`;
  return "";
}
function renderDocument(key) {
  const doc = documents[key];
  return `<article class="doc">${heading(doc.title, doc.subtitle)}<div class="doc-meta">${esc(doc.meta)}</div><p class="doc-intro">${esc(doc.intro)}</p><div class="doc-links"><a href="documents/${doc.filename}" download>이 문서 HTML로 저장</a><a href="#assets">관련 리소스 보기</a></div>${doc.sections.map((section) => `<section class="doc-section"><h2>${esc(section.title)}</h2>${section.blocks.map(renderBlock).join("")}</section>`).join("")}</article>`;
}
function renderOverview() {
  const featured = ["pea", "cabbage", "mummy", "mummy-shortbow"]
    .map((id) => library.assets.find((asset) => asset.id === id))
    .filter(Boolean);
  return `${heading("함께 만드는 게임의 기준", "관찰과 설계, 실제 게임 리소스를 한 곳에서 연결합니다. 새 사실이 확인되면 규칙과 검증 기록을 함께 갱신합니다.")}<div class="summary-grid"><article class="summary"><span>클리어까지 관찰한 챕터</span><strong>4</strong><p>Green Block · Dune Loop · Moonblock · Forest Camp</p></article><article class="summary"><span>관리하는 이미지 리소스</span><strong>${library.assets.length}</strong><p>실제 게임 파일과 같은 목록</p></article><article class="summary"><span>기본 조작과 추가 관찰 검사</span><strong>${qa ? qa.basic.passed + qa.extra.passed : "—"}</strong><p>전체 동일 판정은 아직 진행 중</p></article></div><div class="note"><strong>현재 목표</strong><p>원본의 UI·8칸 배치·합성·성장 흐름을 유지하고, 식물과 좀비 스킨으로 재제작합니다. 사막 적은 미라 좀비를 사용합니다.</p></div><div class="section-title"><h2>지금의 진행</h2><a href="#verification">검증 기록 보기</a></div><div class="overview-grid"><article class="panel"><h2>챕터와 관찰 범위</h2><ul class="chapter-list">${rules.chapters.map((chapter, index) => `<li><div><strong>${esc(chapter.name)}</strong><small>${index < 2 ? `${chapter.waves}웨이브 · 전투부터 보상 수령까지` : "홈과 환경 배경 확인"}</small></div><span class="badge ${index < 2 ? "confirmed" : "review"}">${index < 2 ? "클리어 관찰" : "전투 미확인"}</span></li>`).join("")}<li><div><strong>Moonblock</strong><small>10웨이브 · 사용자 클리어 기록, 게임 미구현</small></div><span class="badge confirmed">클리어 관찰</span></li><li><div><strong>Forest Camp</strong><small>사용자 명칭 · 10웨이브 · 게임 미구현</small></div><span class="badge confirmed">클리어 관찰</span></li><li><div><strong>Oasis Cross</strong><small>1/10웨이브 확인 · 클리어 미확인 · 게임 미구현</small></div><span class="badge">초반 관찰</span></li></ul></article><article class="panel"><h2>먼저 확인할 것</h2><ul class="chapter-list">${openQuestions
    .slice(0, 3)
    .map(
      (question) =>
        `<li><div><strong>${esc(question.title)}</strong><small>${esc(question.detail)}</small></div><span class="badge pending">대조 중</span></li>`,
    )
    .join(
      "",
    )}</ul></article></div><div class="section-title"><h2>우리 게임의 캐릭터</h2><a href="#assets">전체 보관함 열기</a></div><div class="mini-assets">${featured.map((asset) => `<button data-inspect="${asset.id}"><img src="${assetUrl(asset)}" alt="${esc(nameFor(asset))}"><span>${esc(nameFor(asset))}</span></button>`).join("")}</div><div class="section-title"><h2>함께 쓰는 자료</h2></div><div class="overview-grid"><article class="panel"><h2>관찰에서 기획으로</h2><p>생산 강화의 효과, 8칸 합성의 정체, 적의 등장 속도와 보상 흐름을 확인된 사실과 가설로 구분했습니다.</p><a href="#observations">원본 관찰 분석 읽기</a></article><article class="panel"><h2>설계에서 실제 파일로</h2><p>규칙과 리소스 목록을 분리했습니다. 보관함의 메모와 교체 이력은 같은 작업 폴더에 저장합니다.</p><a href="#systems">시스템 구조 읽기</a></article></div>`;
}
function renderAssets() {
  return `${heading("리소스 보관함", "이미지를 보고 용도와 검토 내용을 기록합니다. 기존 PNG를 바꿀 때는 이전 파일을 남겨 되돌릴 수 있습니다.", `<button class="primary" id="open-add" ${library.writable ? "" : "disabled"}>리소스 추가</button>`)}<div class="filters"><label class="search-wrap"><span class="eyebrow">리소스 검색</span><input type="search" id="asset-search" value="${esc(filters.search)}" placeholder="이름 · 파일명 · 태그 · 메모로 검색" aria-label="리소스 검색"></label><label>검토 상태<select id="review-filter"><option value="all">모든 상태</option>${Object.entries(
    reviewNames,
  )
    .map(
      ([key, label]) =>
        `<option value="${key}" ${filters.review === key ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label><label>게임 연결<select id="usage-filter"><option value="all">전체 연결</option><option value="active" ${filters.usage === "active" ? "selected" : ""}>사용 중</option><option value="unlinked" ${filters.usage === "unlinked" ? "selected" : ""}>미연결</option><option value="stored" ${filters.usage === "stored" ? "selected" : ""}>기존 보관</option></select></label><label class="filter-check"><input id="favorite-filter" type="checkbox" ${filters.favorites ? "checked" : ""}>핀 고정만</label></div><div class="category-tabs" aria-label="리소스 종류">${Object.entries(
    categories,
  )
    .map(
      ([key, label]) =>
        `<button data-category="${key}" aria-pressed="${filters.category === key}">${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="results-line"><span id="asset-results"></span><span>이미지를 선택하면 상세 관리가 열립니다</span></div><div id="asset-grid" class="asset-grid"></div>`;
}
function renderAssetGrid() {
  if (!$("#asset-grid")) return;
  const query = filters.search.toLocaleLowerCase();
  const items = library.assets.filter((asset) => {
    const meta = metaFor(asset.id),
      haystack = [
        nameFor(asset),
        asset.file,
        asset.id,
        meta.notes,
        ...(meta.tags || []),
      ]
        .join(" ")
        .toLocaleLowerCase();
    return (
      (!query || haystack.includes(query)) &&
      (filters.category === "all" || asset.category === filters.category) &&
      (filters.review === "all" || reviewFor(asset) === filters.review) &&
      (filters.usage === "all" || asset.usage === filters.usage) &&
      (!filters.favorites || meta.favorite)
    );
  });
  $("#asset-results").textContent =
    `${items.length}개 표시 / 전체 ${library.assets.length}개`;
  $("#asset-grid").innerHTML = items.length
    ? items
        .map(
          (asset) =>
            `<article class="asset-card"><button class="asset-open" data-inspect="${asset.id}" aria-label="${esc(nameFor(asset))} 상세 관리"><div class="asset-thumbnail checkered"><img loading="lazy" src="${assetUrl(asset)}" alt="${esc(nameFor(asset))}"></div><div class="asset-caption"><strong>${esc(nameFor(asset))}</strong><small>${esc(asset.file)} · ${asset.width}×${asset.height}</small></div></button><footer class="asset-foot"><span class="badge ${reviewFor(asset)}">${reviewNames[reviewFor(asset)]}</span><button class="pin" data-pin="${asset.id}" aria-label="${esc(nameFor(asset))} 핀 고정" aria-pressed="${!!metaFor(asset.id).favorite}" ${library.writable ? "" : "disabled"}>${metaFor(asset.id).favorite ? "고정됨" : "핀 고정"}</button></footer></article>`,
        )
        .join("")
    : '<section class="empty"><h3>검색 결과가 없습니다</h3><p>검색어나 종류·검토 상태를 바꾸어 보세요.</p><button id="clear-filters">필터 초기화</button></section>';
}
function renderVerification() {
  return `${heading("검증 기록", "기능 검사와 원본 관찰을 구분합니다. 검사 통과 수가 원본과 완전히 같다는 의미는 아닙니다.")}<div class="summary-grid"><article class="summary"><span>기본 조작 검사</span><strong>${qa?.basic.passed ?? "—"}</strong><p>실패 ${qa?.basic.failed ?? "—"} · 마우스와 터치</p></article><article class="summary"><span>추가 관찰 검사</span><strong>${qa?.extra.passed ?? "—"}</strong><p>강화·광고 조건·경제 표시</p></article><article class="summary"><span>챕터 전환 검사</span><strong>${qa?.campaigns.filter((row) => row.passed).length ?? "—"} / 2</strong><p>승리 → 2배 → 저장 → 다음 맵</p></article></div><div class="note pending"><strong>게임 전체 판정은 진행 중</strong><p>합성 체력·타깃 선택·레벨 성장·정산 잔액과 다음 맵의 미확인 규칙이 남아 있습니다. 리소스 ‘사용 가능’ 표시는 개별 이미지의 검토 상태입니다.</p></div><div class="section-title"><h2>현재 실행 결과</h2></div><article class="panel"><div class="table-wrap"><table><thead><tr><th>검사</th><th>확인한 내용</th><th>상태</th></tr></thead><tbody><tr><td>라이브러리 관리</td><td>검색·메모·PNG 추가·교체·원본 파일 복원·모바일 · ${qa?.library?.passed ?? "—"}개 검사</td><td>${qa?.library?.failed === 0 ? "통과" : "확인 필요"}</td></tr><tr><td>합성 체력 계산</td><td>건강·손상 대상·병종·반복 합성의 구현 검사. 원본 공식 검증과 별개</td><td>${qa?.merge?.failed === 0 ? "통과" : "확인 필요"}</td></tr><tr><td>기본 구매와 배치</td><td>유효 드롭·칸 밖 취소·기존 병력 복귀·합성·터치 입력</td><td>${qa?.basic.failed === 0 ? "통과" : "확인 필요"}</td></tr><tr><td>강화 재현</td><td>11660→11코인, 754→51코인과 광고 생산량1.20</td><td>${qa?.extra.failed === 0 ? "통과" : "확인 필요"}</td></tr>${qa?.campaigns.map((row) => `<tr><td>${esc(row.name)}</td><td>표시 보상${row.expectedReward}·다음 맵·새로고침·새 전투</td><td>${row.passed ? "통과" : "확인 필요"}</td></tr>`).join("") || ""}<tr><td>배치 모션</td><td>실제 입력을25프레임으로 캡처, 드롭 후 대상 칸 확인</td><td>${qa?.motion.passed ? "통과" : "확인 필요"}</td></tr></tbody></table></div></article><div class="section-title"><h2>동일 크기 화면 비교</h2></div>${[
    ["compare-range-latest.png", "범위 표시와 유효 칸"],
    ["compare-first-win.png", "첫 챕터 승리 화면"],
    ["compare-dune-home.png", "Dune Loop 홈"],
    ["compare-noon-home.png", "Noon Strip 홈"],
  ]
    .map(
      ([file, title]) =>
        `<article class="panel" style="margin-bottom:18px"><h2>${title}</h2><p>왼쪽 원본 · 오른쪽 재제작. 전투 편성과 촬영 시점은 다를 수 있습니다.</p><a href="evidence/${file}" target="_blank" rel="noopener"><img loading="lazy" src="evidence/${file}" alt="${title} 비교" style="width:100%;height:auto;border-radius:6px"></a></article>`,
    )
    .join(
      "",
    )}<div class="section-title"><h2>열린 검증 항목</h2></div><article class="panel"><div class="table-wrap"><table><thead><tr><th>항목</th><th>다음 확인</th><th>우선순위</th></tr></thead><tbody>${openQuestions.map((question) => `<tr><td>${esc(question.title)}</td><td>${esc(question.detail)}</td><td>${question.priority}</td></tr>`).join("")}</tbody></table></div></article>`;
}
function route() {
  const [requested, assetId] = location.hash.slice(1).split("/"),
    view = [
      "overview",
      "assets",
      "observations",
      "design",
      "systems",
      "verification",
    ].includes(requested)
      ? requested
      : "overview";
  document
    .querySelectorAll("nav [data-view]")
    .forEach((link) =>
      link.setAttribute(
        "aria-current",
        link.dataset.view === view ? "page" : "false",
      ),
    );
  $("#print-doc").hidden = !documents[view];
  $("#content").innerHTML =
    view === "assets"
      ? renderAssets()
      : documents[view]
        ? renderDocument(view)
        : view === "verification"
          ? renderVerification()
          : renderOverview();
  document.title = `${documents[view]?.title || { overview: "게임 설계 라이브러리", assets: "리소스 보관함", verification: "검증 기록" }[view]} · Flower vs Zombie : Base Defense`;
  if (view === "assets") {
    $("#asset-search").addEventListener("input", (event) => {
      filters.search = event.target.value;
      renderAssetGrid();
    });
    $("#review-filter").addEventListener("change", (event) => {
      filters.review = event.target.value;
      renderAssetGrid();
    });
    $("#usage-filter").addEventListener("change", (event) => {
      filters.usage = event.target.value;
      renderAssetGrid();
    });
    $("#favorite-filter").addEventListener("change", (event) => {
      filters.favorites = event.target.checked;
      renderAssetGrid();
    });
    renderAssetGrid();
  }
  if (assetId && library.assets.some((asset) => asset.id === assetId))
    inspect(assetId);
}
function draftFor(asset) {
  if (!drafts.has(asset.id)) {
    const meta = metaFor(asset.id);
    drafts.set(asset.id, {
      name: nameFor(asset),
      reviewStatus: reviewFor(asset),
      tags: (meta.tags || []).join(", "),
      notes: meta.notes || "",
    });
  }
  return drafts.get(asset.id);
}
function inspect(id) {
  selected = library.assets.find((asset) => asset.id === id);
  if (!selected) return;
  replacement = null;
  renderInspector();
  if (!$("#asset-dialog").open) $("#asset-dialog").showModal();
}
function renderInspector() {
  const asset = selected,
    meta = metaFor(asset.id),
    draft = draftFor(asset),
    history = meta.history || [];
  $("#asset-inspector").innerHTML =
    `<header class="dialog-head"><div><span class="eyebrow">${categories[asset.category]} · ${asset.usage === "active" ? "게임 사용 중" : asset.usage === "unlinked" ? "미연결" : "기존 보관"}</span><h2 id="asset-title">${esc(nameFor(asset))}</h2></div><button class="quiet" data-close="asset-dialog">닫기</button></header><div class="inspector-body"><div id="asset-preview" class="preview ${previewMode}"><img src="${assetUrl(asset)}" alt="${esc(nameFor(asset))}"></div><div class="preview-controls" aria-label="미리보기 배경">${[
      ["checkered", "투명 배경"],
      ["dark", "어둡게"],
      ["game", "게임 배경"],
    ]
      .map(
        ([key, label]) =>
          `<button data-preview="${key}" aria-pressed="${previewMode === key}">${label}</button>`,
      )
      .join(
        "",
      )}</div><dl class="asset-info"><div><dt>크기</dt><dd>${asset.width}×${asset.height}px</dd></div><div><dt>파일 용량</dt><dd>${bytes(asset.bytes)}</dd></div><div><dt>출처</dt><dd>${esc(meta.currentOrigin || asset.origin)}</dd></div><div><dt>파일 이름</dt><dd>${esc(asset.file)}</dd></div><div><dt>리소스 ID</dt><dd>${esc(asset.id)}</dd></div><div><dt>최근 관리</dt><dd>${esc(date(meta.updatedAt))}</dd></div></dl><div class="usage-row">사용 위치 ${asset.usedIn.map((text) => `<span class="badge">${esc(text)}</span>`).join("")}</div><form id="meta-form"><div class="form-row"><label>표시 이름<input id="meta-name" maxlength="100" value="${esc(draft.name)}" ${library.writable ? "" : "disabled"}></label><label>검토 상태<select id="meta-review" ${library.writable ? "" : "disabled"}>${Object.entries(
      reviewNames,
    )
      .map(
        ([key, label]) =>
          `<option value="${key}" ${draft.reviewStatus === key ? "selected" : ""}>${label}</option>`,
      )
      .join(
        "",
      )}</select></label></div><label>태그<input id="meta-tags" maxlength="800" placeholder="쉼표로 구분: 사막, 궁수, 다음 검토" value="${esc(draft.tags)}" ${library.writable ? "" : "disabled"}></label><label>함께 보는 메모<textarea id="meta-notes" maxlength="8000" placeholder="이 이미지의 용도, 바꿀 점, 확인할 내용을 남겨 주세요." ${library.writable ? "" : "disabled"}>${esc(draft.notes)}</textarea></label><div class="form-actions"><a href="${assetUrl(asset)}" download="${esc(asset.file)}">원본 파일 다운로드</a><div><span id="meta-hint" class="save-hint"></span> <button id="save-meta" class="primary" type="submit" ${library.writable ? "" : "disabled"}>메모 저장</button></div></div></form>${!library.writable ? '<p class="field-help">보기 전용입니다. 상단의 온라인 관리 열기에서 로그인하면 메모 저장과 이미지 교체를 사용할 수 있습니다. 로컬 관리 서버도 계속 사용할 수 있습니다.</p>' : ""}<section class="subsection"><h3>게임 이미지 교체</h3><p class="field-help">선택한 이미지를 먼저 비교합니다. 적용하면 기존 파일을 교체 이력에 보관하고, 게임을 다시 열 때 새 이미지를 사용합니다.</p>${asset.file.endsWith(".png") ? `<label class="file-field">교체할 PNG 선택<input id="replace-file" type="file" accept="image/png" ${library.writable ? "" : "disabled"}></label><div id="replacement-area"></div>` : '<p class="field-help">이 SVG 아이콘은 원본 파일을 내려받아 관리합니다.</p>'}<p id="inspector-error" class="error" role="alert"></p></section><section class="subsection"><h3>교체 이력 <span class="badge">${history.length}</span></h3>${history.length ? `<ul class="history-list">${history.map((row) => `<li><img src="../api/assets/${asset.id}/revisions/${row.id}" alt="이전 이미지"><p><strong>${esc(row.note)}</strong>${esc(date(row.at))} · ${bytes(row.bytes)}</p><button data-restore="${row.id}" ${library.writable ? "" : "disabled"}>이 버전 복원</button></li>`).join("")}</ul>` : '<p class="field-help">첫 교체를 적용하면 이전 이미지가 여기에 남습니다.</p>'}</section></div>`;
  $("#meta-form").addEventListener("input", () => {
    Object.assign(draft, {
      name: $("#meta-name").value,
      reviewStatus: $("#meta-review").value,
      tags: $("#meta-tags").value,
      notes: $("#meta-notes").value,
    });
    $("#meta-hint").textContent = "저장 전";
  });
  const actions=document.createElement('div');actions.className='form-actions';actions.innerHTML='<button type="button" data-resource-draft>초안 저장</button><button type="button" class="primary" data-resource-publish>라이브 게시</button><small>초안은 게임에 반영되지 않습니다. 라이브 게시 후 게임을 다시 열면 적용됩니다.</small>';$('#inspector-error').before(actions);
  $('[data-resource-draft]').onclick=()=>libraryControls.draft();$('[data-resource-publish]').onclick=()=>libraryControls.publish();
  $("#meta-form").addEventListener("submit", saveMeta);
  $("#replace-file")?.addEventListener("change", prepareReplacement);
}
async function saveMeta(event) {
  event.preventDefault();
  $("#save-meta").disabled = true;
  try {
    const draft = draftFor(selected),
      value = await callApi(`assets/${selected.id}/meta`, {
        ...draft,
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
    updateAsset(value);
    selected = value.asset;
    renderInspector();
    renderAssetGrid();
    toast("메모를 작업 폴더에 저장했습니다.");
    $("#save-meta").focus();
  } catch (error) {
    $("#inspector-error").textContent = error.message;
    $("#save-meta").disabled = false;
  }
}
async function readImage(file) {
  if (!file || file.type !== "image/png" || file.size > 5 * 1024 * 1024)
    throw new Error("5MB 이하의 PNG 이미지를 선택해 주세요.");
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  if (image.naturalWidth > 4096 || image.naturalHeight > 4096)
    throw new Error("이미지 한 변은 4096픽셀 이하여야 합니다.");
  return { dataUrl, width: image.naturalWidth, height: image.naturalHeight };
}
async function prepareReplacement(event) {
  try {
    replacement = await readImage(event.target.files[0]);
    $("#inspector-error").textContent = "";
    $("#replacement-area").innerHTML =
      `<div class="comparison-preview"><div><small>현재 ${selected.width}×${selected.height}</small><div class="preview checkered"><img src="${assetUrl(selected)}" alt="현재 이미지"></div></div><div><small>선택 ${replacement.width}×${replacement.height}</small><div class="preview checkered"><img src="${replacement.dataUrl}" alt="선택한 새 이미지"></div></div></div><button class="primary" id="apply-replacement">이 이미지로 교체</button>`;
  } catch (error) {
    replacement = null;
    $("#replacement-area").innerHTML = "";
    $("#inspector-error").textContent = error.message;
  }
}
async function applyReplacement() {
  if (!replacement) return;
  $("#apply-replacement").disabled = true;
  try {
    const value = await callApi(`assets/${selected.id}/replace`, {
      dataUrl: replacement.dataUrl,
    });
    updateAsset(value);
    selected = value.asset;
    replacement = null;
    renderInspector();
    renderAssetGrid();
    toast("교체했습니다. 이전 이미지는 이력에 보관했습니다.");
  } catch (error) {
    $("#inspector-error").textContent = error.message;
    $("#apply-replacement").disabled = false;
  }
}
async function restore(id) {
  try {
    const value = await callApi(`assets/${selected.id}/restore`, {
      revisionId: id,
    });
    updateAsset(value);
    selected = value.asset;
    renderInspector();
    renderAssetGrid();
    toast("선택한 이미지로 복원했습니다.");
  } catch (error) {
    $("#inspector-error").textContent = error.message;
  }
}

document.addEventListener("click", async (event) => {
  const inspectButton = event.target.closest("[data-inspect]");
  if (inspectButton) {
    inspect(inspectButton.dataset.inspect);
    return;
  }
  const close = event.target.closest("[data-close]");
  if (close) {
    document.getElementById(close.dataset.close).close();
    return;
  }
  const category = event.target.closest("[data-category]");
  if (category) {
    filters.category = category.dataset.category;
    document
      .querySelectorAll("[data-category]")
      .forEach((button) =>
        button.setAttribute("aria-pressed", button === category),
      );
    renderAssetGrid();
    return;
  }
  const pin = event.target.closest("[data-pin]");
  if (pin && library.writable) {
    try {
      const value = await callApi(`assets/${pin.dataset.pin}/meta`, {
        favorite: !metaFor(pin.dataset.pin).favorite,
      });
      updateAsset(value);
      renderAssetGrid();
    } catch (error) {
      toast(error.message);
    }
    return;
  }
  const preview = event.target.closest("[data-preview]");
  if (preview) {
    previewMode = preview.dataset.preview;
    $("#asset-preview").className = `preview ${previewMode}`;
    document
      .querySelectorAll("[data-preview]")
      .forEach((button) =>
        button.setAttribute("aria-pressed", button === preview),
      );
    return;
  }
  const restoreButton = event.target.closest("[data-restore]");
  if (restoreButton) {
    restoreButton.disabled = true;
    await restore(restoreButton.dataset.restore);
    return;
  }
  if (event.target.closest("#apply-replacement")) {
    applyReplacement();
    return;
  }
  if (event.target.closest("#clear-filters")) {
    Object.assign(filters, {
      search: "",
      category: "all",
      review: "all",
      usage: "all",
      favorites: false,
    });
    route();
    return;
  }
  if (event.target.closest("#open-add")) {
    $("#add-error").textContent = "";
    $("#add-dialog").showModal();
    return;
  }
});
$("#add-file").addEventListener("change", async (event) => {
  try {
    const image = await readImage(event.target.files[0]);
    $("#add-preview").innerHTML =
      `<img src="${image.dataUrl}" alt="추가할 리소스 미리보기">`;
    $("#add-preview").hidden = false;
    $("#add-error").textContent = "";
  } catch (error) {
    $("#add-error").textContent = error.message;
    $("#add-preview").hidden = true;
  }
});
$("#add-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#add-submit").disabled = true;
  try {
    const image = await readImage($("#add-file").files[0]),
      value = await callApi("assets", {
        name: $("#add-name").value,
        category: $("#add-category").value,
        dataUrl: image.dataUrl,
      });
    updateAsset(value);
    $("#add-dialog").close();
    $("#add-form").reset();
    $("#add-preview").hidden = true;
    renderAssetGrid();
    inspect(value.asset.id);
    toast("미연결 리소스로 추가했습니다.");
  } catch (error) {
    $("#add-error").textContent = error.message;
  } finally {
    $("#add-submit").disabled = false;
  }
});
$("#export-state").addEventListener("click", () =>
  download(
    "bloomguard-library-records.json",
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        assets: library.assets,
        state: library.state,
      },
      null,
      2,
    ),
  ),
);
$("#print-doc").addEventListener("click", () => window.print());
window.addEventListener("hashchange", () => {
  if ($("#asset-dialog").open) $("#asset-dialog").close();
  route();
  window.scrollTo(0, 0);
});

try {
  const response = await fetch("../api/library");
  if (response.ok) library = await response.json();
} catch {
  /* Static previews remain readable. */
}
try {
  const response = await fetch("qa-summary.json");
  if (response.ok) qa = await response.json();
} catch {
  /* Evidence can be generated after the first preview. */
}
$("#connection").textContent = library.writable
  ? "작업 폴더에 저장"
  : "보기 전용";
$("#nav-count").textContent = library.assets.length;
route();

async function saveResourceDraft(){if(!selected)throw Error('리소스 목록에서 편집할 이미지를 선택해 주세요.');if(!library.writable)throw Error('관리자 화면에서 리소스를 편집해 주세요.');const draft=draftFor(selected);let value=await callApi('assets/'+selected.id+'/meta',{...draft,tags:draft.tags.split(',').map(s=>s.trim()).filter(Boolean)});updateAsset(value);selected=value.asset;if(replacement){value=await callApi('assets/'+selected.id+'/replace',{dataUrl:replacement.dataUrl});updateAsset(value);selected=value.asset;replacement=null;}renderInspector();renderAssetGrid();toast('리소스 초안을 저장했습니다. 게임에는 반영되지 않습니다.');}
async function publishResource(){if(!selected)throw Error('게시할 리소스 이미지를 선택해 주세요.');if(!library.writable)throw Error('관리자 화면에서 게시해 주세요.');if(replacement||$('#meta-notes')?.value!==draftFor(selected).notes)throw Error('먼저 초안 저장을 눌러 현재 수정을 보관해 주세요.');const id=selected.id,sourceVersion=metaFor(id).version||0,r=await fetch('../api/live-resources/'+id,{cache:'no-store'}),current=await r.json();if(!r.ok)throw Error(current.error||'게시 정보를 읽지 못했습니다.');const dialog=document.createElement('dialog');dialog.className='publication-confirm';dialog.innerHTML='<form method="dialog"><h2>라이브로 게시할까요?</h2><p>선택한 PNG 이미지를 wokabe.xyz의 모든 이용자에게 게시합니다. 게임을 다시 열면 교체한 이미지가 적용됩니다. 연결되지 않은 리소스는 게임에서 사용하도록 지정해야 표시됩니다.</p><menu><button value="cancel">취소</button><button value="publish">확인 · 라이브 게시</button></menu></form>';document.body.append(dialog);const yes=await new Promise(resolve=>{dialog.onclose=()=>resolve(dialog.returnValue==='publish');dialog.showModal();});dialog.remove();if(!yes)return;await callApi('live-resources/'+id,{sourceVersion,expectedVersion:current.version});toast('라이브 게시 완료 · 모든 이용자에게 적용됩니다.');}
const libraryControls=publicationBar({label:'리소스 라이브러리 · 선택한 이미지',onStatus:toast,...(privateEditor()?{saveDraft:saveResourceDraft,publish:publishResource}:{editorUrl:()=>adminOrigin+'/library/'+location.hash})});
