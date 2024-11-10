const API_KEY = 'AIzaSyBdBmI9KClLJeazI18-WWFPV0ngrSbwTTQ';
let nextPageToken = ''; // For pagination
let isFetching = false; // To prevent multiple requests at once

// Detect theme preference
const themeToggleButton = document.getElementById('theme-toggle');
const bodyElement = document.body;
themeToggleButton.addEventListener('click', toggleTheme);

function toggleTheme() {
  bodyElement.classList.toggle('dark-mode');
}

// Search function
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchVideos();
  }
});

searchButton.addEventListener('click', searchVideos);

async function searchVideos() {
  const searchTerm = searchInput.value.trim();
  if (!searchTerm) {
    return; // No search term, do nothing
  }

  document.querySelector('.video-container').innerHTML = ''; // Clear current videos
  nextPageToken = ''; // Reset pagination

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${searchTerm}&key=${API_KEY}`);
    const data = await response.json();

    // Only display videos related to the search term
    if (data.items) {
      displayVideos(data.items);
      nextPageToken = data.nextPageToken; // Set the next page token for future requests
    } else {
      document.querySelector('.video-container').innerHTML = '<p>No results found</p>';
    }
  } catch (error) {
    console.error('Error searching videos:', error);
  }
}

// Fetch and display popular videos
async function fetchPopularVideos() {
  if (isFetching) return;
  isFetching = true;
  document.getElementById('infinite-scroll-loader').style.display = 'block';

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=US&maxResults=8&pageToken=${nextPageToken}&key=${API_KEY}`);
    const data = await response.json();

    displayVideos(data.items);
    nextPageToken = data.nextPageToken;
  } catch (error) {
    console.error('Error fetching popular videos:', error);
  } finally {
    isFetching = false;
    document.getElementById('infinite-scroll-loader').style.display = 'none';
  }
}

function displayVideos(videos) {
  const videoContainer = document.querySelector('.video-container');
  videos.forEach(video => {
    const videoCard = createVideoCard(video);
    videoContainer.appendChild(videoCard);
  });
}

function createVideoCard(video) {
  const videoCard = document.createElement('div');
  videoCard.classList.add('video-card');
  videoCard.onclick = () => openPlayer(`https://www.youtube.com/embed/${video.id.videoId}`);

  const thumbnail = document.createElement('img');
  thumbnail.src = video.snippet.thumbnails.high.url;
  thumbnail.alt = 'Miniatura del video';

  const title = document.createElement('h3');
  title.textContent = video.snippet.title;

  const channel = document.createElement('p');
  channel.textContent = video.snippet.channelTitle;

  videoCard.append(thumbnail, title, channel);
  return videoCard;
}

function openPlayer(videoUrl) {
  const playerContainer = document.createElement('div');
  playerContainer.classList.add('player-container');

  const iframe = document.createElement('iframe');
  iframe.src = `${videoUrl}?autoplay=1&controls=1`;
  iframe.allow = 'autoplay; encrypted-media';
  iframe.allowFullscreen = true;

  playerContainer.appendChild(iframe);

  const closeButton = document.createElement('button');
  closeButton.classList.add('close-button');
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => document.body.removeChild(playerContainer);

  playerContainer.appendChild(closeButton);
  document.body.appendChild(playerContainer);

  playerContainer.addEventListener('click', (e) => {
    if (e.target === playerContainer) {
      document.body.removeChild(playerContainer);
    }
  });
}

// Infinite scroll for search results
window.onscroll = async function() {
  // Check if the user is near the bottom of the page
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !isFetching && searchInput.value.trim()) {
    await fetchMoreSearchResults();
  } 
  // If no search input, load popular videos
  else if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !isFetching && !searchInput.value.trim()) {
    await fetchPopularVideos();
  }
};

async function fetchMoreSearchResults() {
  if (!nextPageToken) return; // If no next page token, stop fetching

  const searchTerm = searchInput.value.trim();
  if (!searchTerm) return; // No search term, do nothing

  isFetching = true;
  document.getElementById('infinite-scroll-loader').style.display = 'block';

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${searchTerm}&pageToken=${nextPageToken}&key=${API_KEY}`);
    const data = await response.json();

    if (data.items) {
      displayVideos(data.items); // Append more videos
      nextPageToken = data.nextPageToken; // Set next page token
    }
  } catch (error) {
    console.error('Error fetching more search results:', error);
  } finally {
    isFetching = false;
    document.getElementById('infinite-scroll-loader').style.display = 'none';
  }
}

// Initial load
window.onload = () => {
  fetchPopularVideos(); // Load initial popular videos
};

// Referencias al formulario y botón
const publishButton = document.getElementById('publish-video-button');
const publishForm = document.getElementById('publish-form');
const closeFormButton = document.getElementById('close-form-button');
const submitVideoButton = document.getElementById('submit-video-button');

publishButton.addEventListener('click', () => {
  publishForm.style.display = 'flex';
});

closeFormButton.addEventListener('click', () => {
  publishForm.style.display = 'none';
});

// Abrir y cerrar el formulario de publicación
publishButton.addEventListener('click', () => {
  publishForm.style.display = 'flex';
});

closeFormButton.addEventListener('click', () => {
  publishForm.style.display = 'none';
});

// Publicar video
submitVideoButton.addEventListener('click', publishVideo);

function publishVideo() {
  const videoUrl = document.getElementById('video-url').value;
  const videoTitle = document.getElementById('video-title').value;
  const videoDescription = document.getElementById('video-description').value;

  // Validar campos
  if (!videoUrl || !videoTitle || !videoDescription) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  // Crear objeto de video simulado
  const video = {
    id: { videoId: extractVideoId(videoUrl) },
    snippet: {
      title: videoTitle,
      description: videoDescription,
      channelTitle: "Tu Canal",
      thumbnails: {
        high: { url: `https://img.youtube.com/vi/${extractVideoId(videoUrl)}/hqdefault.jpg` }
      }
    }
  };

  // Agregar el video a la interfaz
  const videoContainer = document.querySelector('.video-container');
  const videoCard = createVideoCard(video);
  videoContainer.prepend(videoCard); // Insertar el video al principio

  // Limpiar formulario y cerrar
  publishForm.style.display = 'none';
  document.getElementById('video-url').value = '';
  document.getElementById('video-title').value = '';
  document.getElementById('video-description').value = '';
}

// Extraer ID de video de YouTube
function extractVideoId(url) {
  const urlParams = new URL(url).searchParams;
  return urlParams.get('v');
}
// Funcionalidad del botón de cierre
closeFormButton.addEventListener('click', () => {
  publishForm.style.display = 'none';
});
