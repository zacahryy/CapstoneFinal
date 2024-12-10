const express = require('express')
const app = express();
const port = 3001;
const middleware = require('./middleware');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('./database');
const session = require("express-session");

// Spotify API setup
const { spotifyApi, initializeSpotify } = require('./routes/api/spotifySetup');

// Initialize Spotify API during startup
initializeSpotify();

const server = app.listen(port, () => console.log("Server listening on port " + port));

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: "Magnesium",
    resave: true,
    saveUninitialized: false
}))

//Routes
const loginRoutes = require('./routes/loginRoutes');
const registerRoutes = require('./routes/registerRoutes');
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/authRoutes');
const spotifyDashboardRoutes = require('./routes/spotifyDashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

//API Routes
const postApiRoutes = require('./routes/api/posts');
const usersApiRoutes = require('./routes/api/users');

app.use('/login', loginRoutes);
app.use('/register', registerRoutes);
app.use('/posts', postRoutes);
app.use('/auth', authRoutes);
app.use('/spotify-dashboard', spotifyDashboardRoutes);
app.use('/profile', profileRoutes);
app.use('/uploads', uploadRoutes);

app.use('/api/posts', middleware.requireLogin, postApiRoutes);
app.use('/api/users', usersApiRoutes);
app.use('/api/spotifySetup', (req, res, next) => {
    req.spotifyApi = spotifyApi; // Attach Spotify API to request
    next();
});

app.get('/', middleware.requireLogin, (req, res, next) => {

    var payload = {
        pageTitle: "Home",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    }

    res.status(200).render("home", payload);
})

// API endpoint to get the Spotify access token
app.get('/api/spotify/access-token', (req, res) => {
    const accessToken = spotifyApi.getAccessToken();
    if (accessToken) {
        res.json({ accessToken });
    } else {
        res.status(500).json({ error: 'Access token not available. Please initialize Spotify API.' });
    }
})

// API endpoint to get featured playlists
app.get('/api/spotify/featured-playlists', async (req, res) => {
    try {
        // Fetch featured playlists
        const playlists = await spotifyApi.getFeaturedPlaylists();
        const playlistId = playlists.body.playlists.items[0].id; // Example: Get the first playlist ID

        // Fetch tracks in the playlist
        const playlistTracks = await spotifyApi.getPlaylistTracks(playlistId);
        res.json(playlistTracks.body); // Send tracks to the client
    } catch (error) {
        console.error("Error fetching featured playlists null:", error);
        res.status(500).json({ error: "Failed to fetch Spotify data." });
    }
});

app.get('/api/spotify/top-tracks', async (req, res) => {
    try {
        const topTracks = await spotifyApi.getMyTopTracks({ limit: 5 }); // Fetch top 5 tracks
        res.json(topTracks.body); // Ensure the response body includes the tracks
    } catch (error) {
        console.error("Error fetching top tracks from Spotify:", error);
        res.status(500).json({ error: "Failed to fetch top tracks." });
    }
});

// Search Spotify API
app.get('/api/spotify/search', async (req, res) => {
    const { type, q } = req.query;

    try {
        // Ensure the access token is valid
        const accessToken = await getAccessToken();

        // Construct the Spotify API URL
        const url = `https://api.spotify.com/v1/search?type=${type}&q=${encodeURIComponent(q)}`;

        // Fetch data from Spotify API
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Spotify API error: ${response.status}`);
        }

        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error("Error searching Spotify:", error);
        res.status(500).json({ error: "Failed to search Spotify." });
    }
});

// Get the access token
async function getAccessToken() {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        return data.body.access_token;
    } catch (error) {
        console.error("Error getting Spotify access token:", error);
        throw new Error("Failed to get access token");
    }
}