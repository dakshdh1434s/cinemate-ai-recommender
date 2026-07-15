from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import pickle
import pandas as pd
import os

app = FastAPI(title="Cinemate AI - Movie Recommender")

# Allow CORS for all origins (needed for deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from huggingface_hub import hf_hub_download

# ── Load ML Models (movie_dict.pkl + similarity.pkl) ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HF_REPO_ID = "dakshdh1434s/movie-recommender-model"

print("[*] Ensuring ML models are present locally...")
try:
    if not os.path.exists(os.path.join(BASE_DIR, 'movie_dict.pkl')):
        print("Downloading movie_dict.pkl from Hugging Face...")
        hf_hub_download(repo_id=HF_REPO_ID, filename="movie_dict.pkl", local_dir=BASE_DIR, repo_type="model")
        
    if not os.path.exists(os.path.join(BASE_DIR, 'similarity.pkl')):
        print("Downloading similarity.pkl from Hugging Face...")
        hf_hub_download(repo_id=HF_REPO_ID, filename="similarity.pkl", local_dir=BASE_DIR, repo_type="model")

    print("[*] Loading ML models into memory...")
    movies_dict = pickle.load(open(os.path.join(BASE_DIR, 'movie_dict.pkl'), 'rb'))
    movies = pd.DataFrame(movies_dict)
    similarity = pickle.load(open(os.path.join(BASE_DIR, 'similarity.pkl'), 'rb'))
    print(f"[OK] Models loaded! {len(movies)} movies indexed.")
except Exception as e:
    print(f"[ERROR] Error downloading/loading models: {e}")
    movies = pd.DataFrame()
    similarity = None


# ── API Endpoints ──

@app.get("/api/movies")
def get_movies():
    """Return all movie titles for the search/dropdown"""
    return {"movies": movies['title'].tolist()}


@app.get("/api/recommend")
def recommend_movies(title: str):
    """
    Core recommendation engine.
    Uses the cosine similarity matrix trained on the 5000 TMDB dataset
    to return the top 5 most similar movies.
    """
    if similarity is None:
        raise HTTPException(status_code=500, detail="Models not loaded")

    if title not in movies['title'].values:
        raise HTTPException(status_code=404, detail=f"Movie '{title}' not found in database")

    movie_index = movies[movies['title'] == title].index[0]
    distances = similarity[movie_index]
    # Sort by similarity score descending, skip index 0 (itself), take top 5
    movies_list = sorted(
        list(enumerate(distances)),
        reverse=True,
        key=lambda x: x[1]
    )[1:6]

    recommendations = []
    for idx, score in movies_list:
        recommendations.append({
            "id": int(movies.iloc[idx].movie_id),
            "title": str(movies.iloc[idx].title),
            "score": round(float(score), 4)
        })

    return {
        "source": title,
        "recommendations": recommendations
    }


# ── Serve Static Frontend ──
# IMPORTANT: mount static AFTER api routes so /api/* isn't shadowed

@app.get("/")
def serve_frontend():
    return FileResponse(os.path.join(BASE_DIR, "static", "index.html"))

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
