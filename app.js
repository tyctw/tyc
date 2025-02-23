const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbSorTsWogiV_bXRXl5_YYyDufLtCvtMc-ARAL-QNd7SnL25mI09i0U6azal-RhR8hnA/exec';
let currentPage = 1;
const itemsPerPage = 10;
let allResults = [];
let comparisonList = [];

function displayResults(results, page = 1) {
  const resultContainer = document.getElementById('resultContainer');
  const resultMessage = document.getElementById('resultMessage');
  const pageInfo = document.getElementById('pageInfo');
  resultContainer.innerHTML = '';

  if (results.length === 0) {
    resultMessage.textContent = '沒有符合條件的結果';
    document.querySelector('.pagination').style.display = 'none';
  } else {
    resultMessage.textContent = '';
    document.querySelector('.pagination').style.display = 'flex';

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageResults = results.slice(startIndex, endIndex);

    pageResults.forEach((school, index) => {
      const card = document.createElement('div');
      card.classList.add('card', 'fade-in');
      card.style.animationDelay = `${index * 0.1}s`;

      const uniqueId = school.name + '-' + school.department + '-' + school.group + '-' + school.year;
      const isSelected = comparisonList.some(s => (s.name + '-' + s.department + '-' + s.group + '-' + s.year) === uniqueId);

      card.innerHTML = `
        <div class="school-name">${school.name}</div>
        <div class="school-info">
          <div>
            <div>${school.department}</div>
            <div>${school.group}</div>
          </div>
          <div class="school-score">${school.score}</div>
        </div>
        <button class="compare-toggle">${isSelected ? '取消比較' : '加入比較'}</button>
      `;

      const compareBtn = card.querySelector('.compare-toggle');
      compareBtn.addEventListener('click', () => {
        const uniqueId = school.name + '-' + school.department + '-' + school.group + '-' + school.year;
        const idx = comparisonList.findIndex(s => (s.name + '-' + s.department + '-' + s.group + '-' + s.year) === uniqueId);
        if (idx === -1) {
          comparisonList.push(school);
          compareBtn.textContent = '取消比較';
          compareBtn.classList.add('selected');
        } else {
          comparisonList.splice(idx, 1);
          compareBtn.textContent = '加入比較';
          compareBtn.classList.remove('selected');
        }
        updateComparisonPanel();
      });

      resultContainer.appendChild(card);
    });

    pageInfo.textContent = `第 ${page} 頁，共 ${Math.ceil(results.length / itemsPerPage)} 頁`;
  }
}

document.getElementById('searchForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const year = document.getElementById('year').value;
  const schoolName = document.getElementById('schoolName').value;
  const department = document.getElementById('department').value;
  const minScore = document.getElementById('minScore').value;

  const searchOverlay = document.querySelector('.search-overlay');
  searchOverlay.classList.add('active');

  const url = `${SCRIPT_URL}?action=search&year=${encodeURIComponent(year)}&schoolName=${encodeURIComponent(schoolName)}&department=${encodeURIComponent(department)}&minScore=${encodeURIComponent(minScore)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      allResults = data;
      currentPage = 1;
      displayResults(allResults, currentPage);
      searchOverlay.classList.remove('active');
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('resultMessage').textContent = '搜尋時發生錯誤，請稍後再試。';
      searchOverlay.classList.remove('active');
    });
});

document.getElementById('prevPage').addEventListener('click', function() {
  if (currentPage > 1) {
    currentPage--;
    displayResults(allResults, currentPage);
  }
});

document.getElementById('nextPage').addEventListener('click', function() {
  if (currentPage < Math.ceil(allResults.length / itemsPerPage)) {
    currentPage++;
    displayResults(allResults, currentPage);
  }
});

const toggleViewButton = document.getElementById('toggleView');
toggleViewButton.addEventListener('click', function() {
  document.body.classList.toggle('mobile-view');
  if (document.body.classList.contains('mobile-view')) {
    this.textContent = '💻';
  } else {
    this.textContent = '📱';
  }
  displayResults(allResults, currentPage);
});

window.addEventListener('contextmenu', function (e) {
  e.preventDefault();
});

document.addEventListener('selectstart', function (e) {
  e.preventDefault();
});

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

function toggleMenu() {
  menuToggle.classList.toggle('open');
  navLinks.classList.toggle('active');
  document.body.classList.toggle('menu-open');
}

menuToggle.addEventListener('click', toggleMenu);
const desktopMenuButton = document.querySelector('.desktop-menu-button');

desktopMenuButton.addEventListener('click', toggleMenu);

document.addEventListener('click', function(e) {
  if (!menuToggle.contains(e.target) && !navLinks.contains(e.target) && !desktopMenuButton.contains(e.target)) {
    menuToggle.classList.remove('open');
    navLinks.classList.remove('active');
    document.body.classList.remove('menu-open');
  }
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', function() {
    toggleMenu();
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const loadingOverlay = document.querySelector('.loading-overlay');

  fetch(`${SCRIPT_URL}?action=getAll&year=113`)
    .then(response => response.json())
    .then(data => {
      allResults = data;
      displayResults(allResults, currentPage);
      loadingOverlay.classList.add('fade-out');
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 500);
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('resultMessage').textContent = '載入資料時發生錯誤，請稍後再試。';
      loadingOverlay.classList.add('fade-out');
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 500);
    });

  document.getElementById('compareButton').addEventListener('click', () => {
    openCompareModal();
  });

  document.getElementById('clearComparison').addEventListener('click', () => {
    comparisonList = [];
    updateComparisonPanel();
    document.querySelectorAll('.compare-toggle.selected').forEach(btn => {
      btn.textContent = '加入比較';
      btn.classList.remove('selected');
    });
  });

  document.getElementById('closeCompareModal').addEventListener('click', () => {
    document.getElementById('compareModal').classList.remove('active');
  });

  document.getElementById('compareModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('compareModal')) {
      document.getElementById('compareModal').classList.remove('active');
    }
  });
});

window.addEventListener('resize', function() {
  if (window.innerWidth <= 768) {
    document.body.classList.add('mobile-view');
    toggleViewButton.textContent = '💻';
  } else {
    document.body.classList.remove('mobile-view');
    toggleViewButton.textContent = '📱';
  }
});

if (window.innerWidth <= 768) {
  document.body.classList.add('mobile-view');
  toggleViewButton.textContent = '💻';
}

function updateComparisonPanel() {
  const countSpan = document.getElementById('comparisonCount');
  countSpan.textContent = comparisonList.length;
  const compareButton = document.getElementById('compareButton');
  compareButton.disabled = comparisonList.length < 2;
}

function openCompareModal() {
  const container = document.getElementById('compareTableContainer');
  const groups = {};
  comparisonList.forEach(school => {
    const year = school.year ? school.year : '未知';
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(school);
  });
  let html = '';
  const sortedYears = Object.keys(groups).sort((a, b) => b - a);
  sortedYears.forEach(year => {
    html += `<h3>${year}年</h3>`;
    html += '<table><thead><tr><th>學校名稱</th><th>群別</th><th>科系群</th><th>分數</th></tr></thead><tbody>';
    groups[year].forEach(school => {
      html += `<tr>
                 <td>${school.name}</td>
                 <td>${school.department}</td>
                 <td>${school.group}</td>
                 <td>${school.score}</td>
               </tr>`;
    });
    html += '</tbody></table>';
  });
  container.innerHTML = html;
  document.getElementById('compareModal').classList.add('active');
}