const express = require('express');
const router = express.Router();
const { spotifyApi } = require('./api/spotifySetup');
const middleware = require('../middleware');

// Spotify Dashboard
router.get('/', middleware.requireLogin, async (req, res) => {
  const accessToken = req.session.spotifyAccessToken;

  if (!accessToken) {
    return res.redirect('/auth/login');
  }

  spotifyApi.setAccessToken(accessToken);

  try {
    const topTracks = await spotifyApi.getMyTopTracks({ limit: 5 });
    const topArtists = await spotifyApi.getMyTopArtists({ limit: 5 });
    //const topAlbums = topTracks.body.items.map((track) => track.album);
    const test = await spotifyApi.getMyTopTracks({ limit: 50 });
    const albums = test.body.items.map(track => track.album);

    const uniqueAlbums = Array.from(
      new Map(albums.map(album => [album.id, album])).values()
    );

    const topDistinctAlbums = uniqueAlbums.slice(0, 5);

    if (!topArtists.body.items.length) {
      console.warn("No top artists available for this user.");
  }

    const payload = {
      pageTitle: 'Spotify Dashboard',
      userLoggedIn: req.session.user,
      userLoggedInJs: JSON.stringify(req.session.user),
      topTracks: topTracks.body.items,
      topArtists: topArtists.body.items,
      topDistinctAlbums,
    };

    res.status(200).render('spotifyDashboard', payload);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Failed to load Spotify data. Please try again.');
  }
});

module.exports = router;
