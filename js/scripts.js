document.addEventListener('DOMContentLoaded', () => {
    // This is the main entry point. It checks which page we are on and initializes the correct functionality.

    // Check for elements unique to certain pages
    const semesterGrid = document.querySelector('.semester-grid');
    const courseList = document.querySelector('.course-list');
    const tabContainer = document.querySelector('.tab-content');

    // Always initialize theme toggle
    initThemeToggle();

    if (semesterGrid) {
        // This is the main index.html page
        loadSemesters();
        initShieldRandomizer(); // Randomize shield color on homepage
        initHeroShieldRandomizer();
    } else if (courseList) {
        // This is a semester index page (e.g., /semester1/index.html)
        loadCoursesForSemester();
        initCourseSearch();
    } else if (tabContainer) {
        // This is a course detail page with tabs
        initCourseTabPage();
    }

    loadMotdFooter();
});

function loadMotdFooter() {
    const motdElement = document.getElementById('motd-footer');
    if (!motdElement) {
        console.log('MOTD element not found.');
        return;
    }
    console.log('loadMotdFooter called. Fetching MOTD data...');
    fetch(window.location.pathname.includes('/semester') || window.location.pathname.includes('/course') ? '../js/motd.json' : 'js/motd.json') // Conditional relative path
        .then(response => {
            console.log('MOTD fetch response:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(messages => {
            console.log('MOTD messages loaded:', messages);
            if (messages && messages.length > 0) {
                const randomIndex = Math.floor(Math.random() * messages.length);
                motdElement.textContent = messages[randomIndex];
            }
        })
        .catch(error => {
            console.error('Error loading MOTD data:', error);
            motdElement.textContent = 'Made With ♥ For RKS 3A.'; // Fallback
        });
}

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;

    if (!themeToggle) return;

    const currentTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

function initHeroShieldRandomizer() {
    const shieldLogo = document.getElementById('hero-shield-logo');
    if (!shieldLogo) return;

    const accentColors = [
        '#ff4b5c', '#ffc107', '#00d2ff', '#28a745', '#e83e8c', '#17a2b8', '#fd7e14'
    ];

    shieldLogo.addEventListener('click', (e) => {
        const randomColor = accentColors[Math.floor(Math.random() * accentColors.length)];
        shieldLogo.style.color = randomColor;

        // Trigger confetti
        if (typeof confetti === 'function') {
            const rect = shieldLogo.getBoundingClientRect();
            const origin = {
                x: (rect.left + rect.right) / 2 / window.innerWidth,
                y: (rect.top + rect.bottom) / 2 / window.innerHeight
            };

            confetti({
                particleCount: 100,
                spread: 70,
                origin: origin,
                colors: [randomColor]
            });
        }
    });
}

function initShieldRandomizer() {
    const shieldLogo = document.getElementById('shield-logo');
    if (!shieldLogo) return;

    const accentColors = [
        '#ff4b5c', '#ffc107', '#00d2ff', '#28a745', '#e83e8c', '#17a2b8', '#fd7e14'
    ];

    shieldLogo.addEventListener('click', (e) => {
        // We don't prevent default because the parent 'a' tag should still navigate to index.html
        const randomColor = accentColors[Math.floor(Math.random() * accentColors.length)];
        shieldLogo.style.color = randomColor;
    });
}

function loadSemesters() {
    const semesterGrid = document.querySelector('.semester-grid');
    console.log('loadSemesters called');
    fetch('js/data.json') // Relative path for root page
        .then(response => {
            console.log('Fetched data.json response:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Semester data loaded:', data);
            semesterGrid.innerHTML = '';
            data.forEach(semester => {
                // Only display Semester 1
                if (semester.semester === 1) {
                    console.log('Displaying Semester 1:', semester);
                    const card = document.createElement('article');
                    card.className = 'semester-card';
                    card.setAttribute('onclick', `window.location.href='${semester.folder}/'`);
                    card.innerHTML = `
                    <div class="card-content">
                        <h3 class="card-title">Semester ${semester.semester}</h3>
                        <p class="card-subtitle">${semester.courses.length} mata kuliah tersedia</p>
                        <div class="card-arrow"><i class="fas fa-arrow-right"></i></div>
                    </div>
                `;
                    semesterGrid.appendChild(card);
                }
            });
            if (data.every(s => s.semester !== 1)) {
                console.log('Semester 1 not found in data.json or not displayed.');
            }
        })
        .catch(error => {
            console.error('Error loading semester data:', error);
            semesterGrid.innerHTML = '<p>Gagal memuat data semester.</p>';
        });
}

function loadCoursesForSemester() {
    const courseList = document.querySelector('.course-list');
    const semesterMatch = document.title.match(/Semester (\d+)/);
    if (!semesterMatch) return;

    const currentSemesterNumber = parseInt(semesterMatch[1], 10);

    fetch('../js/data.json') // Relative path for nested pages
        .then(response => response.json())
        .then(data => {
            const semesterData = data.find(s => s.semester === currentSemesterNumber);
            if (semesterData && semesterData.courses) {
                courseList.innerHTML = '';
                semesterData.courses.forEach(course => {
                    const materials = course.materials || [];
                    const teoriCount = materials.filter(m => m.type === 'Teori').length;
                    const praktikumCount = materials.filter(m => m.type === 'Praktikum').length;

                    const tagsHTML = `
                        <div class="course-tags">
                            <span class="course-tag theory">Teori: ${teoriCount}</span>
                            <span class="course-tag praktikum">Praktikum: ${praktikumCount}</span>
                        </div>
                    `;

                    const card = document.createElement('article');
                    card.className = 'course-card';
                    card.setAttribute('onclick', `window.location.href='${course.url}'`);
                    card.innerHTML = `
                        <div class="course-icon"><i class="fas fa-book"></i></div>
                        <div class="course-content">
                            <h2 class="course-title">${course.name}</h2>
                            ${tagsHTML}
                        </div>
                        <div class="course-arrow"><i class="fas fa-arrow-right"></i></div>
                    `;
                    courseList.appendChild(card);
                });
            }
        })
        .catch(error => {
            console.error('Error loading course data:', error);
            courseList.innerHTML = '<p>Gagal memuat data mata kuliah.</p>';
        });
}

function initCourseSearch() {
    const searchInput = document.getElementById('course-search');
    const courseList = document.querySelector('.course-list');
    if (!searchInput || !courseList) return;

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const courseCards = courseList.querySelectorAll('.course-card');

        courseCards.forEach(card => {
            const title = card.querySelector('.course-title').textContent.toLowerCase();
            if (title.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

function initCourseTabPage() {
    // 1. Initialize Tab Switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // 2. Load Content
    const currentPageFileName = window.location.pathname.split('/').pop();
    console.log('Current Page File Name:', currentPageFileName);
    fetch('../js/data.json') // Relative path for nested pages
        .then(response => response.json())
        .then(data => {
            let courseData = null;
            for (const semester of data) {
                const foundCourse = semester.courses.find(c => c.url === currentPageFileName);
                if (foundCourse) {
                    courseData = foundCourse;
                    break;
                }
            }
            console.log('Course Data Found:', courseData);

            if (!courseData) throw new Error('Course data not found!');

            populateOverviewTab(courseData);
            populateMaterialTabs(courseData);
            initMaterialSearch(); // Activate search functionality after content is loaded
        })
        .catch(error => {
            console.error('Failed to load course tab data:', error);
            document.querySelector('.tab-content').innerHTML = '<p>Gagal memuat konten mata kuliah.</p>';
        });
}

function initMaterialSearch() {
    const setupSearch = (inputId, gridSelector) => {
        const searchInput = document.getElementById(inputId);
        if (!searchInput) return;

        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const grid = document.querySelector(gridSelector);
            const cards = grid.querySelectorAll('.material-card');
            
            cards.forEach(card => {
                const title = card.querySelector('.material-title').textContent.toLowerCase();
                if (title.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    };

    setupSearch('teori-search', '#teori .materials-grid');
    setupSearch('praktikum-search', '#praktikum .materials-grid');
}

function populateOverviewTab(courseData) {
    const overviewPanel = document.getElementById('overview');
    const materials = courseData.materials || [];
    const teoriMaterials = materials.filter(m => m.type === 'Teori');
    const praktikumMaterials = materials.filter(m => m.type === 'Praktikum');

    overviewPanel.innerHTML = `
        <div class="overview-card">
            <div class="overview-icon"><i class="fas fa-book"></i></div>
            <h2 class="overview-title">${courseData.name}</h2>
            <p class="overview-description">${courseData.overview || 'Deskripsi tidak tersedia.'}</p>
            <div class="overview-stats">
                <div class="stat-item"><span class="stat-number">${materials.length}</span><span class="stat-label">Total</span></div>
                <div class="stat-item"><span class="stat-number">${teoriMaterials.length}</span><span class="stat-label">Teori</span></div>
                <div class="stat-item"><span class="stat-number">${praktikumMaterials.length}</span><span class="stat-label">Praktikum</span></div>
            </div>
        </div>
        <div class="category-cards">
            <div class="category-card" onclick="switchTab('teori')">
                <div class="category-icon"><i class="fas fa-book-open"></i></div>
                <h3 class="category-title">Materi Teori</h3>
                <div class="category-button">${teoriMaterials.length} materi</div>
            </div>
            <div class="category-card" onclick="switchTab('praktikum')">
                <div class="category-icon"><i class="fas fa-laptop-code"></i></div>
                <h3 class="category-title">Materi Praktikum</h3>
                <div class="category-button">${praktikumMaterials.length} materi</div>
            </div>
        </div>
    `;
}

function populateMaterialTabs(courseData) {
    const materials = courseData.materials || [];
    const teoriGrid = document.querySelector('#teori .materials-grid');
    const praktikumGrid = document.querySelector('#praktikum .materials-grid');

    teoriGrid.innerHTML = '';
    praktikumGrid.innerHTML = '';

    const teoriMaterials = materials.filter(m => m.type === 'Teori');
    const praktikumMaterials = materials.filter(m => m.type === 'Praktikum');

    if (teoriMaterials.length > 0) {
        teoriMaterials.forEach(m => teoriGrid.appendChild(createMaterialCard(m)));
    } else {
        teoriGrid.innerHTML = '<p class="empty-message">Belum ada materi teori.</p>';
    }

    if (praktikumMaterials.length > 0) {
        praktikumMaterials.forEach(m => praktikumGrid.appendChild(createMaterialCard(m)));
    } else {
        praktikumGrid.innerHTML = '<p class="empty-message">Belum ada materi praktikum.</p>';
    }
}

function createMaterialCard(material) {
    const card = document.createElement('article');
    card.className = 'material-card';

    const previewUrl = `https://drive.google.com/file/d/${material.driveId}/view`;

    card.innerHTML = `
        <div class="material-category">${material.type}</div>
        <h3 class="material-title">${material.title}</h3>
        <div class="material-date">
            <i class="fas fa-calendar"></i>
            <span>${material.uploadDate || 'Tanggal tidak tersedia'}</span>
        </div>
        <div class="material-actions">
            <button class="action-button view" onclick="window.open('${previewUrl}', '_blank')">
                <i class="fas fa-external-link-alt"></i>
                Lihat
            </button>
            <button class="action-button download">
                <i class="fas fa-download"></i>
                Download
            </button>
        </div>
    `;

    card.querySelector('.download').addEventListener('click', () => {
        downloadMaterial(material.driveId, material.title);
    });

    return card;
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function downloadMaterial(fileId, fileName) {
    if (fileId && fileId !== 'YOUR_DRIVE_ID_HERE' && !fileId.includes('YOUR_DRIVE_ID_HERE')) {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`Mengunduh ${fileName}...`, 'success');
    } else {
        showNotification('File untuk materi ini belum tersedia.', 'error');
    }
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<div class="notification-content"><i class="fas fa--${type === 'success' ? 'check-circle' : 'info-circle'}"></i><span>${message}</span></div>`;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
