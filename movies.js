async function loadGenreMovies() {

    // lấy query URL
    const params =
        new URLSearchParams(window.location.search);

    // lấy type
    const type = params.get("type");

    // đổi tiêu đề
    document.getElementById("genre-title")
        .innerText = `Thể loại: ${type}`;

    try {

        // gọi API
        const res = await fetch(
            `http://127.0.0.1:8000/api/movies?type=${type}`
        );

        // chuyển JSON
        const movies = await res.json();

        // render
        renderMovies(movies);

    }
    catch(err){

        console.log("Lỗi:", err);

    }
}

function renderMovies(movies){

    const container =
        document.getElementById("movie-list");

    container.innerHTML = "";

    movies.forEach(movie => {

        container.innerHTML += `

            <div class="movie-card" onclick="openMovie(${movie.id})">

                <img src="${movie.img}">

                <div class="movie-info">

                    <h3>${movie.title}</h3>

                </div>

            </div>

        `;
    });
}

document.addEventListener(
    "DOMContentLoaded",
    loadGenreMovies
);