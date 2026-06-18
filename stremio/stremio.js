export async function loginStremio(email, password) {
	const response = await fetch('https://api.strem.io/api/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ type: "Login", email, password })
    });
	if (!response.ok) { throw new Error(`HTTP error: ${response.statusText}`); }			
	const data = await response.json();            
	if (data.error) throw new Error(data.error?.message || data.error || 'loginStremio failed');	
	const stremioProfile = data.result.user;
	stremioProfile.authKey = data.result.authKey;	
	return stremioProfile;            
}


export async function getStremioUser(token) {
	const response = await fetch('https://api.strem.io/api/getUser', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ authKey: token })
	});			
	if (!response.ok) { throw new Error(`HTTP error: ${response.statusText}`); }			
	const data = await response.json();            
	if (data.error) throw new Error(data.error?.message || data.error || 'getStremioUser failed');	
	const stremioProfile = data.result;
	stremioProfile.authKey = token;
	return stremioProfile;				
}


export async function getStremioLibrary(token, filter = {}) {
	const response = await fetch('https://api.strem.io/api/datastoreGet', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },			
		body: JSON.stringify({ 
			authKey: token, 
			collection: "libraryItem",
			all: true 
		})				
	});
	if (!response.ok) { throw new Error(`HTTP error: ${response.statusText}`); }			
	const data = await response.json();            
	if (data.error) throw new Error(data.error?.message || data.error || 'getStremioLibrary failed');
	if (!Array.isArray(data.result)) { return []; }	
	return data.result
		.filter(item => item.type === 'movie' || item.type === 'series')						
		.map(item => {
			const isWatched = (item.state?.timesWatched > 0) || (item.state?.flaggedWatched === 1);			
			const result = {	
				id: item._id, 
				type: item.type,
				title: item.name, 
				watched: isWatched,
				data: item,
			};			
			if (result.watched) {
				result.watchedDate = item.state?.lastWatched || null;
				if (item.type === 'series') {							
					const parts = item.state?.watched.split(':');
					if (parts.length >= 3) {
						result.season = parseInt(parts[1], 10);
						result.episode = parseInt(parts[2], 10);
					}
				}								
			}
			return result;
		})
		.filter(item => {
			if (filter.imdb && !item.id?.startsWith('tt')) { return false; }
			if (filter.watched && !item.watched) { return false; }
			return true;
		});
}


export async function updateStremioWatchedItems(items, token) {
	
	const itemsToUpdate = [];							
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const t = item.trakt;
		let s;
		if (item.stremio) {
			s=item.stremio.data;
			s._mtime= new Date().toISOString();
			s.state.lastWatched = t.watchedDate || new Date().toISOString();
			s.state.timesWatched = 1;
//			if (t.type === 'series') { s.state.watched = `${t.id}:${t.season}:${t.episode}:0:`; }
		}
		else {
			s = {				
				"_mtime": new Date().toISOString(), 
				"_ctime": new Date().toISOString(), 				
				_id: item.id,
				type: t.type,				
				name: t.title,
				poster: "",
				posterShape: "poster",
				removed: true,                   // Prevents it from cluttering the user's main UI library
				temp: true,
				state: {					
					lastWatched: t.watchedDate,
					timeWatched: 0,
					timeOffset: 0,
					overallTimeWatched: 0,					
					timesWatched: 1,
					flaggedWatched: 0,
					duration: 0,										
					video_id: null,
					watched: null,
					noNotif: true      // disable notifications on new episodes
				}
			}
//			if (t.type === 'series') { s.state.watched = `${item.id}:${t.season}:${t.episode}:0:`; }
		}
								
		itemsToUpdate.push(s);
		
	}	
	
	const response = await fetch('https://api.strem.io/api/datastorePut', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			authKey: token,
			collection: "libraryItem",
			changes: itemsToUpdate
		})
	});					
	if (!response.ok) { throw new Error(`HTTP error: ${response.statusText}`); }			
	const data = await response.json();            
	if (data.error) throw new Error(data.error?.message || data.error || 'getStremioLibrary failed');	
	
}





/*

{
        "_id": "tmdb:265195",
        "removed": false,
        "temp": false,
        "_ctime": "2026-04-23T15:12:19.410705716Z",
        "_mtime": "2026-04-23T17:52:45.323Z",
        "state": {
            "lastWatched": "2026-04-23T15:14:01.265378854Z",
            "timeWatched": 69961,
            "timeOffset": 0,
            "overallTimeWatched": 69961,
            "timesWatched": 0,
            "flaggedWatched": 0,
            "duration": 7319456,
            "video_id": "tt3011894",
            "watched": "",
            "noNotif": false,
            "season": 0,
            "episode": 0
        },
        "name": "Дикие истории",
        "type": "movie",
        "poster": "https://image.tmdb.org/t/p/w780/3nNB3PD7JDpm3XFPzNddlpz1Wqt.jpg",
        "posterShape": "poster",
        "background": "",
        "logo": "",
        "year": ""
}

{
        "_id": "tt31938062",
        "removed": false,
        "temp": false,
        "_ctime": "2026-05-02T10:41:20.384Z",
        "_mtime": "2026-05-29T22:06:17.094051434Z",
        "state": {
            "lastWatched": "2026-05-29T22:06:14.488167611Z",
            "timeWatched": 1314710,
            "timeOffset": 1314711,
            "overallTimeWatched": 175120692,
            "timesWatched": 30,
            "flaggedWatched": 0,
            "duration": 2953594,
            "video_id": "tt31938062:2:15",
            "watched": "tt31938062:2:14:29:eJz7//+/PAMDAA9UAx0=",
            "noNotif": false,
            "season": 0,
            "episode": 0
        },
        "name": "Больница Питт",
        "type": "series",
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/qNABFhduyxg5gvzFuuSPFRh2uls.jpg",
        "posterShape": "poster",
        "background": "",
        "logo": "",
        "year": ""
}

*/