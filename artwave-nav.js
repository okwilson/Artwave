// ── ARTFLOW SHARED NAVIGATION ──────────────────────────────
// Injects its own styles so nav looks identical on every page.

(function injectNavStyles() {
  if (document.getElementById('af-nav-styles')) return;
  const style = document.createElement('style');
  style.id = 'af-nav-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    nav#artwave-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
      background: #01415B; color: #f0f7e6;
      display: flex !important; align-items: center; justify-content: space-between;
      padding: 0 2rem; height: 58px;
      border-bottom: 2px solid #019587;
      font-family: 'DM Sans', sans-serif;
      box-sizing: border-box;
    }
    nav#artwave-nav * { box-sizing: border-box; }
    nav#artwave-nav .nav-logo {
      font-family: 'Playfair Display', serif !important;
      font-size: 1.4rem; letter-spacing: .04em; cursor: pointer;
      color: #f0f7e6; background: none; border: none; padding: 0;
      text-decoration: none; white-space: nowrap;
    }
    nav#artwave-nav .nav-logo span { color: #019587; font-style: italic; }
    nav#artwave-nav .nav-links { display: flex; gap: 0.25rem; align-items: center; }
    nav#artwave-nav .nav-btn {
      background: none; border: none; color: #f0f7e6;
      font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500;
      padding: 0.4rem 1rem; border-radius: 4px; cursor: pointer;
      transition: background 0.15s; white-space: nowrap;
    }
    nav#artwave-nav .nav-btn:hover { background: rgba(1,149,135,0.25); color: #A6BC09; }
    nav#artwave-nav .nav-btn.active { background: rgba(1,149,135,0.25); color: #A6BC09; }
    nav#artwave-nav .nav-right { display: flex; gap: 0.5rem; align-items: center; }
    nav#artwave-nav .nav-user {
      display: flex; align-items: center; gap: 0.6rem;
      font-size: 0.85rem; color: #f0f7e6; cursor: pointer;
    }
    nav#artwave-nav .nav-user span { color: #f0f7e6; font-size: 0.82rem; }
    nav#artwave-nav .nav-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem; color: white; flex-shrink: 0;
    }
    nav#artwave-nav .btn-primary {
      background: #019587; color: white; border: none;
      padding: 0.45rem 1.2rem; border-radius: 4px;
      font-family: 'DM Sans', sans-serif; font-weight: 500;
      font-size: 0.85rem; cursor: pointer; white-space: nowrap;
    }
    nav#artwave-nav .btn-primary:hover { background: #017a6e; }
    nav#artwave-nav .nav-logout {
      background: none; border: none; color: #4a7a6a;
      font-size: 0.78rem; cursor: pointer; font-family: 'DM Sans', sans-serif;
      padding: 0.4rem 0.6rem; border-radius: 4px;
    }
    nav#artwave-nav .nav-logout:hover { color: #f0f7e6; }
  `;
  document.head.appendChild(style);
})();

const SUPABASE_URL  = 'https://buwwogywlmqajtczgekc.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1d3dvZ3l3bG1xYWp0Y3pnZWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzgyNzEsImV4cCI6MjA5MDA1NDI3MX0.SHQWKWYTf5zcKX3D4HkFkrnp1SNSLM_IfNbmKkuRweg';

// Create a single shared Supabase client
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// Shared state — available to every page
window.AF = {
  db,
  user: null,
  profile: null,
};

const COLORS = ['#019587','#2980b9','#8e44ad','#4a7c59','#c0392b','#e91e63','#A6BC09'];
function _getColor(str) { let h=0; for(let c of (str||'')) h=(h*31+c.charCodeAt(0))%COLORS.length; return COLORS[h]; }
function _getInitial(name) { return (name||'?')[0].toUpperCase(); }

// Determine which page is active based on filename
function _activePage() {
  const path = window.location.pathname;
  if (path.includes('profile'))     return 'profile';
  if (path.includes('commissions')) return 'commissions';
  if (path.includes('dashboard'))   return 'dashboard';
  if (path.includes('messages'))    return 'messages';
  if (path.includes('discover'))    return 'discover';
  return '';
}

// Navigate to the user's own profile
async function goToProfile() {
  if (!window.AF.user) { window.location.href = 'artwave-auth.html'; return; }
  if (window.AF.profile?.username) {
    window.location.href = 'artwave-profile.html?u=' + window.AF.profile.username;
    return;
  }
  // Fallback — fetch username directly
  const { data } = await db.from('profiles').select('username').eq('id', window.AF.user.id).single();
  if (data?.username) {
    window.AF.profile = data;
    window.location.href = 'artwave-profile.html?u=' + data.username;
  } else {
    // No profile exists yet — send to auth to complete onboarding
    window.location.href = 'artwave-auth.html';
  }
}

// Navigate to any page
function goTo(page) {
  const pages = {
    discover:    'artwave-discover.html',
    commissions: 'artwave-commissions.html',
    dashboard:   'artwave-dashboard.html',
    messages:    'artwave-messages.html',
    auth:        'artwave-auth.html',
  };
  if (pages[page]) window.location.href = pages[page];
}

// Render the nav bar into #artwave-nav
async function initNav() {
  const navEl = document.getElementById('artwave-nav');
  if (!navEl) return;

  const { data: { session } } = await db.auth.getSession();
  const active = _activePage();

  if (session) {
    window.AF.user = session.user;
    const { data: profile } = await db.from('profiles').select('*').eq('id', session.user.id).single();
    window.AF.profile = profile;

    const name = profile?.display_name || profile?.username || session.user.email;
    const color = _getColor(name);
    const initial = _getInitial(name);

    navEl.innerHTML = `
      <div class="nav-logo" onclick="goTo('discover')">Art<span>wave</span></div>
      <div class="nav-links">
        <button class="nav-btn ${active==='discover'?'active':''}"  onclick="goTo('discover')">Discover</button>
        <button class="nav-btn ${active==='profile'?'active':''}"   onclick="goToProfile()">My Profile</button>
        <button class="nav-btn ${active==='messages'?'active':''}"  onclick="goTo('messages')">Messages</button>
        <button class="nav-btn ${active==='dashboard'?'active':''}" onclick="goTo('dashboard')">Dashboard</button>
      </div>
      <div class="nav-right">
        <div class="nav-user" onclick="goToProfile()">
          <div class="nav-avatar" style="background:${color}">${initial}</div>
          <span>${name}</span>
        </div>
        <button class="nav-logout" onclick="signOut()">Log out</button>
      </div>`;
  } else {
    navEl.innerHTML = `
      <div class="nav-logo" onclick="goTo('discover')">Art<span>wave</span></div>
      <div class="nav-links">
        <button class="nav-btn ${active==='discover'?'active':''}" onclick="goTo('discover')">Discover</button>
      </div>
      <div class="nav-right">
        <button class="nav-btn" onclick="goTo('auth')">Log In</button>
        <button class="btn-primary" onclick="goTo('auth')">Sign Up Free</button>
      </div>`;
  }

  // Return session so each page can use it
  return session;
}

async function signOut() {
  await db.auth.signOut();
  window.location.href = 'artwave-auth.html';
}

// Shared toast
function showToast(msg) {
  let t = document.getElementById('af-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'af-toast';
    t.style.cssText = 'position:fixed;bottom:2rem;right:2rem;z-index:9999;background:#01415B;color:#f0f7e6;padding:.85rem 1.5rem;border-radius:8px;font-size:.88rem;border-left:4px solid #019587;opacity:0;transform:translateY(10px);transition:all .3s;pointer-events:none;font-family:"DM Sans",sans-serif';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'none';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; }, 2800);
}
