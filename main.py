from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
import pymysql
import jwt
import bcrypt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "galaxy_movie_secret"

def get_db():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="123456",
        database="movie_db",
        port=3306,
        cursorclass=pymysql.cursors.DictCursor
    )

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class MovieRequest(BaseModel):
    title: str
    img: str
    type: str
    description: str = ""

def get_current_user(authorization: str = Header(None)):
    try:
        if not authorization:
            return None
        token = authorization.replace("Bearer ", "")
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return data
    except:
        return None

@app.get("/")
def home():
    return {"message": "Server đang chạy"}

@app.get("/api/movies")
def get_movies(type: str = None, id: int = None):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        if id:
            cursor.execute("SELECT * FROM movies WHERE id = %s", (id,))
            data = cursor.fetchone()
            return data if data else {"error": "Không tìm thấy phim"}

        if type == "top20":
            cursor.execute("SELECT * FROM movies ORDER BY views DESC LIMIT 20")
        elif type == "random":
            cursor.execute("SELECT * FROM movies ORDER BY RAND() LIMIT 10")
        elif type == "anime":
            cursor.execute("SELECT * FROM movies WHERE genre = %s", ("Animation",))
        elif type == "hanhdong":
            cursor.execute("SELECT * FROM movies WHERE genre = %s", ("Action",))
        elif type == "ngontinh":
            cursor.execute("SELECT * FROM movies WHERE genre = %s", ("Romance",))
        elif type == "kinhdi":
            cursor.execute("SELECT * FROM movies WHERE genre = 'Horror'")
        elif type == "comedy":
            cursor.execute("SELECT * FROM movies WHERE genre = 'Comedy'")
        elif type == "vientuong":
            cursor.execute("SELECT * FROM movies WHERE genre = 'Sci-Fi'")
        elif type == "fantasy":
            cursor.execute("SELECT * FROM movies WHERE genre = 'Fantasy'")
        elif type == "crime":
            cursor.execute("SELECT * FROM movies WHERE genre = 'Crime'")
        elif type =="war":
            cursor.execute("SELECT * FROM movies WHERE genre = 'war'")
        elif type =="drama":
            cursor.execute("SELECT * FROM movies WHERE genre = 'Drama'")
        else:
            cursor.execute("SELECT * FROM movies")

        return cursor.fetchall()

    except Exception as e:
        print("MYSQL ERROR:", e)
        return {"error": str(e)}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.post("/api/register")
def register(data: RegisterRequest):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE email = %s", (data.email,))
        if cursor.fetchone():
            return {"success": False, "message": "Email đã được sử dụng"}

        hashed = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt())

        cursor.execute(
            "INSERT INTO users (username, email, password, role) VALUES (%s, %s, %s, 'user')",
            (data.username, data.email, hashed.decode("utf-8"))
        )
        conn.commit()
        return {"success": True, "message": "Đăng ký thành công"}

    except Exception as e:
        print("MYSQL ERROR:", e)
        return {"success": False, "message": str(e)}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.post("/api/login")
def login(data: LoginRequest):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE email = %s", (data.email,))
        user = cursor.fetchone()

        if not user:
            return {"success": False, "message": "Email không tồn tại"}

        if not bcrypt.checkpw(data.password.encode("utf-8"), user["password"].encode("utf-8")):
            return {"success": False, "message": "Mật khẩu sai"}

        token = jwt.encode(
            {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "role": user.get("role", "user"),
                "exp": datetime.utcnow() + timedelta(days=7)
            },
            SECRET_KEY,
            algorithm="HS256"
        )

        return {
            "success": True,
            "token": token,
            "username": user["username"],
            "role": user.get("role", "user") 
        }

    except Exception as e:
        print("MYSQL ERROR:", e)
        return {"success": False, "message": str(e)}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.post("/api/favorite/add")
def add_favorite(movie_id: int, authorization: str = Header(None)):
    user = get_current_user(authorization)
    if not user:
        return {"success": False, "message": "Chưa đăng nhập"}

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO favorite_movies(user_id, movie_id) VALUES(%s, %s)",
            (user["id"], movie_id)
        )
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

@app.get("/api/favorites")
def get_favorites(authorization: str = Header(None)):
    user = get_current_user(authorization)
    if not user: return []
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT m.*
        FROM favorite_movies f
        JOIN movies m ON f.movie_id = m.id
        WHERE f.user_id = %s
        """,
        (user["id"],)
    )
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data

@app.post("/api/history/add")
def add_history(movie_id: int, authorization: str = Header(None)):
    user = get_current_user(authorization)
    if not user: return {"success": False}

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO watch_history(user_id, movie_id) VALUES(%s, %s)",
            (user["id"], movie_id)
        )
        conn.commit()
        return {"success": True}
    except:
        return {"success": False}
    finally:
        cursor.close()
        conn.close()

@app.get("/api/history")
def get_history(authorization: str = Header(None)):
    user = get_current_user(authorization)
    if not user: return []

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT m.*, h.watched_at
        FROM watch_history h
        JOIN movies m ON h.movie_id = m.id
        WHERE h.user_id = %s
        ORDER BY h.watched_at DESC
        """,
        (user["id"],)
    ) 
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data


@app.get("/api/users")
def get_all_users(authorization: str = Header(None)):
    """API lấy toàn bộ danh sách người dùng (Chỉ Admin)"""
    user = get_current_user(authorization)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập tính năng này!")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, username, email, role FROM users ORDER BY id DESC")
        users = cursor.fetchall()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/users/delete")
def delete_user(id: int = Query(...), authorization: str = Header(None)):
    """API xóa một người dùng theo ID (Chỉ Admin)"""
    user = get_current_user(authorization)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện hành động này!")

    if user["id"] == id:
        return {"success": False, "message": "Bạn không thể tự xóa tài khoản chính mình!"}

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id = %s", (id,))
        conn.commit()
        return {"success": True, "message": "Xóa người dùng thành công"}
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

@app.get("/api/admin/movies")
def get_admin_movies(authorization: str = Header(None)):
    """1. Lấy toàn bộ danh sách phim phục vụ cho bảng Admin"""
    user = get_current_user(authorization)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập!")

    conn = get_db()
    cursor = conn.cursor()
    try:

        cursor.execute("SELECT id, title, img, genre AS type, views, `desc` AS description FROM movies ORDER BY id DESC")
        movies = cursor.fetchall()
        return movies
    except Exception as e:
        print("LỖI SQL ADMIN GET:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/admin/movies/add")
def add_movie(data: MovieRequest, authorization: str = Header(None)):
    """2. Thêm phim mới"""
    user = get_current_user(authorization)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Hành động bị từ chối!")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO movies (title, img, genre, `desc`, views, type, category, episodes, imdb) VALUES (%s, %s, %s, %s, 0, 'movie', 'Chiếu rạp', 1, 0.0)",
            (data.title, data.img, data.type, data.description)
        )
        conn.commit()
        return {"success": True, "message": "Thêm bộ phim mới thành công!"}
    except Exception as e:
        print("LỖI SQL ADMIN ADD:", e)
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

@app.put("/api/admin/movies/update/{id}")
def update_movie(id: int, data: MovieRequest, authorization: str = Header(None)):
    """3. Cập nhật thông tin phim theo ID"""
    user = get_current_user(authorization)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Hành động bị từ chối!")

    conn = get_db()
    cursor = conn.cursor()
    try:
    
        cursor.execute(
            "UPDATE movies SET title = %s, img = %s, genre = %s, `desc` = %s WHERE id = %s",
            (data.title, data.img, data.type, data.description, id)
        )
        conn.commit()
        return {"success": True, "message": "Cập nhật thông tin phim thành công!"}
    except Exception as e:
        print("LỖI SQL ADMIN UPDATE:", e)
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/admin/movies/delete/{id}")
def delete_movie_admin(id: int, authorization: str = Header(None)):
    """4. Xóa vĩnh viễn phim theo ID"""
    user = get_current_user(authorization)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Hành động bị từ chối!")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM movies WHERE id = %s", (id,))
        conn.commit()
        return {"success": True, "message": "Đã xóa bộ phim thành công khỏi hệ thống!"}
    except Exception as e:
        print("LỖI SQL ADMIN DELETE:", e)
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()
@app.get("/api/movies/search")
def search_movies(q: str = Query(None, min_length=1)):
    """API tìm kiếm phim theo từ khóa trong tiêu đề (title)"""
    if not q:
        return []
        
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        query_sql = "SELECT id, title, img, genre AS type, views, `desc` AS description FROM movies WHERE title LIKE %s ORDER BY id DESC"
        cursor.execute(query_sql, (f"%{q}%",))
        results = cursor.fetchall()
        return results
    except Exception as e:
        print("LỖI SQL SEARCH:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)