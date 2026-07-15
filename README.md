<div align="center">
  <h1>🍿 Cinemate AI</h1>
  <p><strong>Your Personal AI Movie Recommender</strong></p>
  
  <a href="https://cinamate.onrender.com">
    <img src="https://img.shields.io/badge/Live_Demo-cinamate.onrender.com-FF3366?style=for-the-badge&logo=render" alt="Live Demo" />
  </a>
  <br><br>
</div>

Cinemate AI is a modern, full-stack web application that uses Machine Learning to recommend movies based on your personal taste. By analyzing a dataset of nearly 5,000 movies using Natural Language Processing (NLP) and Cosine Similarity, Cinemate AI finds hidden gems and blockbuster matches with uncanny accuracy.

## ✨ Features
- **Intelligent Recommendations**: Uses TF-IDF vectorization and cosine similarity to find movies with similar plot narratives, genres, and cast DNA.
- **Dynamic Posters**: Fetches high-quality, real-time movie posters directly from the TMDB API.
- **Zero-Friction ML Loading**: Automatically downloads the massive 180MB+ Machine Learning models from the Hugging Face Hub on startup, allowing the app to be deployed seamlessly on cloud providers with limited storage.
- **Premium UI/UX**: Features a state-of-the-art Glassmorphism interface, dynamic background videos, micro-animations, and a responsive design powered by Tailwind CSS.

## 🛠️ Tech Stack
- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (Glassmorphism UI)
- **Backend**: Python, FastAPI, Uvicorn
- **Machine Learning**: Scikit-learn, Pandas, NumPy, NLTK
- **Cloud & Hosting**: Render (Web Hosting), Hugging Face Hub (Model Storage)
- **External APIs**: TMDB (The Movie Database) for live posters

## 🚀 Live Demo
Experience the AI for yourself: **[https://cinamate.onrender.com](https://cinamate.onrender.com)**

## 💻 Running Locally

### Prerequisites
- Python 3.8 or higher
- Git

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/dakshdh1434s/cinemate-ai-recommender.git
   cd cinemate-ai-recommender
   ```

2. **Create a virtual environment (Recommended)**
   ```bash
   python -m venv .venv
   # On Windows
   .venv\Scripts\activate
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the server**
   ```bash
   uvicorn api:app --reload
   ```
   *Note: On the very first run, the app will automatically download the Machine Learning models (`movie_dict.pkl` and `similarity.pkl`) from Hugging Face. This may take a minute depending on your internet connection.*

5. **Open the app**
   Navigate to `http://localhost:8000` in your web browser.

## 🧠 How it Works
1. The AI was trained on the TMDB 5000 Movies Dataset.
2. We extracted tags (genres, keywords, cast, crew, and overview) for each movie, applied stemming, and converted them into vectors using the `CountVectorizer`.
3. When you search for a movie, the system calculates the **Cosine Similarity** distance between your movie's vector and every other movie in the database.
4. The top 5 closest matches are sorted by confidence score and sent to the gorgeous frontend.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
