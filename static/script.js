(() => {
    // ── DOM refs ──
    const movieInput   = document.getElementById('movie-input');
    const dropdown     = document.getElementById('dropdown');
    const recommendBtn = document.getElementById('recommend-btn');
    const heroSection  = document.getElementById('hero');
    const loadingState = document.getElementById('loading-state');
    const resultsSection = document.getElementById('results');
    const cardsContainer = document.getElementById('cards-container');
    const sourceTitle  = document.getElementById('source-title');
    const backBtn      = document.getElementById('back-btn');

    const TMDB_KEY = '8265bd1679663a7ea12ac168da84d2e8';
    
    // IMPORTANT: Using api.tmdb.org instead of themoviedb.org to bypass regional ISP blocks!
    const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
    const TMDB_API_BASE = 'https://api.tmdb.org/3'; 

    let allMovies = [];
    let selected  = '';

    // ── Fetch movie list from backend ──
    async function loadMovies() {
        try {
            const res = await fetch('/api/movies');
            const data = await res.json();
            allMovies = data.movies;
        } catch (e) {
            console.error('Failed to load movies:', e);
        }
    }
    loadMovies();

    // ── Search Input & Autocomplete ──
    movieInput.addEventListener('input', () => {
        const q = movieInput.value.trim().toLowerCase();
        selected = '';
        recommendBtn.disabled = true;

        if (q.length < 2) { 
            dropdown.classList.add('hidden'); 
            return; 
        }

        const matches = allMovies
            .filter(m => m.toLowerCase().includes(q))
            .slice(0, 8);

        if (matches.length === 0) { 
            dropdown.classList.add('hidden'); 
            return; 
        }

        dropdown.innerHTML = matches.map(m => `
            <div class="dropdown-item px-6 py-4 hover:bg-primary/10 cursor-pointer border-b border-glassBorder last:border-b-0 transition-colors flex items-center gap-3 text-lg" data-title="${escapeHtml(m)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-gray-400 flex-shrink-0"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                ${highlightMatch(m, q)}
            </div>
        `).join('');

        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                movieInput.value = item.dataset.title;
                selected = item.dataset.title;
                recommendBtn.disabled = false;
                dropdown.classList.add('hidden');
            });
        });

        dropdown.classList.remove('hidden');
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!movieInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // ── Recommend Flow ──
    recommendBtn.addEventListener('click', doRecommend);
    movieInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && selected) doRecommend();
    });

    async function doRecommend() {
        const title = selected || movieInput.value.trim();
        if (!title) return;

        heroSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        loadingState.classList.remove('hidden');

        try {
            const res = await fetch(`/api/recommend?title=${encodeURIComponent(title)}`);
            if (!res.ok) throw new Error('Failed to fetch recommendations');
            const data = await res.json();
            await renderResults(data);
        } catch (err) {
            alert('Error: ' + err.message);
            showHero();
        }
    }

    async function renderResults(data) {
        sourceTitle.textContent = data.source;
        cardsContainer.innerHTML = '';

        const recs = data.recommendations;

        recs.forEach((movie, i) => {
            const isTop = i < 3;
            const rankColor = isTop ? 'text-primary' : 'text-secondary';
            const dotColor = isTop ? 'bg-primary shadow-[0_0_6px_#FF3366]' : 'bg-secondary shadow-[0_0_6px_#FF9933]';
            const rankLabel = isTop ? `TOP MATCH #${i + 1}` : 'HIDDEN GEM';
            const scorePercent = Math.round(movie.score * 100);
            
            // Tailwind card structure mirroring the screenshot aesthetic
            const card = document.createElement('div');
            card.className = 'movie-card flex flex-col md:flex-row bg-[#0A0A0F] border border-glassBorder rounded-2xl overflow-hidden shadow-xl relative';
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.innerHTML = `
                <div class="w-full md:w-[220px] shrink-0 bg-[#111115] relative min-h-[330px]" id="poster-${i}">
                    <div class="absolute inset-0 skeleton"></div>
                </div>
                
                <div class="p-8 flex flex-col justify-center flex-1">
                    <div class="flex items-center gap-2 text-xs font-mono tracking-widest font-bold uppercase mb-2 ${rankColor}">
                        <span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span>
                        ${rankLabel}
                    </div>
                    
                    <h3 class="text-3xl font-display font-bold mb-4">${escapeHtml(movie.title)}</h3>
                    
                    <div class="flex items-center gap-4 mb-4">
                        <div class="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style="width: ${scorePercent}%"></div>
                        </div>
                        <span class="text-sm font-mono text-gray-500">${scorePercent}% match</span>
                    </div>
                    
                    <p class="text-gray-400 text-lg leading-relaxed max-w-3xl">
                        ${getDescription(i)}
                    </p>
                </div>
            `;
            cardsContainer.appendChild(card);

            // Staggered animation
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 150);
        });

        loadingState.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        resultsSection.classList.add('flex', 'flex-col'); // tailwind overrides

        // Fetch posters via bypass domain
        recs.forEach((movie, i) => fetchPoster(movie.id, i));
    }

    async function fetchPoster(tmdbId, index) {
        const container = document.getElementById(`poster-${index}`);
        if (!container) return;

        try {
            // Using api.tmdb.org to bypass block
            const res = await fetch(`${TMDB_API_BASE}/movie/${tmdbId}?api_key=${TMDB_KEY}&language=en-US`);
            const data = await res.json();

            if (data.poster_path) {
                const img = new Image();
                img.src = `${TMDB_IMG}${data.poster_path}`;
                img.className = 'w-full h-full object-cover';
                img.onload = () => {
                    container.innerHTML = '';
                    container.appendChild(img);
                };
                img.onerror = () => setFallbackPoster(container);
            } else {
                setFallbackPoster(container);
            }
        } catch {
            setFallbackPoster(container);
        }
    }

    function setFallbackPoster(container) {
        container.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center bg-[#111115] gap-3 p-6 text-center border-r border-glassBorder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                <span class="text-xs font-mono text-gray-600 uppercase tracking-widest">No Poster</span>
            </div>
        `;
    }

    // ── Navigation ──
    backBtn.addEventListener('click', showHero);

    function showHero() {
        resultsSection.classList.add('hidden');
        resultsSection.classList.remove('flex', 'flex-col');
        loadingState.classList.add('hidden');
        heroSection.classList.remove('hidden');
        movieInput.value = '';
        selected = '';
        recommendBtn.disabled = true;
    }

    // ── Helpers ──
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function highlightMatch(text, query) {
        const idx = text.toLowerCase().indexOf(query);
        if (idx === -1) return escapeHtml(text);
        const before = escapeHtml(text.slice(0, idx));
        const match  = escapeHtml(text.slice(idx, idx + query.length));
        const after  = escapeHtml(text.slice(idx + query.length));
        return `${before}<strong class="text-primary">${match}</strong>${after}`;
    }

    function getDescription(index) {
        const descs = [
            'Strongest narrative and thematic alignment with your pick. A near-perfect match across genre, cast DNA, and plot vectors.',
            'Exceptional overlap in storytelling structure and cinematic tone. You\'ll feel right at home with this one.',
            'High-confidence recommendation based on deep tag similarity. A natural next watch.',
            'A hidden gem surfaced from the latent space — shares surprising structural parallels with your choice.',
            'Pulled from deeper layers of the similarity matrix. An unconventional pick that rewards the adventurous viewer.'
        ];
        return descs[index] || descs[0];
    }
})();
