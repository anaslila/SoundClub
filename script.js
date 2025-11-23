// ---- CONFIG ----
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwltH7ZbH3Ie9moQdCXpTBFqMerkxMFLdRhcalnZNEdLuSe7wzYZQEo1BAC-Bb0-eqg6A/exec";

// ---- USER SESSION ----
function setUserSession(user) { localStorage.setItem('sc_user', JSON.stringify(user)); }
function getUserSession() { try { return JSON.parse(localStorage.getItem('sc_user')); } catch { return null; } }
function clearUserSession() { localStorage.removeItem('sc_user'); }

// ---- HEADER PROFILE DISPLAY ----
function renderHeaderUser() {
  const user = getUserSession();
  const userBox = document.getElementById('userBox');
  const profileBox = document.getElementById('profileBox');
  if (user && user.username) {
    document.getElementById('profileName').textContent = user.fullName || user.username;
    document.getElementById('profileIcon').src = user.profileImage && user.profileImage.length > 5
      ? user.profileImage
      : 'https://i.postimg.cc/zXy2fwJZ/image.png';
    userBox.classList.add('hidden');
    profileBox.classList.remove('hidden');
  } else {
    userBox.classList.remove('hidden');
    profileBox.classList.add('hidden');
  }
}
window.renderHeaderUser = renderHeaderUser;

// ---- SIDEBAR NAV ----
document.querySelectorAll('.sidebar nav li').forEach(function (item) {
  item.addEventListener('click', function () {
    document.querySelectorAll('.sidebar nav li').forEach(li => li.classList.remove('active'));
    this.classList.add('active');
    
    const navId = this.id;
    if (navId === 'nav-home') {
      loadDashboard();
    } else if (navId === 'nav-uploads') {
      loadMyUploads();
    } else if (navId === 'nav-library') {
      loadLibrary();
    } else if (navId === 'nav-playlists') {
      loadPlaylists();
    }
  });
});

// ---- SEARCH BAR ANIMATION ----
const searchBox = document.getElementById('searchAnimBox');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchPlaceholder = document.getElementById('searchPlaceholder');
const clearBtn = document.getElementById('clearBtn');

function openSearchBar() {
  searchBox.classList.add('active');
  searchInput.focus();
  setTimeout(() => {
    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
  }, 60);
}
function closeSearchBar() {
  if (!searchInput.value.trim()) {
    searchBox.classList.remove('active');
    searchInput.blur();
  }
}
searchPlaceholder.addEventListener('click', openSearchBar);
searchInput.addEventListener('focus', openSearchBar);
searchInput.addEventListener('blur', closeSearchBar);

function toggleClearIcon() {
  clearBtn.style.display = (searchInput.value.length > 0 && searchBox.classList.contains('active')) ? 'block' : 'none';
}
searchInput.addEventListener('input', toggleClearIcon);
clearBtn.addEventListener('click', function () {
  searchInput.value = '';
  toggleClearIcon();
  searchInput.focus();
});
searchForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    console.log('Searching for:', query);
  }
  closeSearchBar();
});

// ---- LOGIN/SIGNUP MODALS ----
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = '';
}
document.getElementById('login-btn').addEventListener('click', function () { openModal('login-modal'); });
document.getElementById('signup-btn').addEventListener('click', function () { openModal('signup-modal'); });
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', function () { closeModal(this.dataset.modal); });
});
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(modal.id); });
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    document.querySelectorAll('.modal.active').forEach(m => closeModal(m.id));
    closeSearchBar();
  }
});
document.getElementById('show-signup').addEventListener('click', function(e) {
  e.preventDefault(); closeModal('login-modal'); openModal('signup-modal');
});
document.getElementById('show-login').addEventListener('click', function(e) {
  e.preventDefault(); closeModal('signup-modal'); openModal('login-modal');
});

// ---- LOGOUT ----
document.getElementById('logout-btn').addEventListener('click', function() {
  clearUserSession();
  renderHeaderUser();
  location.reload();
});

// ---- BACKEND AJAX ----
function postToBackend(data) {
  return fetch(BACKEND_URL, {
    method: "POST",
    mode: "cors",
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString()
  }).then(r => r.json());
}

function getFromBackend(params) {
  const url = BACKEND_URL + '?' + new URLSearchParams(params).toString();
  return fetch(url, { method: "GET", mode: "cors" }).then(r => r.json());
}

// ---- LOGIN FORM SUBMIT ----
document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = this.email.value.trim();
  const password = this.password.value;
  if (!email || !password) return;
  postToBackend({ action: "loginUser", email, password })
    .then(res => {
      if (res.success) {
        setUserSession(res);
        renderHeaderUser();
        closeModal('login-modal');
        loadDashboard();
      } else {
        alert(res.error || 'Login failed. Try again.');
      }
    }).catch(() => alert("Network/server error."));
});

// ---- SIGNUP FORM SUBMIT ----
document.getElementById('signup-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const username = this.username.value.trim();
  const email = this.email.value.trim();
  const password = this.password.value;
  const fullName = this.fullName.value.trim();
  const contactNumber = this.contactNumber.value.trim();
  const profileImage = this.profileImage.value.trim();
  const bio = this.bio.value.trim();
  const location = this.location.value.trim();
  if (!username || !email || !password || !fullName || !contactNumber) return;
  postToBackend({
    action: "registerUser",
    username, email, password, fullName, contactNumber, profileImage, bio, location
  })
    .then(res => {
      if (res.success) {
        setUserSession(res);
        renderHeaderUser();
        closeModal('signup-modal');
        loadDashboard();
      } else {
        alert(res.error || 'Signup failed.');
      }
    }).catch(() => alert("Network/server error."));
});

// ---- LOAD DASHBOARD (show user's uploads) ----
function loadDashboard() {
  const user = getUserSession();
  if (!user) {
    document.getElementById('main-content').innerHTML = `
      <section id="dashboard">
        <h2>Trending Now</h2>
        <p>Please login to see your uploaded songs.</p>
      </section>
    `;
    return;
  }
  
  getFromBackend({ action: 'getLibrary', userId: user.userId })
    .then(res => {
      if (res.success && res.songs && res.songs.length > 0) {
        renderSongs(res.songs, 'Trending Now');
      } else {
        document.getElementById('main-content').innerHTML = `
          <section id="dashboard">
            <h2>Trending Now</h2>
            <p>No songs uploaded yet. Register your first song!</p>
          </section>
        `;
      }
    }).catch(() => {
      document.getElementById('main-content').innerHTML = `
        <section id="dashboard">
          <h2>Trending Now</h2>
          <p>Error loading songs.</p>
        </section>
      `;
    });
}

// ---- LOAD MY UPLOADS ----
function loadMyUploads() {
  const user = getUserSession();
  if (!user) {
    alert('Please login to view your uploads.');
    return;
  }
  
  getFromBackend({ action: 'getLibrary', userId: user.userId })
    .then(res => {
      if (res.success && res.songs && res.songs.length > 0) {
        renderSongs(res.songs, 'My Uploads');
      } else {
        document.getElementById('main-content').innerHTML = `
          <section id="dashboard">
            <h2>My Uploads</h2>
            <p>You haven't uploaded any songs yet.</p>
          </section>
        `;
      }
    }).catch(() => {
      document.getElementById('main-content').innerHTML = `
        <section id="dashboard">
          <h2>My Uploads</h2>
          <p>Error loading your uploads.</p>
        </section>
      `;
    });
}

// ---- RENDER SONGS ----
function renderSongs(songs, title) {
  let html = `<section id="dashboard"><h2>${title}</h2><div class="cards-row" id="dashboard-songs">`;
  songs.forEach(song => {
    const songTitle = song[2] || 'Untitled';
    const artist = song[3] || 'Unknown Artist';
    const artwork = song[26] || 'https://via.placeholder.com/160';
    const songLink = song[27] || '#';
    
    html += `
      <div class="music-card" onclick="window.open('${songLink}', '_blank')">
        <img src="${artwork}" alt="${songTitle}" onerror="this.src='https://via.placeholder.com/160'" />
        <div class="music-card-info">
          <p class="music-card-title">${songTitle}</p>
          <p class="music-card-artist">${artist}</p>
        </div>
      </div>
    `;
  });
  html += `</div></section>`;
  document.getElementById('main-content').innerHTML = html;
}

// ---- LOAD LIBRARY (placeholder) ----
function loadLibrary() {
  document.getElementById('main-content').innerHTML = `
    <section id="dashboard">
      <h2>Library</h2>
      <p>Library feature coming soon...</p>
    </section>
  `;
}

// ---- LOAD PLAYLISTS (placeholder) ----
function loadPlaylists() {
  document.getElementById('main-content').innerHTML = `
    <section id="dashboard">
      <h2>My Playlists</h2>
      <p>Playlists feature coming soon...</p>
    </section>
  `;
}

// ---- UPLOAD/REGISTRATION PAGE (Both buttons) ----
function handleUploadClick() {
  const user = getUserSession();
  if (!user) {
    alert('Please login to register a song.');
    openModal('login-modal');
    return;
  }
  showRegistrationPage();
}

document.getElementById('upload-btn').addEventListener('click', handleUploadClick);
document.getElementById('upload-btn-logged').addEventListener('click', handleUploadClick);

function showRegistrationPage() {
  document.getElementById('main-content').innerHTML = `
    <div class="registration-fullscreen" id="regFullscreen">
      <div class="reg-header">
        <h1>Register Your Song</h1>
        <button class="reg-close-btn" id="regCloseBtn">✕ Close</button>
      </div>
      <form id="registration-form" class="reg-form" autocomplete="off">
        <div class="reg-columns">
          <div class="reg-col">
            <label>Song Title *<input type="text" name="songTitle" required /></label>
            <label>Primary Artist *<input type="text" name="primaryArtist" required /></label>
            <label>Featured Artist<input type="text" name="featuredArtist" /></label>
            <label>Album Title<input type="text" name="albumTitle" /></label>
            <label>Track Number<input type="number" name="trackNumber" /></label>
            <label>Disc Number<input type="number" name="discNumber" /></label>
            <label>Genre *<input type="text" name="genre" required /></label>
            <label>Subgenre<input type="text" name="subgenre" /></label>
            <label>Mood<input type="text" name="mood" /></label>
            <label>Language *<input type="text" name="language" required /></label>
            <label>Release Date<input type="date" name="releaseDate" /></label>
            <label>ISRC<input type="text" name="isrc" /></label>
            <label>Code<input type="text" name="code" /></label>
            <label>UPC<input type="text" name="upc" /></label>
            <label>EAN<input type="text" name="ean" /></label>
            <label>Composer<input type="text" name="composer" /></label>
            <label>Lyricist<input type="text" name="lyricist" /></label>
            <label>Producer<input type="text" name="producer" /></label>
            <label>Publisher<input type="text" name="publisher" /></label>
          </div>
          <div class="reg-col">
            <label>Label<input type="text" name="label" /></label>
            <label>BPM<input type="number" name="bpm" /></label>
            <label>Key<input type="text" name="key" /></label>
            <label>Duration (seconds)<input type="number" name="duration" /></label>
            <label>Explicit Content?<select name="explicit"><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></select></label>
            <label>Artwork URL *<input type="url" name="artworkUrl" required /></label>
            <label>Song Link (URL) *<input type="url" name="songLink" required /></label>
            <label>Lyrics<textarea name="lyrics" rows="3"></textarea></label>
            <label>Description<textarea name="description" rows="2"></textarea></label>
            <label>Location (Origin)<input type="text" name="location" /></label>
            <label>Copyright Year<input type="number" name="copyrightYear" /></label>
            <label>Copyright Owner<input type="text" name="copyrightOwner" /></label>
            <label>Spotify Link<input type="url" name="spotifyLink" /></label>
            <label>Apple Music Link<input type="url" name="appleMusicLink" /></label>
            <label>YouTube Link<input type="url" name="youtubeLink" /></label>
            <label>Other Platforms<input type="text" name="otherPlatforms" /></label>
            <label>Contact Email<input type="email" name="contactEmail" /></label>
          </div>
        </div>
        <div class="reg-actions">
          <button type="submit" class="reg-submit-btn">Submit Registration</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById('regCloseBtn').addEventListener('click', closeRegistrationPage);
  document.getElementById('registration-form').addEventListener('submit', handleRegistrationSubmit);
}

function closeRegistrationPage() {
  loadDashboard();
}

function handleRegistrationSubmit(e) {
  e.preventDefault();
  const user = getUserSession();
  if (!user) return alert('Session expired. Please login again.');
  const form = e.target;
  const data = {
    action: "registerUpload",
    userId: user.userId,
    songTitle: form.songTitle.value.trim(),
    primaryArtist: form.primaryArtist.value.trim(),
    featuredArtist: form.featuredArtist.value.trim(),
    albumTitle: form.albumTitle.value.trim(),
    trackNumber: form.trackNumber.value,
    discNumber: form.discNumber.value,
    genre: form.genre.value.trim(),
    subgenre: form.subgenre.value.trim(),
    mood: form.mood.value.trim(),
    language: form.language.value.trim(),
    releaseDate: form.releaseDate.value,
    isrc: form.isrc.value.trim(),
    code: form.code.value.trim(),
    upc: form.upc.value.trim(),
    ean: form.ean.value.trim(),
    composer: form.composer.value.trim(),
    lyricist: form.lyricist.value.trim(),
    producer: form.producer.value.trim(),
    publisher: form.publisher.value.trim(),
    label: form.label.value.trim(),
    bpm: form.bpm.value,
    key: form.key.value.trim(),
    duration: form.duration.value,
    explicit: form.explicit.value,
    artworkUrl: form.artworkUrl.value.trim(),
    songLink: form.songLink.value.trim(),
    lyrics: form.lyrics.value.trim(),
    description: form.description.value.trim(),
    location: form.location.value.trim(),
    copyrightYear: form.copyrightYear.value,
    copyrightOwner: form.copyrightOwner.value.trim(),
    spotifyLink: form.spotifyLink.value.trim(),
    appleMusicLink: form.appleMusicLink.value.trim(),
    youtubeLink: form.youtubeLink.value.trim(),
    otherPlatforms: form.otherPlatforms.value.trim(),
    contactEmail: form.contactEmail.value.trim()
  };
  postToBackend(data)
    .then(res => {
      if (res.success) {
        alert('Song registered successfully!');
        closeRegistrationPage();
      } else {
        alert(res.error || 'Registration failed.');
      }
    }).catch(() => alert("Network/server error."));
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  renderHeaderUser();
  toggleClearIcon();
  loadDashboard();
});
