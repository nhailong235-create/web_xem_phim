// --- CẤU HÌNH BIẾN TOÀN CỤC ---
const API_BASE_URL = "http://127.0.0.1:8000";

let moviesRandom = [];
let current = 0;
let top20movie = [];
let ngontinh = [];
let anime = [];
let currentAnime = 0;
let hanhdong = [];
let kinhdi = [];
let comedy = [];
let vientuong = [];
let searchTimeout = null;

// --- HÀM KHỞI TẠO CHÍNH (KHI TRANG SẴN SÀNG) ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Tải dữ liệu phim từ Database
    loadMoviesFromDB();
    
    // 2. Khởi tạo giao diện Menu thành viên
    updateUserMenu();

    // 3. Kích hoạt tính năng tìm kiếm (Tránh lỗi DOM chưa tồn tại)
    initSearchFeatures();
});

// --- TẢI DỮ LIỆU TỪ BACKEND ---
async function loadMoviesFromDB() {
    try {
        const [res, res1, res2, res3, res4, res5, res6, res7] = await Promise.all([
            fetch(`${API_BASE_URL}/api/movies?type=random`),
            fetch(`${API_BASE_URL}/api/movies?type=top20`),
            fetch(`${API_BASE_URL}/api/movies?type=ngontinh`),
            fetch(`${API_BASE_URL}/api/movies?type=hanhdong`),
            fetch(`${API_BASE_URL}/api/movies?type=anime`),
            fetch(`${API_BASE_URL}/api/movies?type=kinhdi`),
            fetch(`${API_BASE_URL}/api/movies?type=comedy`),
            fetch(`${API_BASE_URL}/api/movies?type=vientuong`),
        ]);

        moviesRandom = await res.json();
        top20movie = await res1.json();
        ngontinh = await res2.json();
        hanhdong = await res3.json();
        anime = await res4.json();
        kinhdi = await res5.json();
        comedy = await res6.json();
        vientuong = await res7.json();

        // Kích hoạt Banner chính Slideshow
        if (moviesRandom.length > 0) {
            showSlide(0);
            setInterval(nextSlide, 5000);
        }
        
        // Kích hoạt Banner Anime Slideshow
        if (anime.length > 0) { 
            showSlide1(0); 
            setInterval(nextSlide1, 5000); 
        }

        // Render các danh sách phim ra giao diện
        if (top20movie.length > 0) renderFeaturedMovies();
        if (ngontinh.length > 0) renderLoveMovies();
        if (hanhdong.length > 0) renderactioMovies();
        if (kinhdi.length > 0) renderkinhdiMovies();
        if (comedy.length > 0) rendercomedyMovies();
        if (vientuong.length > 0) rendervientuongMovies();

    } catch (err) {
        console.error("Lỗi load API danh sách phim:", err);
    }
}

// --- CÁC HÀM XUẤT GIAO DIỆN PHIM (RENDER) ---
function renderFeaturedMovies() {
    const container = document.getElementById("movie-list-PhimNoiBat");
    if (!container) return;
    container.innerHTML = top20movie.slice(0, 20).map(movie => `
        <div class="movie-card" onclick="openMovie(${movie.id})">
            <img src="${movie.img}" alt="${movie.title}">
            <h6 class="mt-2 text-center text-truncate">${movie.title}</h6>
        </div>`).join('');
}

function renderLoveMovies() {
    const container = document.getElementById("movie-list-PhimNgonTinh");
    if (!container) return;
    container.innerHTML = ngontinh.slice(0, 20).map(movie => `
        <div class="movie-card" onclick="openMovie(${movie.id})">
            <img src="${movie.img}" alt="${movie.title}">
            <h6 class="mt-2 text-center text-truncate">${movie.title}</h6>
        </div>`).join('');
}

function renderGenericActionCards(containerId, dataArray) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = dataArray.slice(0, 20).map(movie => `
        <div class="action-card" onclick="openMovie(${movie.id})">
            <img src="${movie.img}" alt="${movie.title}">
            <div class="action-info">
                <h5>${movie.title}</h5>
                <p>${movie.description || movie.desc || ''}</p>
            </div>
        </div>`).join('');
}

function renderactioMovies() { renderGenericActionCards("movie-list-HanhDong", hanhdong); }
 immortality 
function renderkinhdiMovies() { renderGenericActionCards("movie-list-kinhdi", kinhdi); }
function rendercomedyMovies() { renderGenericActionCards("movie-list-comedy", comedy); }
function rendervientuongMovies() { renderGenericActionCards("movie-list-sci", vientuong); }

// --- LOGIC BANNER SLIDESHOW RANDOM ---
function showSlide(index) {
    if (!moviesRandom.length) return;
    const movie = moviesRandom[index];
    if(document.getElementById("banner-img")) document.getElementById("banner-img").src = movie.img;
    if(document.getElementById("banner-title")) document.getElementById("banner-title").innerText = movie.title;
    if(document.getElementById("banner-desc")) document.getElementById("banner-desc").innerText = movie.description || movie.desc || '';
}

function nextSlide() {
    if (!moviesRandom.length) return;
    current = (current + 1) % moviesRandom.length;
    showSlide(current);
}

function prevSlide() {
    if (!moviesRandom.length) return;
    current = (current - 1 + moviesRandom.length) % moviesRandom.length;
    showSlide(current);
}

// --- LOGIC BANNER SLIDESHOW ANIME ---
function showSlide1(index) {
    if (!anime.length) return;
    const movie = anime[index];
    if(document.getElementById("anime-img")) document.getElementById("anime-img").src = movie.img;
    if(document.getElementById("anime-title")) document.getElementById("anime-title").innerText = movie.title;
    if(document.getElementById("anime-desc")) document.getElementById("anime-desc").innerText = movie.description || movie.desc || '';
}

function nextSlide1() {
    if (!anime.length) return;
    currentAnime = (currentAnime + 1) % anime.length;
    showSlide1(currentAnime);
}

function prevSlide1() {
    if (!anime.length) return;
    currentAnime = (currentAnime - 1 + anime.length) % anime.length;
    showSlide1(currentAnime);
}

// --- ĐIỀU KHIỂN CUỘN CAROUSEL TRAI/PHẢI ---
function scrollList(elementId, direction) {
    const list = document.getElementById(elementId);
    if (!list) return;
    const scrollAmount = list.clientWidth / 3;
    const maxScroll = list.scrollWidth - list.clientWidth;
    let targetScroll = list.scrollLeft + (direction * scrollAmount);
    
    if (direction === 1) {
        list.scrollTo({ left: list.scrollLeft >= maxScroll - 5 ? 0 : targetScroll, behavior: 'smooth' });
    } else {
        list.scrollTo({ left: list.scrollLeft <= 5 ? maxScroll : targetScroll, behavior: 'smooth' });
    }
}

// --- QUẢN LÝ GIAO DIỆN THÀNH VIÊN (USER MENU) ---
function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    const btn = document.getElementById('user-btn');
    if (menu) menu.classList.toggle('show');
    if (btn) btn.classList.toggle('active');
}

function updateUserMenu() {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role"); 
    const menu = document.getElementById("user-menu");

    if (!menu) return;

    if (username) {
        let adminItem = "";
        if (role === "admin") {
            adminItem = `
                <a href="admin.html" id="admin-link" class="user-menu-item" style="color: #f59e0b; font-weight: bold;">
                    <i class="bi bi-shield-lock"></i> Quản lý hệ thống
                </a>
            `;
        }

        menu.innerHTML = `
            <div class="user-menu-header">
                <p>Xin chào,</p>
                <strong style="color:#fff; font-size:15px">${username}</strong>
            </div>
            ${adminItem} 
            <a href="#" class="user-menu-item"><i class="bi bi-heart"></i> Danh sách yêu thích</a>
            <a href="#" class="user-menu-item"><i class="bi bi-clock-history"></i> Lịch sử xem</a>
            <a href="#" class="user-menu-item"><i class="bi bi-gear"></i> Cài đặt</a>
            <div class="user-menu-divider"></div>
            <button class="user-menu-item" onclick="logout()" style="width:100%; text-align:left; background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer;">
                <i class="bi bi-box-arrow-right"></i> Đăng xuất
            </button>
        `;
    } else {
        menu.innerHTML = `
            <div class="user-menu-header">
                <p>Chào mừng bạn đến với</p>
                <strong style="color:#fff; font-size:15px">Galaxy<span style="color:#a78bfa">Movie</span></strong>
            </div>
            <button class="user-menu-item login" onclick="openLogin()">
                <i class="bi bi-box-arrow-in-right"></i> Đăng nhập
            </button>
            <button class="user-menu-item register" onclick="openRegister()">
                <i class="bi bi-person-plus"></i> Đăng ký
            </button>
            <div class="user-menu-divider"></div>
            <a href="#" class="user-menu-item"><i class="bi bi-heart"></i> Danh sách yêu thích</a>
            <a href="#" class="user-menu-item"><i class="bi bi-clock-history"></i> Lịch sử xem</a>
            <a href="#" class="user-menu-item"><i class="bi bi-gear"></i> Cài đặt</a>
        `;
    }
}

// Đóng dropdown menu khi click ra ngoài vùng chọn
document.addEventListener('click', function (e) {
    const wrapper = document.querySelector('.user-dropdown-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        const menu = document.getElementById('user-menu');
        const btn = document.getElementById('user-btn');
        if (menu) menu.classList.remove('show');
        if (btn) btn.classList.remove('active');
    }
});

// --- ĐIỀU HƯỚNG VÀ POPUP GIAO DIỆN ---
function openLogin() { document.querySelector(".login-container").style.display = "flex"; }
function closeLogin() { document.querySelector(".login-container").style.display = "none"; }
function openRegister() { document.querySelector(".register-container").style.display = "flex"; }
function closeregister() { document.querySelector(".register-container").style.display = "none"; }
function goGenre(type) { window.location.href = `movies.html?type=${type}`; }
function openMovie(id) { window.location.href = `movie.html?id=${id}`; }

// --- HỆ THỐNG XỬ LÝ TÌM KIẾM ĐỔ XUỐNG ---
function initSearchFeatures() {
    const searchInput = document.getElementById('search-input');
    const dropdown = document.getElementById('search-results-dropdown');
    
    if (!searchInput || !dropdown) return;

    searchInput.addEventListener('input', function(e) {
        const keyword = e.target.value.trim();
        clearTimeout(searchTimeout);
        
        if (keyword.length === 0) {
            dropdown.innerHTML = '';
            dropdown.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/movies/search?q=${encodeURIComponent(keyword)}`);
                const movies = await response.json();
                
                dropdown.innerHTML = '';
                dropdown.style.display = 'block';

                if (!movies || movies.length === 0) {
                    dropdown.innerHTML = `<div class="search-no-results">Không tìm thấy bộ phim nào phù hợp 😥</div>`;
                    return;
                }

                movies.forEach(movie => {
                    const item = document.createElement('a');
                    item.href = `movie.html?id=${movie.id}`;
                    item.className = 'search-result-item';
                    item.innerHTML = `
                        <img class="search-result-img" src="${movie.img}" alt="${movie.title}">
                        <div class="search-result-info">
                            <h6 class="search-result-title">${movie.title}</h6>
                            <span class="search-result-meta">Thể loại: ${movie.type || 'Phim'} | Lượt xem: ${movie.views ? movie.views.toLocaleString() : 0}</span>
                        </div>
                    `;
                    dropdown.appendChild(item);
                });
            } catch (error) {
                console.error("Lỗi tìm kiếm:", error);
            }
        }, 300);
    });

    // Ẩn khi click ra ngoài ô tìm kiếm
    document.addEventListener('click', function(e) {
        if (e.target !== dropdown && e.target !== searchInput) {
            dropdown.style.display = 'none';
        }
    });

    // Hiện lại kết quả nếu ô tìm kiếm đã có sẵn nội dung từ trước
    searchInput.addEventListener('focus', function(e) {
        if (e.target.value.trim().length > 0) {
            dropdown.style.display = 'block';
        }
    });
}

// --- XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT / ĐĂNG KÝ ---
async function register() {
    const username = document.getElementById("name-account").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    if (!username || !email || !password) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (data.success) {
            alert("Đăng ký thành công!");
            closeregister();
            openLogin();
        } else {
            alert("Lỗi: " + data.message);
        }
    } catch (err) {
        alert("Không thể kết nối server!");
    }
}

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);
            localStorage.setItem("role", data.role); 

            alert("Đăng nhập thành công!");
            closeLogin();
            updateUserMenu();
        } else {
            alert("Lỗi: " + data.message);
        }
    } catch (err) {
        alert("Không thể kết nối server!");
    }
}

function logout() {
    localStorage.clear();
    alert("Đã đăng xuất tài khoản!");
    if (window.location.pathname.includes("admin.html")) {
        window.location.href = "index.html";
    } else {
        updateUserMenu();
        window.location.reload();
    }
}