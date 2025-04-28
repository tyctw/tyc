const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbSorTsWogiV_bXRXl5_YYyDufLtCvtMc-ARAL-QNd7SnL25mI09i0U6azal-RhR8hnA/exec';
let currentPage = 1;
const itemsPerPage = 10;
let allResults = [];
let comparisonList = [];

// 科系對應的類別和圖標
const departmentTypes = {
  "普通科": { class: "department-normal", icon: "fa-book" },
  "機械群": { class: "department-mechanical", icon: "fa-cogs" },
  "動力機械群": { class: "department-power", icon: "fa-car" },
  "電機與電子群": { class: "department-electrical", icon: "fa-bolt" },
  "化工群": { class: "department-chemical", icon: "fa-flask" },
  "土木與建築群": { class: "department-civil", icon: "fa-building" },
  "商業與管理群": { class: "department-business", icon: "fa-briefcase" },
  "外語群": { class: "department-language", icon: "fa-language" },
  "設計群": { class: "department-design", icon: "fa-palette" },
  "農業群": { class: "department-agriculture", icon: "fa-leaf" },
  "食品群": { class: "department-food", icon: "fa-utensils" },
  "家政群": { class: "department-home", icon: "fa-home" },
  "餐旅群": { class: "department-hospitality", icon: "fa-concierge-bell" }
};

// 分數對應的樣式
function getScoreClass(score) {
  if (score.includes('5A')) return 'score-a5';
  if (score.includes('4A')) return 'score-a4';
  if (score.includes('3A')) return 'score-a3';
  if (score.includes('2A') || score.includes('1A')) return 'score-a2';
  if (score.includes('B')) return 'score-b5';
  return '';
}

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
      card.classList.add('card');
      card.style.animationDelay = `${index * 0.1}s`;
      card.style.opacity = '0';

      const uniqueId = school.name + '-' + school.department + '-' + school.group + '-' + school.year;
      const isSelected = comparisonList.some(s => (s.name + '-' + s.department + '-' + s.group + '-' + s.year) === uniqueId);
      
      // 獲取科系樣式
      const deptInfo = departmentTypes[school.department] || { class: "", icon: "fa-graduation-cap" };
      const scoreClass = getScoreClass(school.score);

      card.innerHTML = `
        <div class="school-name">${school.name}</div>
        <div class="school-info">
          <div class="school-department ${deptInfo.class}">
            <div class="department-icon"><i class="fas ${deptInfo.icon}"></i></div>
            <span>${school.department}</span>
          </div>
          <div class="school-group">
            <div class="group-icon"><i class="fas fa-tags"></i></div>
            <span>${school.group}</span>
          </div>
          <div class="school-score">
            <div class="score-icon"><i class="fas fa-chart-line"></i></div>
            <span>錄取分數：</span>${school.score}
            <span class="score-badge ${scoreClass}">${school.score}</span>
          </div>
        </div>
        <button class="compare-toggle ${isSelected ? 'selected' : ''}">${isSelected ? '✓' : '+'}</button>
      `;

      const compareBtn = card.querySelector('.compare-toggle');
      compareBtn.addEventListener('click', () => {
        const uniqueId = school.name + '-' + school.department + '-' + school.group + '-' + school.year;
        const idx = comparisonList.findIndex(s => (s.name + '-' + s.department + '-' + s.group + '-' + s.year) === uniqueId);
        if (idx === -1) {
          comparisonList.push(school);
          compareBtn.textContent = '✓';
          compareBtn.classList.add('selected');
        } else {
          comparisonList.splice(idx, 1);
          compareBtn.textContent = '+';
          compareBtn.classList.remove('selected');
        }
        updateComparisonPanel();
      });

      resultContainer.appendChild(card);
      
      // 淡入動畫效果
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      }, 50 + (index * 100));
    });

    updatePaginationButtons();
    pageInfo.textContent = `第 ${page} 頁，共 ${Math.ceil(results.length / itemsPerPage)} 頁`;
  }
}

function updatePaginationButtons() {
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');
  
  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= Math.ceil(allResults.length / itemsPerPage);
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
    window.scrollTo({top: 0, behavior: 'smooth'});
  }
});

document.getElementById('nextPage').addEventListener('click', function() {
  if (currentPage < Math.ceil(allResults.length / itemsPerPage)) {
    currentPage++;
    displayResults(allResults, currentPage);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }
});

const toggleViewButton = document.getElementById('toggleView');
toggleViewButton.addEventListener('click', function() {
  document.body.classList.toggle('mobile-view');
  if (document.body.classList.contains('mobile-view')) {
    this.textContent = '💻';
    this.title = '切換到桌面版';
  } else {
    this.textContent = '📱';
    this.title = '切換到行動版';
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
const menuBackdrop = document.querySelector('.menu-backdrop');
let isMenuOpen = false;

function toggleMenu() {
  isMenuOpen = !isMenuOpen;
  menuToggle.classList.toggle('open');
  navLinks.classList.toggle('active');
  menuBackdrop.classList.toggle('active');
  document.body.classList.toggle('menu-open');
  
  const menuLinks = document.querySelectorAll('.nav-links .menu-content a');
  
  if (isMenuOpen) {
    // 菜單項動畫
    menuLinks.forEach((link, index) => {
      link.style.transitionDelay = `${0.1 + (index * 0.08)}s`;
    });
  } else {
    // 重置延遲
    menuLinks.forEach(link => {
      link.style.transitionDelay = '0s';
    });
  }
}

menuToggle.addEventListener('click', toggleMenu);
const desktopMenuButton = document.querySelector('.desktop-menu-button');

desktopMenuButton.addEventListener('click', toggleMenu);

menuBackdrop.addEventListener('click', () => {
  if (isMenuOpen) {
    toggleMenu();
  }
});

// 鍵盤支持
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && isMenuOpen) {
    toggleMenu();
  }
});

// 為菜單項添加滑動效果
const menuItems = document.querySelectorAll('.nav-links .menu-content a');
menuItems.forEach(item => {
  item.addEventListener('mouseover', function() {
    const arrow = this.querySelector('.arrow');
    if (arrow) {
      arrow.style.opacity = '1';
      arrow.style.transform = 'translateX(0)';
    }
  });
  
  item.addEventListener('mouseout', function() {
    const arrow = this.querySelector('.arrow');
    if (arrow) {
      arrow.style.opacity = '0';
      arrow.style.transform = 'translateX(-10px)';
    }
  });
  
  // 點擊菜單項關閉菜單
  item.addEventListener('click', function() {
    if (isMenuOpen) {
      toggleMenu();
    }
  });
});

document.addEventListener('click', function(e) {
  if (isMenuOpen &&
      !menuToggle.contains(e.target) && 
      !navLinks.contains(e.target) && 
      !desktopMenuButton.contains(e.target) && 
      !e.target.classList.contains('menu-backdrop')) {
    toggleMenu();
  }
});

// 添加跳動動畫
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function() {
  const loadingOverlay = document.querySelector('.loading-overlay');

  fetch(`${SCRIPT_URL}?action=getAll&year=113`)
    .then(response => response.json())
    .then(data => {
      allResults = data;
      displayResults(allResults, currentPage);
      setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.pointerEvents = 'none';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }, 800);
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('resultMessage').textContent = '載入資料時發生錯誤，請稍後再試。';
      setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.pointerEvents = 'none';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }, 800);
    });

  document.getElementById('compareButton').addEventListener('click', () => {
    openCompareModal();
  });

  document.getElementById('clearComparison').addEventListener('click', () => {
    comparisonList = [];
    updateComparisonPanel();
    document.querySelectorAll('.compare-toggle.selected').forEach(btn => {
      btn.textContent = '+';
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
    toggleViewButton.title = '切換到桌面版';
  } else {
    document.body.classList.remove('mobile-view');
    toggleViewButton.textContent = '📱';
    toggleViewButton.title = '切換到行動版';
  }
});

if (window.innerWidth <= 768) {
  document.body.classList.add('mobile-view');
  toggleViewButton.textContent = '💻';
  toggleViewButton.title = '切換到桌面版';
}

function updateComparisonPanel() {
  const comparisonPanel = document.getElementById('comparisonPanel');
  const countSpan = document.getElementById('comparisonCount');
  countSpan.textContent = comparisonList.length;
  const compareButton = document.getElementById('compareButton');
  compareButton.disabled = comparisonList.length < 2;
  
  if (comparisonList.length > 0) {
    comparisonPanel.classList.add('active');
  } else {
    comparisonPanel.classList.remove('active');
  }
}

function openCompareModal() {
  const container = document.getElementById('compareTableContainer');
  const modal = document.getElementById('compareModal');
  const groups = {};
  comparisonList.forEach(school => {
    const year = school.year ? school.year : '未知';
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(school);
  });
  let html = `<div class="compare-columns">`;
  const sortedYears = Object.keys(groups).sort((a, b) => b - a);
  sortedYears.forEach(year => {
    html += `<div class="compare-column">`;
    html += `<h3>${year}年</h3>`;
    html += '<table><thead><tr><th>學校名稱</th><th>群別</th><th>科系群</th><th>分數</th></tr></thead><tbody>';
    groups[year].forEach(school => {
      const deptInfo = departmentTypes[school.department] || { class: "", icon: "fa-graduation-cap" };
      const scoreClass = getScoreClass(school.score);
      
      html += `<tr>
                 <td>${school.name}</td>
                 <td><div class="td-with-icon ${deptInfo.class}"><i class="fas ${deptInfo.icon}"></i> ${school.department}</div></td>
                 <td>${school.group}</td>
                 <td><span class="score-badge ${scoreClass}">${school.score}</span></td>
               </tr>`;
    });
    html += '</tbody></table></div>';
  });
  html += `</div>`;
  container.innerHTML = html;
  modal.classList.add('active');
}