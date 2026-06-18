const STREMIO_TRAKT_CLIENT_ID = "0e861f52c7365efe6da5ea3e2e6641b8d25d87aca3133e8d4f7dc8487368d14b";


export async function getTraktWatchedMovies(token, clientId = STREMIO_TRAKT_CLIENT_ID) {
    const response = await fetch('https://api.trakt.tv/sync/watched/movies', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'trakt-api-version': '2',
            'trakt-api-key': clientId 
        }
    });     
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || response.statusText);
	}		
	const data = await response.json();        
	return data
        .filter(item => item.movie?.ids?.imdb)
        .map(item => ({
            id: item.movie.ids.imdb,
			type: "movie",
            title: item.movie.title,
            watchedDate: item.last_watched_at
        }));                
}


export async function getTraktWatchedSeries(token, clientId = STREMIO_TRAKT_CLIENT_ID) {
    const response = await fetch('https://api.trakt.tv/sync/watched/shows', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'trakt-api-version': '2',
            'trakt-api-key': clientId
        }
    });
    if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || response.statusText);
	}
	const data = await response.json();
    return data
        .filter(item => item.show?.ids?.imdb && Array.isArray(item.seasons))
        .map(item => {            
            // 2. Make ordered list of seasons which are not 0 (sorted highest to lowest)
            const orderedSeasons = item.seasons.filter(s => s.number > 0).sort((a, b) => b.number - a.number);
            // 3. Iterate this list starting with the highest season
            for (const seasonObj of orderedSeasons) {
                const episodeNumbers = seasonObj.episodes?.map(e => e.number) || [];                
                // Get max episode for the season which is not 0
                const maxEpisode = episodeNumbers.length > 0 ? Math.max(...episodeNumbers) : 0;                
                // 4. If found, return (breaks loop and yields the object)
                if (maxEpisode > 0) {
                    return {
                        id: item.show.ids.imdb,
						type: "series",
                        title: item.show.title,
                        watchedDate: item.last_watched_at,
                        season: seasonObj.number,
                        episode: maxEpisode
                    };
                }                
                // 5. If not, continue to lower season (implicit in the loop)
            }
            // If the loop finishes and nothing was found, return null
            return null;
        })
        // Clean up any shows that didn't have any valid episodes across all seasons
        .filter(series => series !== null);
}


/*

const itemsToUpdate = [
  {
    "id": "tt2193021",
    "type": "series",
    "trakt": { "title": "Arrow", "season": 8, "episode": 9 },
    "stremio": { "title": "Arrow", "watchedDate": "2020-03-30T12:47:00Z", "season": 8, "episode": 10 }
  },
  {
    "id": "tt1375666",
    "type": "movie",
    "trakt": null, 
    "stremio": { "title": "Inception", "watchedDate": "2026-06-06T09:45:00Z" }
  }
];

*/






export async function updateTraktWatchedItems(items, token, clientId = STREMIO_TRAKT_CLIENT_ID) {
	const movies = [];
	const shows = [];

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const s = item.stremio;
		if (s.type === 'movie') {
			movies.push({
				ids: { imdb: item.id },
				watched_at: s.watchedDate
			});
		} 
		else if (s.type === 'series') {
			shows.push({				
				ids: { imdb: item.id },
				seasons: [
					{
						number: 1,
						episodes: [
							{
								number: 1,
								watched_at: s.watchedDate
							}
						]
					}
				]
			});												
		}
		
	}

	const payload = {
		movies: movies,
		shows: shows,
	};

	if (payload.movies.length === 0 && payload.shows.length === 0) {return null;}  
	const response = await fetch('https://api.trakt.tv/sync/history', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`, 
			'trakt-api-version': '2',
			'trakt-api-key': clientId 
		},
		body: JSON.stringify(payload)
    });
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || response.statusText);
	}

    const result = await response.json();    
    return result;

	 
}
