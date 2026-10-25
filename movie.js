const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let phimtheoid = {};

async function loadMovie() {
    try {
    
        const res8 = await fetch(`http://127.0.0.1:8000/api/movies?id=${id}`);
        phimtheoid = await res8.json();
        console.log(phimtheoid);

    
        if (!phimtheoid || Object.keys(phimtheoid).length === 0) {
            console.log("Không tìm thấy phim");
            return;
        }

        showMovie();
    } catch(err) {
        console.log("Lỗi:", err);
    }
}

function showMovie() {

    document.getElementById("movie-img").src =
        phimtheoid.img;

    document.getElementById("movie-title").innerText =
        phimtheoid.title;

    document.getElementById("movie-desc").innerText =
        phimtheoid.desc;

    document.getElementById("movie-imdb").innerText =
        phimtheoid.imdb;

    document.getElementById("movie-episodes").innerText =
        phimtheoid.episodes;

    const episodeList =
        document.getElementById("episode-list");

    episodeList.innerHTML = "";

    for(let i = 1; i <= phimtheoid.episodes; i++){

        episodeList.innerHTML += `
            <button class="episode-btn">
                Tập ${i}
            </button>
        `;
    }
}
document.addEventListener("DOMContentLoaded", loadMovie);