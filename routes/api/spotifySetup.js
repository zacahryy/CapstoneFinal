const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID || '18245650265b497184fd0b473d29cea8',
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '661aad6b1f0646ac81fb445a89051df0',
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3001/auth/callback',
});

function getAuthorizationUrl() {
  const scopes = ['user-top-read'];
  return spotifyApi.createAuthorizeURL(scopes, null);
}

async function handleAuthCallback(code) {
  const data = await spotifyApi.authorizationCodeGrant(code);
  spotifyApi.setAccessToken(data.body['access_token']);
  spotifyApi.setRefreshToken(data.body['refresh_token']);
  return data.body['access_token'];
}

// Function to set up and retrieve an access token
async function initializeSpotify() {
  try {
    // Retrieve an access token
    const data = await spotifyApi.clientCredentialsGrant();
    const accessToken = data.body['access_token'];
    const expiresIn = data.body['expires_in'];

    // Set the access token
    spotifyApi.setAccessToken(accessToken);

    console.log('Spotify API initialized successfully!');
    console.log(`Access token expires in ${expiresIn} seconds.`);

    // Schedule token refresh
    scheduleTokenRefresh(expiresIn);

    return spotifyApi;
  } catch (error) {
    console.error('Error initializing Spotify API:', error);
    throw error;
  }
}

// Function to refresh the access token
async function refreshToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    const accessToken = data.body['access_token'];
    const expiresIn = data.body['expires_in'];

    // Set the new access token
    spotifyApi.setAccessToken(accessToken);

    console.log('Access token refreshed successfully!');
    console.log(`New access token expires in ${expiresIn} seconds.`);

    // Schedule the next token refresh
    scheduleTokenRefresh(expiresIn);
  } catch (error) {
    console.error('Error refreshing access token:', error);
  }
}

// Function to schedule the next token refresh
function scheduleTokenRefresh(expiresIn) {
  const refreshInterval = (expiresIn - 60) * 1000; // Refresh 1 minute before expiration
  setTimeout(refreshToken, refreshInterval);
}

module.exports = {
  spotifyApi,
  initializeSpotify,
  getAuthorizationUrl,
  handleAuthCallback,
};