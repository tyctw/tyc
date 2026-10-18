const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbSorTsWogiV_bXRXl5_YYyDufLtCvtMc-ARAL-QNd7SnL25mI09i0U6azal-RhR8hnA/exec';
const $ = (selector) => document.querySelector(selector);
const itemsPerPage = 10;
let currentPage = 1;
let allResults = [];
let comparisonList = [];
let requestController;
let activeFilters = { year: '113', schoolName: '', department: '', minScore: '' };
const schoolIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-6 9 6M5 10v10h14V10M2 20h20M9 20v-6h6v6M10 9h4M12 4V1l5 1-5 2"/><path d="M7 12h1m8 0h1"/></svg>';
const schoolKey = (school) => JSON.stringify([school.name, school.department, school.group, school.year]);
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function displayResults() {
  const container = $('#resultContainer');
  container.replaceChildren();
  $('#resultCount').textContent = allResults.length;
  const filters = [`${activeFilters.year} 學年度`, activeFilters.department || '全部群別'];
  if (activeFilters.schoolName) filters.push(`「${activeFilters.schoolName}」`);
  if (activeFilters.minScore) filters.push(`${activeFilters.minScore} 以上`);
  $('#resultSummary').textContent = `${filters.join(' · ')}，共 ${allResults.length} 筆錄取資料`;
  $('#resultMessage').textContent = allResults.length ? '' : '找不到符合條件的學校，試試調整篩選條件。';
  $('.pagination').hidden = !allResults.length;
  $('.table-heading').hidden = !allResults.length;
  const start = (currentPage - 1) * itemsPerPage;
  allResults.slice(start, start + itemsPerPage).forEach((school) => {
    const selected = comparisonList.some((item) => schoolKey(item) === schoolKey(school));
    const card = document.createElement('article');
    card.className = 'school-row';
    card.innerHTML = `<div class="school-main"><span class="school-icon">${schoolIcon}</span><div><div class="school-name">${escapeHTML(school.name)}</div><div class="school-course">${escapeHTML(school.group)} <span aria-hidden="true">·</span> ${escapeHTML(school.year || activeFilters.year)} 學年度</div></div></div><span class="school-group">${escapeHTML(school.department)}</span><div class="school-score"><span class="score-badge${/^[45]A/.test(String(school.score)) ? ' score-high' : ''}">${escapeHTML(school.score)}</span></div><button class="compare-toggle${selected ? ' selected' : ''}" aria-pressed="${selected}" aria-label="${selected ? '移除比較' : '加入比較'}：${escapeHTML(school.name)} ${escapeHTML(school.group)}">${selected ? '✓' : '+'}</button>`;
    card.querySelector('button').addEventListener('click', () => {
      const index = comparisonList.findIndex((item) => schoolKey(item) === schoolKey(school));
      if (index === -1) comparisonList.push(school);
      else comparisonList.splice(index, 1);
      updateComparisonPanel();
      const button = card.querySelector('button');
      const nowSelected = index === -1;
      button.classList.toggle('selected', nowSelected);
      button.textContent = nowSelected ? '✓' : '+';
      button.setAttribute('aria-pressed', String(nowSelected));
      button.setAttribute('aria-label', `${nowSelected ? '移除比較' : '加入比較'}：${school.name} ${school.group}`);
    });
    container.append(card);
  });
  $('#pageInfo').textContent = `${currentPage} / ${Math.max(1, Math.ceil(allResults.length / itemsPerPage))}`;
  $('#resultRange').textContent = `顯示 ${start + 1}–${Math.min(start + itemsPerPage, allResults.length)} 筆，共 ${allResults.length} 筆`;
  $('#prevPage').disabled = currentPage <= 1;
  $('#nextPage').disabled = currentPage * itemsPerPage >= allResults.length;
}

async function searchSchools() {
  requestController?.abort();
  const controller = new AbortController();
  requestController = controller;
  const filters = Object.fromEntries(new FormData($('#searchForm')));
  filters.schoolName = filters.schoolName.trim();
  const params = new URLSearchParams({ action: 'search', ...filters });
  const submit = $('.search-button');
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 25000);
  submit.disabled = true;
  submit.innerHTML = '<span class="spinner"></span> 正在查詢…';
  $('.results-panel').setAttribute('aria-busy', 'true');
  $('#resultContainer').replaceChildren();
  $('#resultCount').textContent = '—';
  $('#resultSummary').textContent = `正在查詢 ${filters.year} 學年度資料`;
  $('.pagination').hidden = true;
  $('.table-heading').hidden = true;
  $('#resultMessage').innerHTML = '<span class="spinner"></span> 正在載入學校資料…';
  try {
    const response = await fetch(`${SCRIPT_URL}?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('資料格式錯誤');
    allResults = data.map((school) => ({ ...school, year: String(school.year || filters.year) }));
    activeFilters = filters;
    currentPage = 1;
    displayResults();
  } catch (error) {
    if (error.name === 'AbortError' && !timedOut) return;
    allResults = [];
    $('#resultSummary').textContent = '暫時無法取得錄取資料';
    $('#resultMessage').replaceChildren();
    const message = document.createElement('p');
    message.textContent = timedOut ? '連線逾時，請稍後重新查詢。' : '載入資料時發生錯誤，請確認網路連線後重試。';
    const retry = document.createElement('button');
    retry.className = 'primary-button';
    retry.textContent = '重新載入';
    retry.addEventListener('click', searchSchools);
    $('#resultMessage').append(message, retry);
  } finally {
    clearTimeout(timeout);
    if (requestController === controller) {
      submit.disabled = false;
      submit.innerHTML = '<span aria-hidden="true">⌕</span> 查詢錄取分數 <span aria-hidden="true">→</span>';
      $('.results-panel').setAttribute('aria-busy', 'false');
    }
  }
}

$('#searchForm').addEventListener('submit', (event) => { event.preventDefault(); searchSchools(); });
$('#resetFilters').addEventListener('click', () => { $('#searchForm').reset(); searchSchools(); });
for (const [id, direction] of [['prevPage', -1], ['nextPage', 1]]) {
  $(`#${id}`).addEventListener('click', () => {
    currentPage += direction;
    displayResults();
    $('.results-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
for (const [id, grid] of [['listView', false], ['gridView', true]]) {
  $(`#${id}`).addEventListener('click', () => {
    $('.results-panel').classList.toggle('grid-mode', grid);
    for (const button of document.querySelectorAll('.view-options button')) {
      const active = button.id === id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
  });
}
function updateComparisonPanel() {
  $('#comparisonPanel').hidden = !comparisonList.length;
  $('#comparisonCount').textContent = comparisonList.length;
  $('#compareButton').disabled = comparisonList.length < 2;
  document.body.style.paddingBottom = comparisonList.length ? '80px' : '';
}
$('#clearComparison').addEventListener('click', () => {
  comparisonList = [];
  updateComparisonPanel();
  document.querySelectorAll('.compare-toggle.selected').forEach((button) => {
    button.textContent = '+';
    button.classList.remove('selected');
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', button.getAttribute('aria-label').replace('移除比較', '加入比較'));
  });
});
$('#compareButton').addEventListener('click', () => {
  $('#compareTableContainer').innerHTML = `<div class="comparison-table-wrap"><table><caption>已選擇 ${comparisonList.length} 筆學校錄取資料</caption><thead><tr><th scope="col">學校名稱</th><th scope="col">年度</th><th scope="col">群別</th><th scope="col">科系</th><th scope="col">錄取分數</th></tr></thead><tbody>${comparisonList.map((school) => `<tr><td>${escapeHTML(school.name)}</td><td>${escapeHTML(school.year)}</td><td>${escapeHTML(school.department)}</td><td>${escapeHTML(school.group)}</td><td><span class="score-badge">${escapeHTML(school.score)}</span></td></tr>`).join('')}</tbody></table></div>`;
  $('#compareModal').showModal();
});
document.querySelectorAll('[data-open]').forEach((button) => {
  button.addEventListener('click', () => { closeMenu(); document.getElementById(button.dataset.open).showModal(); });
});
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('.close-modal').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
});
function closeMenu() {
  $('#navigation').classList.remove('active');
  $('.menu-toggle').setAttribute('aria-expanded', 'false');
  $('.menu-toggle').setAttribute('aria-label', '開啟導覽選單');
}
$('.menu-toggle').addEventListener('click', () => {
  const open = $('#navigation').classList.toggle('active');
  $('.menu-toggle').setAttribute('aria-expanded', String(open));
  $('.menu-toggle').setAttribute('aria-label', open ? '關閉導覽選單' : '開啟導覽選單');
});
document.querySelectorAll('#navigation a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
searchSchools();

// Show the service transition notice on each page visit; historical lookup remains available.
$('#continueHistorical').addEventListener('click', () => $('#updateNoticeModal').close());
$('#updateNoticeModal').showModal();
