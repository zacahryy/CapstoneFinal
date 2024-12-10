const express = require('express');
const router = express.Router();
const { getAuthorizationUrl, handleAuthCallback, spotifyApi } = require('./api/spotifySetup');

// Redirect to Spotify login
router.get('/login', (req, res) => {
  const authUrl = getAuthorizationUrl();
  res.redirect(authUrl);
});

// Handle Spotify callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const accessToken = await handleAuthCallback(code);
    req.session.spotifyAccessToken = accessToken;
    res.redirect('/spotify-dashboard');
  } catch (error) {
    console.error('Error during Spotify authentication:', error);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

module.exports = router;
