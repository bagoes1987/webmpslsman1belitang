// ============================================================
// SAPA Smansabel – Dashboard JavaScript
// Data rendering, tables, charts, tabs
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  // ── Guard ──────────────────────────────────────────────────
  if (typeof guardDashboard === 'function') {
    if (!guardDashboard()) return;
  } else {
    if (!sessionStorage.getItem('sapa_admin_session')) {
      window.location.href = 'admin.html';
      return;
    }
  }

  // ── Set user info ──────────────────────────────────────────
  const userName = sessionStorage.getItem('sapa_admin_session') || 'Admin';
  document.querySelectorAll('[data-admin-name]').forEach(el => el.textContent = userName);

  // ── Load Data & Remote Sync ────────────────────────────────
  let muridData = JSON.parse(localStorage.getItem('sapa_murid') || '[]');
  let ckgData   = JSON.parse(localStorage.getItem('sapa_ckg')   || '[]');
  let registrasiData = JSON.parse(localStorage.getItem('sapa_siswa_db') || '[]');

  async function syncAdminDataFromServer() {
    try {
      // Sync siswa
      const resSiswa = await fetch('api.php?action=get_siswa');
      const jsonSiswa = await resSiswa.json();
      if (jsonSiswa.status === 'success' && jsonSiswa.data) {
        localStorage.setItem('sapa_siswa_db', JSON.stringify(jsonSiswa.data));
        registrasiData = jsonSiswa.data;
        if (typeof populatePeletonFilter === 'function') {
          populatePeletonFilter(registrasiData);
        }
        if (typeof filterRegistrasiData === 'function') {
          filterRegistrasiData();
        } else if (typeof renderRegistrasiTable === 'function') {
          renderRegistrasiTable(registrasiData);
        }
      }
      
      // Sync deteksi dini (murid)
      const resMurid = await fetch('api.php?action=get_deteksi_dini');
      const jsonMurid = await resMurid.json();
      if (jsonMurid.status === 'success' && jsonMurid.data) {
        localStorage.setItem('sapa_murid', JSON.stringify(jsonMurid.data));
        muridData = jsonMurid.data;
        if (typeof renderTable === 'function') {
          renderTable(muridData);
        }
        if (typeof renderKarakterChart === 'function') {
          renderKarakterChart(muridData);
        }
      }

      // Sync CKG
      const resCkg = await fetch('api.php?action=get_ckg');
      const jsonCkg = await resCkg.json();
      if (jsonCkg.status === 'success' && jsonCkg.data) {
        localStorage.setItem('sapa_ckg', JSON.stringify(jsonCkg.data));
        ckgData = jsonCkg.data;
        if (typeof renderTableCKG === 'function') {
          renderTableCKG(ckgData);
        }
      }
      if (typeof updateStatistics === 'function') {
        updateStatistics();
      }
    } catch (e) {
      console.warn("Failed to sync admin data with MySQL server:", e);
    }
  }

  // Clear any old local storage demo data on first load to start completely fresh
  if (!localStorage.getItem('sapa_clean_v2')) {
    localStorage.removeItem('sapa_murid');
    localStorage.removeItem('sapa_ckg');
    localStorage.setItem('sapa_clean_v2', 'true');
    muridData = [];
    ckgData = [];
  }

  // Run sync in background on load
  syncAdminDataFromServer();

  // Poll server for updates every 15 seconds to keep data live automatically
  setInterval(syncAdminDataFromServer, 15000);

  // ── Logout Handler ──────────────────────────────────────────
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
        sessionStorage.removeItem('sapa_admin_session');
        window.location.href = 'admin.html';
      }
    });
  });

  // ── Statistics ─────────────────────────────────────────────
  function updateStatistics() {
    const totalSiswaCount = registrasiData.length;
    const sudahCKGCount     = ckgData.length;
    const belumCKGCount     = Math.max(0, totalSiswaCount - sudahCKGCount);
    const butuhABKCount     = muridData.filter(m => m.abk && m.abk !== 'non-abk').length;

    setCount('statTotal',   totalSiswaCount);
    setCount('statCKG',     sudahCKGCount);
    setCount('statBelumCKG',belumCKGCount);
    setCount('statABK',     butuhABKCount);
  }

  // Initial stats calculation
  updateStatistics();

  // ── Date / Time ────────────────────────────────────────────
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  document.querySelectorAll('[data-date]').forEach(el => el.textContent = dateStr);

  // ── Murid Table ────────────────────────────────────────────
  const muridTbody = document.getElementById('muridTbody');
  const muridSearch = document.getElementById('muridSearch');

  function renderMuridTable(data) {
    if (!muridTbody) return;
    if (data.length === 0) {
      muridTbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="7">
            <div style="text-align:center; padding: 3rem 0; color: var(--gray-400);">
              <div style="font-size:3rem; margin-bottom:1rem;">📭</div>
              <div style="font-weight:600; font-size:1rem; color:var(--gray-600);">Belum ada data murid</div>
              <div style="font-size:0.875rem; margin-top:0.5rem;">Data akan muncul setelah murid mengisi Formulir Deteksi Dini</div>
            </div>
          </td>
        </tr>`;
      return;
    }
    muridTbody.innerHTML = data.map((m, idx) => {
      const ckg = ckgData.find(c => c.nisn === m.nisn);
      const ckgStatus = ckg
        ? `<span class="badge badge-normal">✅ Terdaftar</span>`
        : `<span class="badge badge-kurang">⏳ Belum</span>`;
      const abkStatus = m.abk === 'non-abk' || !m.abk
        ? `<span class="badge" style="background:var(--gray-100);color:var(--gray-600);">—</span>`
        : `<span class="badge badge-lebih">⚡ ${m.abk}</span>`;
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <div style="font-weight:600;color:var(--gray-900);">${m.nama || '—'}</div>
            <div style="font-size:0.8rem;color:var(--gray-500);">${m.nisn || '—'}</div>
          </td>
          <td>${m.kelas || '—'}</td>
          <td><span class="badge badge-blue">${m.karakter || '—'}</span></td>
          <td>${ckgStatus}</td>
          <td>${abkStatus}</td>
          <td>
            <button onclick="viewMurid(${m.id})"
              style="background:var(--blue-50);border:none;color:var(--blue-700);padding:0.35rem 0.75rem;border-radius:6px;cursor:pointer;font-size:0.8rem;font-weight:600;">
              👁 Detail
            </button>
          </td>
        </tr>`;
    }).join('');
  }

  renderMuridTable(muridData);

  if (muridSearch) {
    muridSearch.addEventListener('input', () => {
      const q = muridSearch.value.toLowerCase();
      const filtered = muridData.filter(m =>
        (m.nama  || '').toLowerCase().includes(q) ||
        (m.nisn  || '').toLowerCase().includes(q) ||
        (m.kelas || '').toLowerCase().includes(q)
      );
      renderMuridTable(filtered);
    });
  }

  // ── CKG Table ──────────────────────────────────────────────
  const ckgTbody  = document.getElementById('ckgTbody');
  const ckgSearch = document.getElementById('ckgSearch');

  function renderCKGTable(data) {
    if (!ckgTbody) return;
    if (data.length === 0) {
      ckgTbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="5">
            <div style="text-align:center; padding: 3rem 0; color: var(--gray-400);">
              <div style="font-size:3rem; margin-bottom:1rem;">🏥</div>
              <div style="font-weight:600; font-size:1rem; color:var(--gray-600);">Belum ada pendaftaran CKG</div>
            </div>
          </td>
        </tr>`;
      return;
    }
    ckgTbody.innerHTML = data.map((c, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><div style="font-weight:600;color:var(--gray-900);">${c.nama || '—'}</div></td>
        <td>${c.nisn || '—'}</td>
        <td>${c.kelas || '—'}</td>
        <td>${c.nohp || '—'}</td>
        <td>${c.waktu || '—'}</td>
      </tr>`).join('');
  }

  renderCKGTable(ckgData);

  if (ckgSearch) {
    ckgSearch.addEventListener('input', () => {
      const q = ckgSearch.value.toLowerCase();
      renderCKGTable(ckgData.filter(c =>
        (c.nama || '').toLowerCase().includes(q) ||
        (c.nisn || '').toLowerCase().includes(q)
      ));
    });
  }

  // ── Tabs ────────────────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(target)?.classList.add('active');
    });
  });

  // ── Sidebar nav ────────────────────────────────────────────
  document.querySelectorAll('.sidebar-nav-item[data-tab-trigger]').forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.dataset.tabTrigger;
      document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
      const tabPanel = document.getElementById(tabId);
      if (tabBtn) tabBtn.classList.add('active');
      if (tabPanel) tabPanel.classList.add('active');
      // scroll top
      document.querySelector('.dashboard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // ── Helper functions ────────────────────────────────────────
  function setCount(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(val / 30));
    const t = setInterval(() => {
      current += step;
      if (current >= val) { current = val; clearInterval(t); }
      el.textContent = current;
    }, 40);
  }

  // ── View detail modal ───────────────────────────────────────
  window.viewMurid = function (id) {
    const m = muridData.find(m => m.id === id);
    if (!m) return;
    const overlay = document.getElementById('detailModalOverlay');
    const content = document.getElementById('detailContent');
    if (!overlay || !content) return;

    const fields = [
      ['Nama Lengkap', m.nama],
      ['NISN', m.nisn],
      ['Kelas', m.kelas],
      ['Tempat / Tgl Lahir', `${m.ttl_tempat || '—'}, ${m.ttl_tanggal || '—'}`],
      ['Agama', m.agama],
      ['Suku/Etnis', m.suku],
      ['Kondisi Ekonomi', m.ekonomi],
      ['Pengasuh Utama', m.pengasuh],
      ['Karakter', m.karakter],
      ['Gaya Belajar', m.gayaBelajar],
      ['Minat Belajar', m.minatBelajar],
      ['Hambatan Belajar', m.hambatanBelajar],
      ['Pendampingan Khusus', m.pendampingan],
      ['Alergi', m.alergi || '—'],
      ['Ciri Fisik Khusus', m.ciriFisik || '—'],
      ['Status ABK', m.abk],
      ['Waktu Pengisian', m.waktu],
    ];
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        ${fields.map(([label, val]) => `
          <div style="padding:0.75rem;background:var(--gray-50);border-radius:8px;">
            <div style="font-size:0.75rem;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:0.25rem;">${label}</div>
            <div style="font-size:0.9375rem;color:var(--gray-800);font-weight:500;">${val || '—'}</div>
          </div>
        `).join('')}
      </div>`;
    overlay.classList.remove('hidden');
  };

  const detailClose = document.getElementById('detailModalClose');
  const detailOverlay = document.getElementById('detailModalOverlay');
  if (detailClose) detailClose.addEventListener('click', () => detailOverlay.classList.add('hidden'));
  if (detailOverlay) detailOverlay.addEventListener('click', e => {
    if (e.target === detailOverlay) detailOverlay.classList.add('hidden');
  });

  // ── Registrasi Siswa Table ──────────────────────────────────
  const registrasiTbody = document.getElementById('registrasiTbody');
  const registrasiSearch = document.getElementById('registrasiSearch');
  const peletonFilter = document.getElementById('peletonFilter');
  
  // Load data from sapa_siswa_db
  registrasiData = JSON.parse(localStorage.getItem('sapa_siswa_db') || '[]');

  function renderRegistrasiTable(data) {
    if (!registrasiTbody) return;
    if (data.length === 0) {
      registrasiTbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="8">
            <div style="text-align:center; padding: 3rem 0; color: var(--gray-400);">
              <div style="font-size:3rem; margin-bottom:1rem;">📭</div>
              <div style="font-weight:600; font-size:1rem; color:var(--gray-600);">Belum ada data siswa</div>
            </div>
          </td>
        </tr>`;
      return;
    }

    registrasiTbody.innerHTML = data.map((s, idx) => {
      // Profile status: Complete if any of nisn, nis, ttl, wa, or foto has been filled
      const isComplete = (s.nisn && s.nisn.trim() !== '') || 
                         (s.nis && s.nis.trim() !== '') || 
                         (s.ttl && s.ttl.trim() !== '') || 
                         (s.no_wa && s.no_wa.trim() !== '') ||
                         (s.foto && s.foto.trim() !== '');

      const statusBadge = isComplete
        ? `<span class="badge badge-normal">✅ Lengkap</span>`
        : `<span class="badge badge-kurang" style="background:var(--gray-100);color:var(--gray-600);border:1px solid var(--gray-300);">⏳ Kosong</span>`;

      // Render photo preview or avatar
      let fotoCell = '';
      if (s.foto && s.foto.trim() !== '') {
        fotoCell = `<img src="${s.foto}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:1.5px solid var(--blue-500);display:block;margin:0 auto;" />`;
      } else {
        const emoji = s.gender.toUpperCase() === 'PEREMPUAN' ? '👩‍🎓' : '👨‍🎓';
        const color = s.gender.toUpperCase() === 'PEREMPUAN' ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
        fotoCell = `<div style="width:40px;height:40px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:1.25rem;margin:0 auto;">${emoji}</div>`;
      }

      const nisnNis = (s.nisn || s.nis) 
        ? `${s.nisn || '—'} / ${s.nis || '—'}`
        : `<span style="color:var(--gray-400);font-style:italic;font-size:0.85rem;">Belum Diisi</span>`;

      return `
        <tr>
          <td>${idx + 1}</td>
          <td style="text-align:center;">${fotoCell}</td>
          <td>
            <div style="font-weight:600;color:var(--gray-900);">${s.nama || '—'}</div>
            <div style="font-size:0.8rem;color:var(--gray-500);font-family:monospace;">${s.username || '—'}</div>
          </td>
          <td>${s.peleton || '—'}</td>
          <td>${nisnNis}</td>
          <td>${s.no_wa || '<span style="color:var(--gray-400);font-style:italic;font-size:0.85rem;">Belum Diisi</span>'}</td>
          <td>${statusBadge}</td>
          <td>
            <button onclick="viewRegistrasi('${s.username}')"
              style="background:var(--blue-50);border:none;color:var(--blue-700);padding:0.35rem 0.75rem;border-radius:6px;cursor:pointer;font-size:0.8rem;font-weight:600;">
              👁 Detail
            </button>
          </td>
        </tr>`;
    }).join('');
  }

  // Populate peleton filter dropdown dynamically with natural numerical sorting (Peleton 1 to 11)
  function populatePeletonFilter(data) {
    if (!peletonFilter) return;
    const currentVal = peletonFilter.value;
    const uniquePeletons = [...new Set(data.map(s => s.peleton).filter(Boolean))].sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    peletonFilter.innerHTML = '<option value="">✨ Semua Peleton</option>' + 
      uniquePeletons.map(p => `<option value="${p}">${p}</option>`).join('');
    if (uniquePeletons.includes(currentVal)) {
      peletonFilter.value = currentVal;
    }
  }

  // Filter both search query and peleton dropdown selection
  function filterRegistrasiData() {
    const q = (registrasiSearch ? registrasiSearch.value : '').toLowerCase();
    const peletonVal = peletonFilter ? peletonFilter.value : '';
    const filtered = registrasiData.filter(s => {
      const matchQuery = (s.nama || '').toLowerCase().includes(q) ||
                         (s.username || '').toLowerCase().includes(q);
      const matchPeleton = peletonVal === '' || s.peleton === peletonVal;
      return matchQuery && matchPeleton;
    });
    renderRegistrasiTable(filtered);
  }

  // Initial render & dropdown population
  populatePeletonFilter(registrasiData);
  renderRegistrasiTable(registrasiData);

  // Filter event listeners
  if (registrasiSearch) {
    registrasiSearch.addEventListener('input', filterRegistrasiData);
  }
  if (peletonFilter) {
    peletonFilter.addEventListener('change', filterRegistrasiData);
  }

  // View detail modal
  window.viewRegistrasi = function (username) {
    const db = JSON.parse(localStorage.getItem('sapa_siswa_db') || '[]');
    const s = db.find(s => s.username === username);
    if (!s) return;

    const overlay = document.getElementById('detailModalOverlay');
    const content = document.getElementById('detailContent');
    if (!overlay || !content) return;

    let fotoHtml = '';
    if (s.foto && s.foto.trim() !== '') {
      fotoHtml = `<img src="${s.foto}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid var(--blue-500);box-shadow:0 8px 20px rgba(0,0,0,0.15);" />`;
    } else {
      if (s.gender.toUpperCase() === 'PEREMPUAN') {
        fotoHtml = `
          <div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg, #ec4899, #be185d);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,0.15);">
            <span style="font-size:3.5rem;">👩‍🎓</span>
          </div>`;
      } else {
        fotoHtml = `
          <div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg, #3b82f6, #1d4ed8);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,0.15);">
            <span style="font-size:3.5rem;">👨‍🎓</span>
          </div>`;
      }
    }

    const fields = [
      ['Nama Lengkap', s.nama],
      ['Username / Login', s.username],
      ['Peleton / Gugus', s.peleton],
      ['Tempat, Tanggal Lahir', s.ttl || '<span style="color:var(--red-500);font-style:italic;">Belum diisi oleh siswa</span>'],
      ['Asal Sekolah', s.asal_sekolah],
      ['NISN', s.nisn || '<span style="color:var(--red-500);font-style:italic;">Belum diisi oleh siswa</span>'],
      ['NIS', s.nis || '<span style="color:var(--red-500);font-style:italic;">Belum diisi oleh siswa</span>'],
      ['Jenis Kelamin', s.gender],
      ['No. WhatsApp', s.no_wa || '<span style="color:var(--red-500);font-style:italic;">Belum diisi oleh siswa</span>'],
    ];

    content.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:1.5rem;margin-bottom:1.5rem;padding:1rem;background:var(--gray-50);border-radius:12px;">
        ${fotoHtml}
        <div style="text-align:center;">
          <div style="font-size:1.25rem;font-weight:700;color:var(--gray-900);">${s.nama}</div>
          <div style="font-size:0.875rem;color:var(--gray-500);font-weight:600;margin-top:0.25rem;">${s.peleton}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        ${fields.map(([label, val]) => `
          <div style="padding:0.75rem;background:var(--gray-50);border-radius:8px;">
            <div style="font-size:0.75rem;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:0.25rem;">${label}</div>
            <div style="font-size:0.9375rem;color:var(--gray-800);font-weight:500;">${val}</div>
          </div>
        `).join('')}
      </div>`;
    overlay.classList.remove('hidden');
  };

  // Export CSV logic
  window.exportRegistrasiCSV = function () {
    const db = JSON.parse(localStorage.getItem('sapa_siswa_db') || '[]');
    const headers = ['No','Nama','Username','Peleton','Asal Sekolah','NISN','NIS','TTL','No WA','Gender'];
    const rows = db.map((s, i) => [
      i+1, s.nama||'', s.username||'', s.peleton||'', s.asal_sekolah||'', s.nisn||'', s.nis||'', s.ttl||'', s.no_wa||'', s.gender||''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'database-siswa-mpls.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Mobile sidebar toggle & Overlay ─────────────────────────
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('visible');
    });
  }
  if (sidebarOverlay && sidebar) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('visible');
    });
  }

  // ── Export CSV ──────────────────────────────────────────────
  window.exportCSV = function () {
    const headers = ['No','Nama','NISN','Kelas','Karakter','ABK','Pendampingan','Waktu'];
    const rows = muridData.map((m, i) => [
      i+1, m.nama||'', m.nisn||'', m.kelas||'', m.karakter||'', m.abk||'', m.pendampingan||'', m.waktu||''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'data-murid-sapa.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Demo Data Seeds ─────────────────────────────────────────
  function getDemoMurid() {
    return [
      { id:1, nama:'Aisyah Putri Ramadhani', nisn:'1234567890', kelas:'X-IPA 1', karakter:'Mudah Bergaul', agama:'Islam', suku:'Jawa', ekonomi:'Menengah', pengasuh:'Orang Tua Kandung', gayaBelajar:'Visual', minatBelajar:'Matematika & Sains', hambatanBelajar:'Mudah distraksi', pendampingan:'Tidak', alergi:'Tidak ada', ciriFisik:'—', abk:'non-abk', waktu:'01/07/2026, 08:00', ttl_tempat:'Bekasi', ttl_tanggal:'2010-03-15' },
      { id:2, nama:'Budi Santoso', nisn:'1234567891', kelas:'X-IPA 2', karakter:'Cenderung Pendiam', agama:'Islam', suku:'Sunda', ekonomi:'Rendah', pengasuh:'Nenek/Kakek', gayaBelajar:'Kinestetik', minatBelajar:'Olahraga', hambatanBelajar:'Susah fokus lama', pendampingan:'Ya', alergi:'Debu', ciriFisik:'Kacamata', abk:'non-abk', waktu:'01/07/2026, 08:15', ttl_tempat:'Karawang', ttl_tanggal:'2010-06-22' },
      { id:3, nama:'Citra Dewi Lestari', nisn:'1234567892', kelas:'X-IPS 1', karakter:'Suka Menolong', agama:'Kristen', suku:'Batak', ekonomi:'Menengah Atas', pengasuh:'Orang Tua Kandung', gayaBelajar:'Auditori', minatBelajar:'Seni & Musik', hambatanBelajar:'Tidak ada', pendampingan:'Tidak', alergi:'Tidak ada', ciriFisik:'—', abk:'non-abk', waktu:'01/07/2026, 08:30', ttl_tempat:'Jakarta', ttl_tanggal:'2010-09-05' },
      { id:4, nama:'Dimas Arya Pratama', nisn:'1234567893', kelas:'X-IPS 2', karakter:'Mudah Bergaul', agama:'Islam', suku:'Betawi', ekonomi:'Menengah', pengasuh:'Orang Tua Kandung', gayaBelajar:'Visual', minatBelajar:'Teknologi & Komputer', hambatanBelajar:'Nilai matematika kurang', pendampingan:'Ya', alergi:'Seafood', ciriFisik:'—', abk:'tunggal', waktu:'01/07/2026, 09:00', ttl_tempat:'Bekasi', ttl_tanggal:'2010-11-18' },
      { id:5, nama:'Elsa Maharani', nisn:'1234567894', kelas:'X-IPA 1', karakter:'Campuran', agama:'Islam', suku:'Minang', ekonomi:'Tinggi', pengasuh:'Orang Tua Kandung', gayaBelajar:'Membaca/Menulis', minatBelajar:'Bahasa & Sastra', hambatanBelajar:'Tidak ada', pendampingan:'Tidak', alergi:'Tidak ada', ciriFisik:'—', abk:'non-abk', waktu:'01/07/2026, 09:15', ttl_tempat:'Padang', ttl_tanggal:'2010-01-28' },
    ];
  }

  function getDemoCKG() {
    return [
      { nama:'Aisyah Putri Ramadhani', nisn:'1234567890', kelas:'X-IPA 1', nohp:'081234567890', waktu:'01/07/2026, 08:05' },
      { nama:'Citra Dewi Lestari',      nisn:'1234567892', kelas:'X-IPS 1', nohp:'081234567892', waktu:'01/07/2026, 08:35' },
      { nama:'Elsa Maharani',           nisn:'1234567894', kelas:'X-IPA 1', nohp:'081234567894', waktu:'01/07/2026, 09:20' },
    ];
  }

});
