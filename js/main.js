// ============================================================
// SAPA Smansabel – Main JavaScript
// IMT Calculator | CKG Modal | Multi-step Form Wizard
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  // ── Dynamic Navbar Login/Dashboard link ────────────────────
  const studentSession = sessionStorage.getItem("sapa_siswa_session");
  if (studentSession) {
    document.querySelectorAll('a[href="login_siswa.html"]').forEach(link => {
      link.href = 'dashboard_siswa.html';
      link.innerHTML = '👤 Dasbor Siswa';
    });
  }
  const adminSession = sessionStorage.getItem("sapa_admin_session");
  if (adminSession) {
    document.querySelectorAll('a[href="admin.html"]').forEach(link => {
      link.href = 'dashboard.html';
      link.innerHTML = '⚙️ Dasbor Admin';
    });
  }

  // ── Smooth Scroll for anchor links ────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = document.querySelector('.navbar')?.offsetHeight || 0;
        const modH = document.querySelector('.modul-nav')?.offsetHeight || 0;
        const offset = navH + modH + 16;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });

  // ── IMT Calculator ────────────────────────────────────────
  const imtForm   = document.getElementById('imtForm');
  const imtResult = document.getElementById('imtResult');
  const imtLoading= document.getElementById('imtLoading');

  if (imtForm) {
    imtForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const berat  = parseFloat(document.getElementById('imtBerat').value);
      const tinggi = parseFloat(document.getElementById('imtTinggi').value);
      const beratEl  = document.getElementById('imtBerat');
      const tinggiEl = document.getElementById('imtTinggi');
      let valid = true;

      clearFieldError(beratEl);
      clearFieldError(tinggiEl);

      if (!berat || berat <= 0 || berat > 300) {
        showFieldError(beratEl, 'Masukkan berat badan yang valid (1–300 kg)');
        valid = false;
      }
      if (!tinggi || tinggi <= 0 || tinggi > 250) {
        showFieldError(tinggiEl, 'Masukkan tinggi badan yang valid (1–250 cm)');
        valid = false;
      }
      if (!valid) return;

      // Hide result, show loading
      imtResult.classList.add('hidden');
      imtLoading.classList.remove('hidden');

      setTimeout(() => {
        imtLoading.classList.add('hidden');
        const tinggiM = tinggi / 100;
        const imt     = berat / (tinggiM * tinggiM);
        renderIMTResult(imt, berat, tinggi);
        imtResult.classList.remove('hidden');
        imtResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 1500);
    });
  }

  function renderIMTResult(imt, berat, tinggi) {
    const { label, cls, msg, emoji } = getIMTCategory(imt);
    document.getElementById('imtNumber').textContent   = imt.toFixed(2);
    document.getElementById('imtBadge').textContent    = emoji + ' ' + label;
    document.getElementById('imtBadge').className      = 'badge badge-' + cls;
    document.getElementById('imtMessage').innerHTML    = msg;

    // Scale highlight
    document.querySelectorAll('.imt-scale-seg').forEach(s => s.classList.remove('active'));
    const activeSeg = document.querySelector('.imt-scale-seg.' + cls);
    if (activeSeg) activeSeg.classList.add('active');
  }

  function getIMTCategory(imt) {
    if (imt < 17.0) return {
      label: 'Sangat Kurang', cls: 'kurang', emoji: '⚠️',
      msg: `<strong>Hasil IMT Anda: ${imt.toFixed(2)}</strong><br>Kategori: <strong>Sangat Kurang (< 17.0)</strong>. Kondisi ini perlu perhatian segera. Disarankan berkonsultasi dengan dokter atau ahli gizi. <strong>🗒️ Catat hasil ini</strong> untuk dibawa saat sesi Cek Kesehatan Gratis (CKG)!`
    };
    if (imt < 18.5) return {
      label: 'Kurang', cls: 'kurang', emoji: '🔵',
      msg: `<strong>Hasil IMT Anda: ${imt.toFixed(2)}</strong><br>Kategori: <strong>Kurang (17.0–18.4)</strong>. Kamu disarankan meningkatkan asupan nutrisi yang bergizi dan seimbang. <strong>🗒️ Catat hasil ini</strong> untuk keperluan Cek Kesehatan Gratis (CKG)!`
    };
    if (imt < 25.0) return {
      label: 'Normal', cls: 'normal', emoji: '✅',
      msg: `<strong>Hasil IMT Anda: ${imt.toFixed(2)}</strong><br>Kategori: <strong>Normal (18.5–24.9)</strong>. Selamat! Berat badanmu ideal. Pertahankan pola hidup sehat dan olahraga rutin. <strong>🗒️ Catat hasil ini</strong> untuk keperluan Cek Kesehatan Gratis (CKG)!`
    };
    if (imt < 27.0) return {
      label: 'Berlebih', cls: 'lebih', emoji: '🟡',
      msg: `<strong>Hasil IMT Anda: ${imt.toFixed(2)}</strong><br>Kategori: <strong>Berlebih/Gemuk (25.0–26.9)</strong>. Disarankan meningkatkan aktivitas fisik dan memperbaiki pola makan. <strong>🗒️ Catat hasil ini</strong> untuk keperluan Cek Kesehatan Gratis (CKG)!`
    };
    return {
      label: 'Obesitas', cls: 'obesitas', emoji: '🔴',
      msg: `<strong>Hasil IMT Anda: ${imt.toFixed(2)}</strong><br>Kategori: <strong>Obesitas (≥ 27.0)</strong>. Kondisi ini perlu penanganan khusus. Segera konsultasikan ke dokter. <strong>🗒️ Catat hasil ini</strong> dan ikuti program Cek Kesehatan Gratis (CKG)!`
    };
  }

  // ── CKG QUIZ (SKRINING KESEHATAN MENDALAM) ───────────────
  const ckgQuizForm = document.getElementById('ckgQuizForm');
  const ckgLoading = document.getElementById('ckgLoading');
  const ckgResultArea = document.getElementById('ckgResultArea');
  const ckgResultIcon = document.getElementById('ckgResultIcon');
  const ckgResultTitle = document.getElementById('ckgResultTitle');
  const ckgSegmentList = document.getElementById('ckgSegmentList');
  const aiPromptBox = document.getElementById('aiPromptBox');

  if (ckgQuizForm) {
    ckgQuizForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const nama = document.getElementById('ckgNama').value.trim();
      const kelas = document.getElementById('ckgKelas').value;
      if (!nama || !kelas) {
        alert('Harap isi Nama dan Kelas terlebih dahulu.');
        return;
      }

      // Validasi radio buttons
      const radioGroups = ['q1', 'q2', 'q3', 'q4', 'q5'];
      let allAnswered = true;

      const radioNames = ['mata1', 'telinga1', 'napas1', 'jantung1', 'perut1', 'makan1', 'mental1', 'mental2'];
      let answers = {};

      radioNames.forEach(name => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        if (!checked) {
          allAnswered = false;
        } else {
          answers[name] = checked.value;
        }
      });

      if (!allAnswered) {
        alert('Harap jawab semua pertanyaan di setiap segmen.');
        return;
      }

      // API Key is handled securely on the server-side via api.php
      const apiKey = '';

      ckgQuizForm.classList.add('hidden');
      ckgLoading.classList.remove('hidden');

      setTimeout(() => {
        ckgLoading.classList.add('hidden');
        ckgResultArea.classList.remove('hidden');

        // Analisis per Segmen
        let segmentResults = [];
        let issueCount = 0;

        // Segmen 1
        let seg1Issues = (answers.mata1.includes('Ya') ? 1 : 0) + (answers.telinga1.includes('Ya') ? 1 : 0);
        if (seg1Issues > 0) {
          segmentResults.push(`<div class="seg-result-item warn"><div class="seg-badge warn">👁️</div><div class="seg-result-text"><strong>Indera:</strong> Ditemukan potensi masalah penglihatan/pendengaran. Disarankan periksa ke optik/THT.</div></div>`);
          issueCount += seg1Issues;
        } else {
          segmentResults.push(`<div class="seg-result-item ok"><div class="seg-badge ok">✅</div><div class="seg-result-text"><strong>Indera:</strong> Fungsi mata dan telinga dalam kondisi baik.</div></div>`);
        }

        // Segmen 2
        let seg2Issues = (answers.napas1.includes('Ya') ? 1 : 0) + (answers.jantung1.includes('Ya') ? 1 : 0);
        if (seg2Issues > 0) {
          segmentResults.push(`<div class="seg-result-item warn"><div class="seg-badge warn">🫁</div><div class="seg-result-text"><strong>Pernapasan & Jantung:</strong> Gejala sesak/jantung berdebar terdeteksi. Kurangi aktivitas fisik berat dan segera konsul ke dokter.</div></div>`);
          issueCount += seg2Issues;
        } else {
          segmentResults.push(`<div class="seg-result-item ok"><div class="seg-badge ok">✅</div><div class="seg-result-text"><strong>Pernapasan & Jantung:</strong> Kapasitas pernapasan dan jantung stabil.</div></div>`);
        }

        // Segmen 3
        let seg3Issues = (answers.perut1.includes('Ya') ? 1 : 0) + (answers.makan1.includes('Ya') ? 1 : 0);
        if (seg3Issues > 0) {
          segmentResults.push(`<div class="seg-result-item warn"><div class="seg-badge warn">🍽️</div><div class="seg-result-text"><strong>Pencernaan:</strong> Pola makan kurang baik atau ada indikasi asam lambung. Wajib perbaiki jam makan dan sarapan!</div></div>`);
          issueCount += seg3Issues;
        } else {
          segmentResults.push(`<div class="seg-result-item ok"><div class="seg-badge ok">✅</div><div class="seg-result-text"><strong>Pencernaan:</strong> Pola makan dan lambung sehat.</div></div>`);
        }

        // Segmen 4
        let seg4Issues = (answers.mental1.includes('Ya') ? 1 : 0) + (answers.mental2.includes('Ya') ? 1 : 0);
        if (seg4Issues > 0) {
          segmentResults.push(`<div class="seg-result-item warn"><div class="seg-badge warn">🧠</div><div class="seg-result-text"><strong>Mental & Fisik:</strong> Tingkat kelelahan atau kecemasan cukup tinggi. Luangkan waktu untuk relaksasi dan curhat jika perlu.</div></div>`);
          issueCount += seg4Issues;
        } else {
          segmentResults.push(`<div class="seg-result-item ok"><div class="seg-badge ok">✅</div><div class="seg-result-text"><strong>Mental & Fisik:</strong> Kondisi psikologis dan energi fisik optimal.</div></div>`);
        }

        ckgSegmentList.innerHTML = segmentResults.join('');

        // Update result status card gradient
        const statusCard = document.getElementById('resultStatusCard');
        if (statusCard) {
          if (issueCount === 0) {
            statusCard.style.background = 'linear-gradient(135deg, #059669, #10b981)';
          } else if (issueCount <= 2) {
            statusCard.style.background = 'linear-gradient(135deg, #d97706, #f59e0b)';
          } else {
            statusCard.style.background = 'linear-gradient(135deg, #dc2626, #ef4444)';
          }
        }

        // Tentukan Status Utama
        let status = '';
        if (issueCount === 0) {
          status = 'Sehat';
          ckgResultIcon.textContent = '🏅';
          ckgResultTitle.textContent = 'Kondisi Prima Maksimal';
          ckgResultTitle.style.color = 'var(--green-600)';
        } else if (issueCount <= 2) {
          status = 'Perhatian Ringan';
          ckgResultIcon.textContent = '⚖️';
          ckgResultTitle.textContent = 'Perlu Perhatian Ringan';
          ckgResultTitle.style.color = 'var(--orange-500)';
        } else {
          status = 'Konsultasi UKS';
          ckgResultIcon.textContent = '🚨';
          ckgResultTitle.textContent = 'Butuh Evaluasi Medis';
          ckgResultTitle.style.color = 'var(--red-600)';
        }

        // Generate AI Prompt for API
        const promptText = `Halo AI, tolong analisis laporan skrining kesehatan siswa bernama ${nama} (Kelas ${kelas}) ini secara singkat:
- Masalah Indera: ${seg1Issues > 0 ? 'Ada keluhan penglihatan/pendengaran.' : 'Normal.'}
- Pernapasan & Jantung: ${seg2Issues > 0 ? 'Ada keluhan sesak/debar jantung.' : 'Normal.'}
- Pencernaan: ${seg3Issues > 0 ? 'Ada masalah lambung/sering telat sarapan.' : 'Normal.'}
- Mental & Fisik Umum: ${seg4Issues > 0 ? 'Mengalami kelelahan/kecemasan.' : 'Normal.'}
Berikan saran medis ringan dan panduan gaya hidup sehat apa yang cocok untuk siswa SMA dengan profil gejala di atas? Tolong jelaskan dengan gaya ramah, hangat ala tenaga kesehatan sekolah, batasi maksimal 3 paragraf.`;
        
        // Panggil API Gemini Langsung
        const aiLoading = document.getElementById('aiLoading');
        const aiResultText = document.getElementById('aiResultText');
        
        if (aiLoading && aiResultText) {
          aiLoading.style.display = 'flex';
          aiResultText.style.display = 'none';

          // Proxy request via api.php to protect the API key from public exposure
          fetch('api.php?action=gemini_proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'gemini_proxy',
              prompt: promptText
            })
          })
          .then(res => res.json())
          .then(data => {
            aiLoading.style.display = 'none';
            aiResultText.style.display = 'block';
            
            if (data.error) {
              console.error('Gemini API Error:', data.error);
              if (data.error.message.includes('invalid authentication') || data.error.message.includes('expired')) {
                aiResultText.innerHTML = `⚠️ <strong>Kunci API Ditolak:</strong> Kunci yang Anda masukkan sudah kedaluwarsa atau tidak valid. Silakan buat API Key baru (pastikan diawali huruf 'AIzaSy') di Google AI Studio.`;
              } else {
                aiResultText.innerHTML = `⚠️ <strong>Gagal memuat AI:</strong> ${data.error.message}`;
              }
            } else if (data.candidates && data.candidates[0] && data.candidates[0].content) {
              const aiText = data.candidates[0].content.parts[0].text;
              // Simple markdown parser to html
              let formattedText = aiText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
              // Convert newlines to <br>
              formattedText = formattedText.replace(/\n/g, '<br>');
              aiResultText.innerHTML = formattedText;
            } else {
              console.log('Unexpected Response:', data);
              aiResultText.innerHTML = 'Maaf, AI memberikan respons yang tidak sesuai format. Silakan periksa console browser.';
            }
          })
          .catch(err => {
            aiLoading.style.display = 'none';
            aiResultText.style.display = 'block';
            aiResultText.innerHTML = 'Gagal terhubung ke AI Gemini. Periksa koneksi internet Anda.';
            console.error('Fetch error:', err);
          });
        }

        // Simpan ke localStorage
        const data = {
          id: Date.now().toString(),
          nama: nama,

          kelas: kelas,
          status: status,
          waktu: new Date().toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})
        };
        let ckgList = JSON.parse(localStorage.getItem('sapa_ckg') || '[]');
        ckgList.push(data);
        localStorage.setItem('sapa_ckg', JSON.stringify(ckgList));

        // Sync CKG to Hostinger MySQL Database
        const activeSess = JSON.parse(sessionStorage.getItem("sapa_siswa_session") || "null");
        fetch('api.php?action=save_ckg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_ckg',
            data: {
              nama: data.nama,
              nisn: activeSess ? (activeSess.nisn || '') : '',
              kelas: data.kelas,
              nohp: activeSess ? (activeSess.no_wa || '') : '',
              waktu: data.waktu
            }
          })
        }).then(r => r.json())
          .then(json => console.log("MySQL CKG Sync: ", json.message))
          .catch(err => console.error("MySQL CKG Sync failed: ", err));

      }, 1500);
    });
  }


  // ── Multi-Step Wizard ─────────────────────────────────────
  let currentStep = 0;
  const totalSteps = 6;
  const wizardData = {};

  const stepEls = document.querySelectorAll('.wizard-step');
  const panelEls= document.querySelectorAll('.wizard-panel');
  const prevBtn  = document.getElementById('wizardPrev');
  const nextBtn  = document.getElementById('wizardNext');
  const submitBtn= document.getElementById('wizardSubmit');
  const wizardBody = document.getElementById('wizardForm');
  const wizardSuccess = document.getElementById('wizardSuccess');

  // Custom radio/checkbox
  document.querySelectorAll('.radio-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const name = opt.querySelector('input')?.name;
      if (name) {
        document.querySelectorAll(`.radio-option input[name="${name}"]`).forEach(i => {
          i.closest('.radio-option').classList.remove('selected');
        });
      }
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
    });
  });

  document.querySelectorAll('.checkbox-option').forEach(opt => {
    opt.addEventListener('click', () => {
      opt.classList.toggle('selected');
      const inp = opt.querySelector('input');
      inp.checked = !inp.checked;
    });
  });

  function updateWizardUI() {
    panelEls.forEach((p, i) => p.classList.toggle('active', i === currentStep));
    stepEls.forEach((s, i) => {
      s.classList.toggle('active', i === currentStep);
      s.classList.toggle('done', i < currentStep);
    });
    if (prevBtn) prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-flex';
    if (nextBtn) nextBtn.style.display = currentStep < totalSteps - 1 ? 'inline-flex' : 'none';
    if (submitBtn) submitBtn.style.display = currentStep === totalSteps - 1 ? 'inline-flex' : 'none';
    const info = document.getElementById('wizardStepInfo');
    if (info) info.textContent = `Langkah ${currentStep + 1} dari ${totalSteps}`;
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateCurrentStep()) {
        currentStep++;
        updateWizardUI();
        document.getElementById('deteksidini')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentStep--;
      updateWizardUI();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (!validateCurrentStep()) return;
      collectAllData();
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:3px;"></span> Menyimpan...';

      setTimeout(() => {
        const existing = JSON.parse(localStorage.getItem('sapa_murid') || '[]');
        wizardData.id = Date.now();
        wizardData.waktu = new Date().toLocaleString('id-ID');
        existing.push(wizardData);
        localStorage.setItem('sapa_murid', JSON.stringify(existing));

        // Sync Deteksi Dini to Hostinger MySQL Database
        fetch('api.php?action=save_deteksi_dini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_deteksi_dini',
            data: {
              nama: wizardData.nama || '',
              nisn: wizardData.nisn || '',
              kelas: wizardData.kelas || '',
              karakter: wizardData.karakter || '',
              agama: wizardData.agama || '',
              suku: wizardData.suku || '',
              ekonomi: wizardData.ekonomi || '',
              pengasuh: wizardData.pengasuh || '',
              gayaBelajar: wizardData.gayaBelajar || '',
              minatBelajar: wizardData.minatBelajar || '',
              hambatanBelajar: wizardData.hambatanBelajar || '',
              pendampingan: wizardData.pendampingan || '',
              alergi: wizardData.alergi || '',
              ciriFisik: wizardData.ciriFisik || '',
              abk: wizardData.abk || '',
              waktu: wizardData.waktu,
              ttl_tempat: wizardData.ttl_tempat || '',
              ttl_tanggal: wizardData.ttl_tanggal || ''
            }
          })
        }).then(r => r.json())
          .then(json => console.log("MySQL Deteksi Dini Sync: ", json.message))
          .catch(err => console.error("MySQL Deteksi Dini Sync failed: ", err));

        wizardBody.classList.add('hidden');
        wizardSuccess.classList.remove('hidden');
        wizardSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 2000);
    });
  }

  function validateCurrentStep() {
    const panel = panelEls[currentStep];
    if (!panel) return true;
    let ok = true;

    // Required text/select/textarea inputs
    panel.querySelectorAll('[required]').forEach(el => {
      clearFieldError(el);
      if (el.tagName === 'SELECT' && !el.value) {
        showFieldError(el, 'Kolom ini wajib dipilih'); ok = false;
      } else if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && !el.value.trim()) {
        showFieldError(el, 'Kolom ini wajib diisi'); ok = false;
      }
    });

    // Required radio groups
    panel.querySelectorAll('[data-required-radio]').forEach(group => {
      const name = group.dataset.requiredRadio;
      const checked = panel.querySelector(`input[name="${name}"]:checked`);
      const errEl = group.querySelector('.form-error');
      if (!checked) {
        if (errEl) errEl.textContent = '⚠ Pilih salah satu opsi';
        ok = false;
      } else {
        if (errEl) errEl.textContent = '';
      }
    });

    return ok;
  }

  function collectAllData() {
    document.querySelectorAll('.wizard-panel input, .wizard-panel select, .wizard-panel textarea').forEach(el => {
      if (el.type === 'checkbox') {
        if (!wizardData[el.name]) wizardData[el.name] = [];
        if (el.checked) wizardData[el.name].push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) wizardData[el.name] = el.value;
      } else {
        if (el.name) wizardData[el.name] = el.value;
      }
    });
  }

  updateWizardUI();

  // ── Helpers ───────────────────────────────────────────────
  function showFieldError(el, msg) {
    el.classList.add('error');
    let errEl = el.parentNode.querySelector('.form-error');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'form-error';
      el.parentNode.appendChild(errEl);
    }
    errEl.textContent = '⚠ ' + msg;
  }
  function clearFieldError(el) {
    el.classList.remove('error');
    const errEl = el.parentNode.querySelector('.form-error');
    if (errEl) errEl.textContent = '';
  }
  function openModal(overlay) {
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(overlay) {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ── Counter Animation ──────────────────────────────────────
  function animateCounter(el, target) {
    let current = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current;
    }, 40);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const val = parseInt(e.target.dataset.count);
        if (val) animateCounter(e.target, val);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));

});
