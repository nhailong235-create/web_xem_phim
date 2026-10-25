const API_URL = "http://127.0.0.1:8000/api/admin/movies";
let allAdminMovies = [];
let bsModal;

// Kiểm tra quyền khi vừa vào trang quản trị
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
        alert("Bạn không có quyền truy cập vào khu vực này!");
        window.location.href = "index.html";
        return;
    }

    bsModal = new bootstrap.Modal(document.getElementById('movieModal'));
    loadAdminMovies();
});

// 1. Tải danh sách phim từ server về bảng
async function loadAdminMovies() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(API_URL, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.status === 403 || res.status === 401) {
            alert("Phiên đăng nhập hết hạn hoặc bạn không phải admin.");
            window.location.href = "index.html";
            return;
        }

        // THÊM DÒNG NÀY ĐỂ KIỂM TRA:
        const testData = await res.json();
        console.log("Dữ liệu gốc từ Backend trả về:", testData);

        allAdminMovies = testData; // hoặc testData.data tùy theo kết quả log ra
        renderMovieTable();
    } catch (err) {
        console.error("Lỗi lấy danh sách phim:", err);
    }
}

// Render dữ liệu ra HTML Table
function renderMovieTable() {
    const tbody = document.getElementById("admin-movie-table");
    tbody.innerHTML = "";

    allAdminMovies.forEach(movie => {
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold text-secondary">#${movie.id}</td>
                <td><img src="${movie.img}" alt="" style="width:60px; height:40px; object-fit:cover; border-radius:4px;"></td>
                <td><span class="fw-semibold">${movie.title}</span></td>
                <td><span class="badge bg-purple text-capitalize">${movie.type}</span></td>
                <td><i class="bi bi-eye text-secondary"></i> ${movie.views || 0}</td>
                <td>
                    <div class="d-flex justify-content-center gap-2">
                        <button class="btn btn-sm btn-warning" onclick="openEditModal(${movie.id})"><i class="bi bi-pencil-square"></i> Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteMovie(${movie.id})"><i class="bi bi-trash"></i> Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// Mở modal để Thêm phim
function openAddModal() {
    document.getElementById("modalTitle").innerText = "Thêm phim mới";
    document.getElementById("form-movie-id").value = "";
    document.getElementById("form-title").value = "";
    document.getElementById("form-img").value = "";
    document.getElementById("form-type").value = "top20";
    document.getElementById("form-desc").value = "";
    bsModal.show();
}

// Mở modal để Sửa phim (Đổ dữ liệu cũ vào input)
function openEditModal(id) {
    const movie = allAdminMovies.find(m => m.id === id);
    if (!movie) return;

    document.getElementById("modalTitle").innerText = "Chỉnh sửa thông tin phim";
    document.getElementById("form-movie-id").value = movie.id;
    document.getElementById("form-title").value = movie.title;
    document.getElementById("form-img").value = movie.img;
    document.getElementById("form-type").value = movie.type;
    document.getElementById("form-desc").value = movie.description || "";
    bsModal.show();
}

// 2 & 3. Xử lý logic Gửi dữ liệu lên Server (Lưu / Cập nhật)
async function saveMovieForm() {
    const token = localStorage.getItem("token");
    const id = document.getElementById("form-movie-id").value;
    const title = document.getElementById("form-title").value;
    const img = document.getElementById("form-img").value;
    const type = document.getElementById("form-type").value;
    const description = document.getElementById("form-desc").value;

    if (!title || !img) {
        alert("Vui lòng nhập đầy đủ Tên phim và Link ảnh bìa!");
        return;
    }

    const payload = { title, img, type, description };
    let url = `${API_URL}/add`;
    let method = "POST";

    // Nếu ID tồn tại tức là đang ở trạng thái Cập nhật (Sửa phim)
    if (id) {
        url = `${API_URL}/update/${id}`;
        method = "PUT";
    }

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            alert(data.message);
            bsModal.hide();
            loadAdminMovies(); // Tải lại bảng dữ liệu
        } else {
            alert("Thao tác thất bại: " + data.message);
        }
    } catch (err) {
        console.error("Lỗi gửi form:", err);
    }
}

// 4. Xử lý logic Xóa phim
async function deleteMovie(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bộ phim này?")) return;
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API_URL}/delete/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            alert(data.message);
            loadAdminMovies();
        } else {
            alert("Không thể xóa: " + data.message);
        }
    } catch (err) {
        console.error("Lỗi xóa phim:", err);
    }
}