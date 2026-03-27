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
    @media (max-width: 600px) {
      nav#artwave-nav { padding: 0 1rem; }
      nav#artwave-nav .nav-links { display: none; }
      nav#artwave-nav .nav-user span { display: none; }
      nav#artwave-nav .nav-logout { display: none; }
    }
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

const NAV_COLORS = ['#019587','#2980b9','#8e44ad','#4a7c59','#c0392b','#e91e63','#A6BC09'];
function _getColor(str) { let h=0; for(let c of (str||'')) h=(h*31+c.charCodeAt(0))%NAV_COLORS.length; return NAV_COLORS[h]; }
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

  // Try to get session — if expired, refresh it automatically
  let { data: { session } } = await db.auth.getSession();

  if (!session) {
    // Try refreshing the session before giving up
    const { data: refreshed } = await db.auth.refreshSession();
    session = refreshed?.session || null;
  }

  // Listen for auth state changes and reload if session restored
  db.auth.onAuthStateChange((event, newSession) => {
    if (event === 'SIGNED_IN' && !window.AF.user) {
      window.location.reload();
    }
    if (event === 'SIGNED_OUT') {
      window.location.href = 'artwave-auth.html';
    }
  });

  const active = _activePage();

  if (session) {
    window.AF.user = session.user;
    const { data: profile } = await db.from('profiles').select('*').eq('id', session.user.id).single();
    window.AF.profile = profile;

    const name = profile?.display_name || profile?.username || session.user.email;
    const color = _getColor(name);
    const initial = _getInitial(name);

    navEl.innerHTML = `
      <div class="nav-logo" onclick="goTo('discover')" style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;background:none;border:none;">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Abstract artistic mark — overlapping geometric shapes suggesting creativity and flow -->
          <rect x="2" y="8" width="12" height="12" rx="1" fill="#019587" opacity="0.9"/>
          <rect x="8" y="4" width="12" height="12" rx="1" fill="#A6BC09" opacity="0.85"/>
          <rect x="14" y="12" width="12" height="12" rx="1" fill="#f0f7e6" opacity="0.7"/>
          <!-- Bold outline stroke -->
          <rect x="2" y="8" width="12" height="12" rx="1" fill="none" stroke="#f0f7e6" stroke-width="1.5"/>
          <rect x="8" y="4" width="12" height="12" rx="1" fill="none" stroke="#f0f7e6" stroke-width="1.5"/>
          <rect x="14" y="12" width="12" height="12" rx="1" fill="none" stroke="#f0f7e6" stroke-width="1.5"/>
        </svg>
        <span style="font-family:'Bodoni Moda','Playfair Display',serif;font-size:1.35rem;font-weight:900;letter-spacing:-.01em;color:#f0f7e6;">Art<span style="color:#A6BC09;font-style:normal;font-weight:900;letter-spacing:-.02em;">wave</span></span>
      </div>
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
        <div style="position:relative;display:inline-block">
          <button id="af-notif-btn" onclick="toggleNotifications()" style="background:none;border:none;cursor:pointer;color:#a8c8b8;padding:0.4rem;display:flex;align-items:center;position:relative;transition:color 0.15s" onmouseover="this.style.color='#f0f7e6'" onmouseout="this.style.color='#a8c8b8'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span id="af-notif-count" style="display:none;position:absolute;top:-2px;right:-2px;background:#b84040;color:white;font-size:0.6rem;font-weight:800;min-width:16px;height:16px;border-radius:999px;display:flex;align-items:center;justify-content:center;border:2px solid #01415B;padding:0 3px"></span>
          </button>
          <div id="af-notif-dropdown" style="display:none;position:absolute;right:0;top:calc(100% + 8px);width:320px;background:white;border:2.5px solid #01415B;box-shadow:5px 5px 0 #01415B;border-radius:4px;z-index:9999;max-height:400px;overflow-y:auto">
            <div style="padding:0.85rem 1.1rem;border-bottom:2px solid #c8dba0;display:flex;justify-content:space-between;align-items:center;background:#01415B;color:#f0f7e6">
              <span style="font-family:'Playfair Display',serif;font-size:0.95rem;font-weight:700">Notifications</span>
              <button onclick="markAllRead()" style="background:none;border:none;color:#A6BC09;font-size:0.72rem;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600">Mark all read</button>
            </div>
            <div id="af-notif-list" style="padding:0">
              <div style="padding:2rem;text-align:center;color:#4a7a6a;font-size:0.85rem">Loading…</div>
            </div>
          </div>
        </div>
        <button class="nav-logout" onclick="signOut()">Log out</button>
      </div>`;

    // Load notifications
    loadNotifications(session.user.id);

    // Inject mobile bottom nav into every page
    if (!document.getElementById('af-mobile-nav')) {
      const mobileNav = document.createElement('div');
      mobileNav.id = 'af-mobile-nav';
      mobileNav.innerHTML = `
        <button class="af-mn-btn ${active==='discover'?'af-active':''}" onclick="goTo('discover')">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          Discover
        </button>
        <button class="af-mn-btn ${active==='profile'?'af-active':''}" onclick="goToProfile()">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Profile
        </button>
        <button class="af-mn-btn ${active==='messages'?'af-active':''}" onclick="goTo('messages')">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Messages
        </button>
        <button class="af-mn-btn ${active==='dashboard'?'af-active':''}" onclick="goTo('dashboard')">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Dashboard
        </button>`;
      document.body.appendChild(mobileNav);

      // Add mobile nav styles
      const mobileStyle = document.createElement('style');
      mobileStyle.textContent = `
        #af-mobile-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          background: #01415B; border-top: 2px solid #A6BC09;
          z-index: 9999; padding: 0.3rem 0;
          box-shadow: 0 -4px 12px rgba(0,0,0,0.2);
        }
        .af-mn-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          gap: 0.15rem; background: none; border: none; color: #a8c8b8;
          font-size: 0.58rem; font-weight: 700; cursor: pointer; padding: 0.4rem 0.25rem;
          font-family: 'DM Sans', sans-serif; text-transform: uppercase; letter-spacing: .04em;
          transition: color 0.15s;
        }
        .af-mn-btn svg { width: 22px; height: 22px; stroke: currentColor; }
        .af-mn-btn.af-active { color: #A6BC09; }
        .af-mn-btn:hover { color: #f0f7e6; }
        @media (max-width: 768px) {
          #af-mobile-nav { display: flex !important; }
          body { padding-bottom: 60px; }
        }
      `;
      document.head.appendChild(mobileStyle);
    }
  } else {
    navEl.innerHTML = `
      <div class="nav-logo" onclick="goTo('discover')" style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;background:none;border:none;">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="8" width="12" height="12" rx="1" fill="#019587" opacity="0.9"/>
          <rect x="8" y="4" width="12" height="12" rx="1" fill="#A6BC09" opacity="0.85"/>
          <rect x="14" y="12" width="12" height="12" rx="1" fill="#f0f7e6" opacity="0.7"/>
          <rect x="2" y="8" width="12" height="12" rx="1" fill="none" stroke="#f0f7e6" stroke-width="1.5"/>
          <rect x="8" y="4" width="12" height="12" rx="1" fill="none" stroke="#f0f7e6" stroke-width="1.5"/>
          <rect x="14" y="12" width="12" height="12" rx="1" fill="none" stroke="#f0f7e6" stroke-width="1.5"/>
        </svg>
        <span style="font-family:'Bodoni Moda','Playfair Display',serif;font-size:1.35rem;font-weight:900;letter-spacing:-.01em;color:#f0f7e6;">Art<span style="color:#A6BC09;font-style:normal;font-weight:900;letter-spacing:-.02em;">wave</span></span>
      </div>
      <div class="nav-links">
        <button class="nav-btn ${active==='discover'?'active':''}" onclick="goTo('discover')">Discover</button>
      </div>
      <div class="nav-right">
        <button class="nav-btn" onclick="goTo('auth')">Log In</button>
        <button class="btn-primary" onclick="goTo('auth')">Sign Up Free</button>
      </div>`;
  }

      // Add Bodoni Moda font for logo if not already loaded
      if (!document.getElementById('af-logo-font')) {
        const link = document.createElement('link');
        link.id = 'af-logo-font';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,700;0,900;1,700&display=swap';
        document.head.appendChild(link);
      }
}

async function signOut() {
  await db.auth.signOut();
  window.location.href = 'artwave-auth.html';
}

// ── NOTIFICATIONS ──────────────────────────────
async function loadNotifications(userId) {
  const { data } = await db.from('notifications')
    .select('*').eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  renderNotifications(data || []);

  // Realtime updates
  db.channel('notifs-' + userId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      async () => {
        const { data: fresh } = await db.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
        renderNotifications(fresh || []);
        // Flash the bell
        const btn = document.getElementById('af-notif-btn');
        if (btn) { btn.style.color = '#A6BC09'; setTimeout(() => btn.style.color = '#a8c8b8', 1000); }
      })
    .subscribe();
}

function renderNotifications(notifs) {
  const list = document.getElementById('af-notif-list');
  const countEl = document.getElementById('af-notif-count');
  if (!list || !countEl) return;

  const unread = notifs.filter(n => !n.is_read).length;

  if (unread > 0) {
    countEl.style.display = 'flex';
    countEl.textContent = unread > 9 ? '9+' : unread;
  } else {
    countEl.style.display = 'none';
  }

  if (!notifs.length) {
    list.innerHTML = `<div style="padding:2rem;text-align:center;color:#4a7a6a;font-size:0.85rem">No notifications yet</div>`;
    return;
  }

  const ICONS = {
    commission_request: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>',
    commission_accepted: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
    new_message: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    payment: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    review: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    status_update: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.37-7.51"/></svg>',
  };

  list.innerHTML = notifs.map(n => {
    const icon = ICONS[n.type] || ICONS.status_update;
    const time = new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `
      <div onclick="handleNotifClick('${n.id}','${n.link||''}')" style="padding:0.85rem 1.1rem;border-bottom:1px solid #c8dba0;cursor:pointer;display:flex;gap:0.75rem;align-items:flex-start;background:${n.is_read?'white':'#f0fdf4'};transition:background 0.15s" onmouseover="this.style.background='#e8f4d8'" onmouseout="this.style.background='${n.is_read?'white':'#f0fdf4'}'">
        <div style="width:30px;height:30px;border-radius:50%;background:${n.is_read?'#e8f4e0':'#019587'};color:${n.is_read?'#4a7a6a':'white'};display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1.5px solid #01415B">${icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:0.82rem;font-weight:${n.is_read?'400':'700'};color:#01415B;line-height:1.4">${n.title}</div>
          ${n.body ? `<div style="font-size:0.75rem;color:#4a7a6a;margin-top:0.15rem;line-height:1.4">${n.body}</div>` : ''}
          <div style="font-size:0.68rem;color:#4a7a6a;margin-top:0.25rem">${time}</div>
        </div>
        ${!n.is_read ? '<div style="width:8px;height:8px;border-radius:50%;background:#019587;flex-shrink:0;margin-top:4px"></div>' : ''}
      </div>`;
  }).join('');
}

async function handleNotifClick(id, link) {
  // Mark as read
  await db.from('notifications').update({ is_read: true }).eq('id', id);
  document.getElementById('af-notif-dropdown').style.display = 'none';
  if (link) window.location.href = link;
}

async function markAllRead() {
  if (!window.AF.user) return;
  await db.from('notifications').update({ is_read: true }).eq('user_id', window.AF.user.id).eq('is_read', false);
  const { data } = await db.from('notifications').select('*').eq('user_id', window.AF.user.id).order('created_at', { ascending: false }).limit(20);
  renderNotifications(data || []);
}

function toggleNotifications() {
  const dropdown = document.getElementById('af-notif-dropdown');
  if (!dropdown) return;
  const isOpen = dropdown.style.display !== 'none';
  dropdown.style.display = isOpen ? 'none' : 'block';
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const btn = document.getElementById('af-notif-btn');
  const dropdown = document.getElementById('af-notif-dropdown');
  if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

// ── CREATE NOTIFICATION (call this from any page) ──
async function createNotification(userId, type, title, body, link) {
  if (!userId) return;
  await db.from('notifications').insert({ user_id: userId, type, title, body, link });
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
