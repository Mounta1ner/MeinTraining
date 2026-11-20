/* Mein Training / Bond v3.0 - Modul 5: Admin-Studio, Gelenk-Editor (Touch/Mouse Fix), Morphing, Unilateral & Plan-Export */
(function () {
  'use strict';

  const ADMIN_STORAGE_KEY = 'mt_admin_catalog_overrides_v1';
  S.lrLog = S.lrLog || {};
  S.ui = S.ui || {};
  S.ui.settingsOpen = S.ui.settingsOpen || {};

  // Standard-Stehpose im 48x48 Koordinatensystem
  const STD_STANDING_FIG = '24,7,24,13,24,27,24,36,24,44,24,20,24,27';
  const STD_END_FIG = '26,15,23,21,15,32,28,33,25,44,29,20,34,20';

  const DEFAULT_UNILATERAL_IDS = new Set([
    'e1', 'e6', 'e9', 'e16', 'e17', 'e19', 'e20', 'e21', 'e22', 'e23',
    'e26', 'e27', 'e28', 'e35', 'e36', 'e40', 'e41', 'e46', 'e47',
    'e49', 'e50', 'e51', 'e52', 'e53', 'e54', 'e56', 'e57', 'e61',
    'e62', 'e75', 'e76', 'e80', 'e82', 'e86', 'e89', 'e101'
  ]);

  const REGION_KEYWORDS = {
    'Nacken': 'Nacken',
    'Schulter': 'Schulter',
    'Arm/Hand': 'Arm, Handgelenk',
    'Rücken': 'Rücken, Wirbelsäule',
    'Rumpf/Bauch': 'Rumpf, Bauch',
    'Hüfte/Gesäß': 'Hüfte, Gesäß',
    'Knie/Oberschenkel': 'Knie, Oberschenkel',
    'Wade/Fuß': 'Wade, Fuß, Sprunggelenk',
    'Ganzkörper': 'Ganzkörper'
  };

  const PROP_PRESETS = {
    none: { label: 'Kein Hilfsmittel-Pfad', path: '' },
    wallLeft: { label: '🧱 Wand links', path: 'M12 0L12 44' },
    wallRight: { label: '🧱 Wand rechts', path: 'M40 0L40 44' },
    chair: { label: '🪑 Stuhl', path: 'M10 31L28 31M12 31L12 44M26 31L26 44' },
    box: { label: '📦 Box / Stufe rechts', path: 'M28 36L42 36L42 44L28 44Z' },
    wedge: { label: '📐 Fersenkeil', path: 'M20 44L25 41L25 44Z' },
    cushion: { label: '🛋️ Balance-Kissen', path: 'M14 44L34 44L34 41L14 41Z' }
  };

  // --- 1. LOKALE ADMIN-OVERRIDES LADEN & ANWENDEN ---
  function loadAdminOverrides() {
    try {
      const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      list.forEach(item => {
        if (!item || !item.id) return;
        const idx = EX.findIndex(x => x.id === item.id);
        if (idx >= 0) EX[idx] = Object.assign({}, EX[idx], item);
        else EX.push(item);
      });
    } catch (e) {
      console.warn('Admin overrides load error:', e);
    }
  }

  function saveExerciseToAdminStore(exObj) {
    try {
      const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const validList = Array.isArray(list) ? list : [];
      const idx = validList.findIndex(x => x.id === exObj.id);
      if (idx >= 0) validList[idx] = exObj;
      else validList.push(exObj);
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(validList));
    } catch (e) {
      console.warn('Admin overrides save error:', e);
    }
  }

  loadAdminOverrides();

  function getExecMode(e) {
    if (!e) return 'reps';
    if (e.execMode && ['reps', 'hold', 'sequence'].includes(e.execMode)) return e.execMode;
    if (Array.isArray(e.phases) && e.phases.length > 1) return 'sequence';
    if (isT(e) || isM(e)) return 'hold';
    return 'reps';
  }

  window.v3IsUnilateral = function (e) {
    if (!e) return false;
    if (typeof e.unilateral === 'boolean') return e.unilateral;
    return DEFAULT_UNILATERAL_IDS.has(e.id);
  };

  window.v3Unit = function (e) {
    if (!e) return 'Wdh.';
    if (isM(e)) return 'Min.';
    if (e.execMode === 'hold' || e.execMode === 'sequence') return 'Sek.';
    if (e.execMode === 'reps') return 'Wdh.';
    return unit(e);
  };

  // --- 2. HASHTAGS IN SUCHE (v281Search) & MULTI-YOUTUBE (ytHtml) ---
  const _origV281Search = (e, term) =>
    typeof window.v281SearchPositive === 'function'
      ? window.v281SearchPositive(e, term)
      : false;
  v281Search = function (e, text) {
    const tagStr = Array.isArray(e?.tags) ? e.tags.join(' ') : '';
    const modeStr = getExecMode(e) === 'sequence' ? 'abfolge phasen' : getExecMode(e) === 'hold' ? 'halten statisch' : 'wiederholungen';
    const uniStr = window.v3IsUnilateral(e) ? 'unilateral einseitig links rechts' : '';
    const qNorm = v281Normalize(text).trim();
    if (!qNorm) return true;
    const extraHay = v281Normalize([tagStr, modeStr, uniStr].join(' '));
    const terms = qNorm.split(/\s+/);
    return terms.every(t => _origV281Search(e, t) || extraHay.includes(t) || extraHay.includes(t.replace(/^#/, '')));
  };

  window.v3FilterByTag = function (tag) {
    eq = tag;
    if (tab !== 'lib') go('lib');
    else render();
  };

  function extractYoutubeId(input) {
    const s = String(input || '').trim();
    if (!s) return '';
    const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,15})/);
    return m ? m[1] : s;
  }

  function getYoutubeList(e) {
    if (!e) return [];
    const list = [];
    if (Array.isArray(e.ytList)) {
      e.ytList.forEach(item => {
        if (item && item.id) list.push({ id: extractYoutubeId(item.id), t: item.t || e.n + ' – Video' });
      });
    }
    if (e.yt && e.yt.id && !list.some(x => x.id === e.yt.id)) {
      list.unshift({ id: extractYoutubeId(e.yt.id), t: e.yt.t || e.n + ' – Video' });
    }
    return list;
  }

  ytHtml = function (e) {
    const list = getYoutubeList(e);
    if (!list.length) return '';
    return list.map((v, idx) => {
      const domId = `yt_${e.id}_${idx}`;
      return `<div style="margin:8px 0">
        <a target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${esc(v.id)}">▶ Video ${list.length > 1 ? (idx + 1) + ': ' : ''}${esc(v.t)}</a>
        <button type="button" class="chip" style="padding:4px 10px;font-size:12px" onclick="v3YtPlay('${esc(v.id)}','${domId}')">Hier abspielen</button>
        <div id="${domId}"></div>
      </div>`;
    }).join('');
  };

  window.v3YtPlay = function (videoId, domId) {
    const d = document.getElementById(domId);
    if (!d) return;
    d.innerHTML = `<div style="position:relative;padding-top:56.25%;margin-top:8px"><iframe src="https://www.youtube-nocookie.com/embed/${esc(videoId)}" title="Video" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:12px" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div><p class="mu" style="font-size:12px">Startet das Video nicht, öffne es über den Link.</p>`;
  };

  // --- 3. MORPHING-ANIMATION & VEKTOR-PARSER ---
  function isCorruptedCornerCoords(coords) {
    if (!Array.isArray(coords) || coords.length < 14) return true;
    let cornerCount = 0;
    for (let i = 0; i < 14; i += 2) {
      if ((coords[i] >= 46 && coords[i + 1] >= 45) || (coords[i] <= 1 && coords[i + 1] <= 1)) {
        cornerCount++;
      }
    }
    return cornerCount >= 4;
  }

  function parseFigString(str) {
    const defaultCoords = [24, 7, 24, 13, 24, 27, 24, 36, 24, 44, 24, 20, 24, 27];
    if (!str || typeof str !== 'string' || str.startsWith('BR') || str.startsWith('MD_')) {
      return {
        coords: defaultCoords.slice(),
        hasArm2: false,
        arm2: [20, 20, 19, 27],
        hasLeg2: false,
        leg2: [21, 36, 21, 44],
        props: [],
        dumbbell: false
      };
    }
    const parts = str.split(';');
    const rawNums = (parts[0] || '').split(',').map(Number);
    let coords = defaultCoords.map((def, i) => Number.isFinite(rawNums[i]) ? rawNums[i] : def);
    // Selbstheilung falls Punkte zuvor in die Ecke (47,46) gerutscht waren
    if (isCorruptedCornerCoords(coords)) {
      coords = defaultCoords.slice();
    }
    const sx = coords[2], sy = coords[3], px = coords[4], py = coords[5];

    let hasArm2 = false, arm2 = [Math.max(4, sx - 4), Math.min(44, sy + 7), Math.max(4, sx - 5), Math.min(44, sy + 14)];
    let hasLeg2 = false, leg2 = [Math.max(4, px - 3), Math.min(44, py + 9), Math.max(4, px - 3), Math.min(44, py + 17)];
    const props = [];

    (parts[1] || '').split('M').filter(Boolean).forEach(sub => {
      const pts = [...sub.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(m => [+m[1], +m[2]]);
      if (/[QZ]/.test(sub) || pts.length < 3) {
        props.push('M' + sub);
        return;
      }
      const isArm = Math.hypot(pts[0][0] - sx, pts[0][1] - sy) < Math.hypot(pts[0][0] - px, pts[0][1] - py);
      if (isArm && !hasArm2) {
        hasArm2 = true;
        arm2 = [pts[1][0], pts[1][1], pts[2][0], pts[2][1]];
      } else if (!isArm && !hasLeg2) {
        hasLeg2 = true;
        leg2 = [pts[1][0], pts[1][1], pts[2][0], pts[2][1]];
      } else {
        props.push('M' + sub);
      }
    });

    return {
      coords,
      hasArm2,
      arm2,
      hasLeg2,
      leg2,
      props,
      dumbbell: parts[2] === 'd'
    };
  }

  function serializeFigData(data) {
    const r = n => Math.round(Number(n) * 10) / 10;
    const c = data.coords.map(r);
    const sx = c[2], sy = c[3], px = c[4], py = c[5];
    const subpaths = [];
    if (data.hasLeg2 && Array.isArray(data.leg2)) {
      subpaths.push(`M${px} ${py}L${r(data.leg2[0])} ${r(data.leg2[1])}L${r(data.leg2[2])} ${r(data.leg2[3])}`);
    }
    if (data.hasArm2 && Array.isArray(data.arm2)) {
      subpaths.push(`M${sx} ${sy}L${r(data.arm2[0])} ${r(data.arm2[1])}L${r(data.arm2[2])} ${r(data.arm2[3])}`);
    }
    if (Array.isArray(data.props) && data.props.length) {
      subpaths.push(data.props.join(''));
    }
    const p1 = subpaths.join('');
    const p2 = data.dumbbell ? 'd' : '';
    if (p2) return `${c.join(',')};${p1};d`;
    if (p1) return `${c.join(',')};${p1}`;
    return c.join(',');
  }

  window.v3InterpolateFig = function (strA, strB, t) {
    if (!strA || strA.startsWith('BR') || strA.startsWith('MD_')) return strA || '';
    if (!strB || strB.startsWith('BR') || strB.startsWith('MD_')) return strA;
    const a = parseFigString(strA);
    const b = parseFigString(strB);
    const ease = 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, t)));
    const lerp = (v1, v2) => v1 + (v2 - v1) * ease;

    const coords = a.coords.map((v, i) => lerp(v, b.coords[i]));
    const hasArm2 = a.hasArm2 || b.hasArm2;
    const arm2 = a.arm2.map((v, i) => lerp(a.hasArm2 ? v : a.coords[10 + i], b.hasArm2 ? b.arm2[i] : b.coords[10 + i]));
    const hasLeg2 = a.hasLeg2 || b.hasLeg2;
    const leg2 = a.leg2.map((v, i) => lerp(a.hasLeg2 ? v : a.coords[6 + i], b.hasLeg2 ? b.leg2[i] : b.coords[6 + i]));

    return serializeFigData({
      coords,
      hasArm2,
      arm2,
      hasLeg2,
      leg2,
      props: a.props.length ? a.props : b.props,
      dumbbell: a.dumbbell || b.dumbbell
    });
  };

  function getExerciseKeyframes(e) {
    if (!e || !Array.isArray(e.fig) || !e.fig.length) return [];
    const start = e.fig[0];
    const end = e.fig[1] || e.fig[0];
    const mid = e.figMid || e.fig[2] || '';
    return mid ? [start, mid, end] : [start, end];
  }

  let morphRafId = 0;
  function startGlobalMorphLoop() {
    if (morphRafId) return;
    function step(now) {
      const boxes = document.querySelectorAll('.v3-morph-box[data-exid]');
      if (!boxes.length) {
        morphRafId = 0;
        return;
      }
      boxes.forEach(box => {
        const exId = box.getAttribute('data-exid');
        const e = exId === '__admin_draft__' ? window.v3AdminDraftEx : ex(exId);
        if (!e) return;
        const frames = getExerciseKeyframes(e);
        if (!frames.length || frames[0].startsWith('BR') || frames[0].startsWith('MD_')) return;

        let figStr = frames[0];
        let phaseLabel = 'Start';
        if (frames.length === 2) {
          const cycle = (now % 2600) / 2600;
          const t = cycle < 0.5 ? cycle * 2 : (1 - cycle) * 2;
          figStr = window.v3InterpolateFig(frames[0], frames[1], t);
          phaseLabel = t < 0.25 ? 'Start' : t > 0.75 ? 'Ende' : 'Bewegung';
        } else if (frames.length >= 3) {
          const segDur = 950;
          const total = segDur * 4;
          const pos = (now % total) / segDur;
          const seg = Math.floor(pos);
          const localT = pos - seg;
          if (seg === 0) { figStr = window.v3InterpolateFig(frames[0], frames[1], localT); phaseLabel = 'Start ➔ Übergang'; }
          else if (seg === 1) { figStr = window.v3InterpolateFig(frames[1], frames[2], localT); phaseLabel = 'Übergang ➔ Ende'; }
          else if (seg === 2) { figStr = window.v3InterpolateFig(frames[2], frames[1], localT); phaseLabel = 'Ende ➔ Übergang'; }
          else { figStr = window.v3InterpolateFig(frames[1], frames[0], localT); phaseLabel = 'Übergang ➔ Start'; }
        }

        const svgTarget = box.querySelector('.v3-morph-svg');
        const lblTarget = box.querySelector('.v3-morph-lbl');
        if (svgTarget) svgTarget.innerHTML = figSvg(figStr, e);
        if (lblTarget) lblTarget.textContent = phaseLabel;
      });
      morphRafId = requestAnimationFrame(step);
    }
    morphRafId = requestAnimationFrame(step);
  }

  // --- 4. ERWEITERTE USER-ÜBUNGSANSICHT (detTxt & Multi-Bar Sequence Timer) ---
  function renderExerciseTypeBanner(e) {
    const mode = getExecMode(e);
    const isUni = window.v3IsUnilateral(e);
    const tags = Array.isArray(e.tags) ? e.tags : [];
    const phases = Array.isArray(e.phases) && e.phases.length ? e.phases : (mode === 'sequence' && typeof window.v3GetExercisePhases === 'function' ? window.v3GetExercisePhases(e, 20) : []);

    let modeBadge = '';
    let modeAction = '';
    if (mode === 'sequence') {
      modeBadge = `<span class="v3-type-badge seq">📊 Abfolge-Übung (${phases.length} Phasen)</span>`;
      modeAction = `
        <div class="v3-seq-preview">
          <div class="mu" style="font-size:12px;margin-bottom:4px"><b>Ablauf der Halte-Phasen:</b></div>
          <div class="v3-seq-bars">
            ${phases.map((p, i) => `<div class="v3-seq-bar-item"><span>${i + 1}. ${esc(p.label)}</span><b>${p.sec} s</b></div>`).join('')}
          </div>
          <button type="button" class="b" style="margin-top:8px;width:100%" onclick="v3OpenSequenceTimer('${e.id}')">▶ Abfolge-Timer starten (${phases.reduce((s, x) => s + (+x.sec || 0), 0)} s)</button>
        </div>`;
    } else if (mode === 'hold') {
      modeBadge = `<span class="v3-type-badge hold">⏱️ Halte-Übung (Statisch)</span>`;
      if (typeof window.v3OpenPhaseTimer === 'function') {
        modeAction = `<div style="margin-top:6px"><button type="button" class="b g" style="padding:6px 12px;min-height:38px;font-size:13px" onclick="v3OpenPhaseTimer('${e.id}',30)">⏱️ 30s Halte-Timer starten</button></div>`;
      }
    } else {
      modeBadge = `<span class="v3-type-badge reps">🔁 Wiederholungsübung</span>`;
    }

    const uniBadge = isUni ? `<span class="v3-type-badge uni">↔️ Links / Rechts getrennt</span>` : '';
    const tagChips = tags.length
      ? `<div class="r" style="gap:4px;margin-top:6px">${tags.map(t => `<button type="button" class="chip" style="padding:2px 8px;font-size:11px" onclick="v3FilterByTag('${esc(t)}')">${esc(t.startsWith('#') ? t : '#' + t)}</button>`).join('')}</div>`
      : '';

    return `<div class="v3-ex-meta-box"><div class="r" style="gap:6px">${modeBadge}${uniBadge}</div>${tagChips}${modeAction}</div>`;
  }

  detTxt = function (e) {
    const hasMid = !!(e.figMid || (Array.isArray(e.fig) && e.fig[2]));
    const midStr = e.figMid || (Array.isArray(e.fig) ? e.fig[2] : '');
    const midThumb = hasMid && !midStr.startsWith('BR')
      ? `<div class="fg" style="width:110px;height:110px">${figSvg(midStr, e)}<span class="mu fl">Übergang</span></div>`
      : '';
    const isMorphable = !e.br && Array.isArray(e.fig) && e.fig.length >= 2 && !String(e.fig[0]).startsWith('MD_');
    const morphPreview = isMorphable
      ? `<div class="fg v3-morph-box" data-exid="${esc(e.id)}" style="width:110px;height:110px;border-color:var(--ac)">
           <div class="v3-morph-svg" style="width:100%;height:100%">${figSvg(e.fig[0], e)}</div>
           <span class="mu fl v3-morph-lbl" style="color:var(--ac);font-weight:700">Ablauf</span>
         </div>`
      : '';

    setTimeout(startGlobalMorphLoop, 40);

    return `
      <div class="r" style="margin-top:4px;gap:8px">
        ${fig(e, 0, 110)}
        ${midThumb}
        ${fig(e, 1, 110)}
        ${morphPreview}
      </div>
      ${renderExerciseTypeBanner(e)}
      <p class="mu" style="font-size:13px;margin:6px 0 0">${legend(e)}</p>
      <p>${esc(e.d || '')}</p>
      ${e.s ? `<p><b>Start:</b> ${esc(e.s)}${e.mPos ? `<br><b>Übergang:</b> ${esc(e.mPos)}` : ''}<br><b>Ende:</b> ${esc(e.e)}</p>` : ''}
      ${e.l ? `<p><b>Genauere Anleitung:</b> ${esc(e.l)}</p>` : ''}
      ${e.g ? `<p><b>Gut bei / Ziel:</b> ${esc(e.g)}</p>` : ''}
      ${e.x ? `<p><b>Eher nicht machen bei:</b> ${esc(e.x)}</p>` : ''}
      ${ytHtml(e)}
      <a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.n + ' Übung Anleitung')}">▶ Videos auf YouTube suchen</a>`;
  };

  const _prevLibList = libList;
  libList = function (l) {
    const html = _prevLibList(l);
    setTimeout(startGlobalMorphLoop, 40);
    if (!opn) return html;
    const e = ex(opn);
    if (!e) return html;

    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const openCards = [...tpl.content.querySelectorAll('.c')];
    for (const card of openCards) {
      const h3 = card.querySelector('h3');
      if (!h3 || !h3.textContent.startsWith(e.n)) continue;
      const figRows = card.querySelectorAll('.r');
      const detailFigRow = figRows[1];
      if (detailFigRow) {
        const hasMid = !!(e.figMid || (Array.isArray(e.fig) && e.fig[2]));
        const midStr = e.figMid || (Array.isArray(e.fig) ? e.fig[2] : '');
        if (hasMid && !midStr.startsWith('BR')) {
          const midEl = document.createElement('div');
          midEl.className = 'fg';
          midEl.style.cssText = 'width:110px;height:110px';
          midEl.innerHTML = `${figSvg(midStr, e)}<span class="mu fl">Übergang</span>`;
          detailFigRow.children[0]?.after(midEl);
        }
        if (!e.br && Array.isArray(e.fig) && e.fig.length >= 2 && !String(e.fig[0]).startsWith('MD_')) {
          const morphEl = document.createElement('div');
          morphEl.className = 'fg v3-morph-box';
          morphEl.setAttribute('data-exid', e.id);
          morphEl.style.cssText = 'width:110px;height:110px;border-color:var(--ac)';
          morphEl.innerHTML = `<div class="v3-morph-svg" style="width:100%;height:100%">${figSvg(e.fig[0], e)}</div><span class="mu fl v3-morph-lbl" style="color:var(--ac);font-weight:700">Ablauf</span>`;
          detailFigRow.appendChild(morphEl);
        }
        const bannerWrap = document.createElement('div');
        bannerWrap.innerHTML = renderExerciseTypeBanner(e);
        detailFigRow.after(bannerWrap.firstElementChild);
      }
      break;
    }
    return tpl.innerHTML;
  };

  let SEQ = null;
  window.v3OpenSequenceTimer = function (exId, targetVal, onComplete) {
    const e = ex(exId);
    if (!e) return;
    const phases = typeof window.v3GetExercisePhases === 'function' ? window.v3GetExercisePhases(e, targetVal) : (e.phases || [{ label: e.n, sec: 20 }]);
    if (!phases.length) return;

    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      AC.resume && AC.resume();
    } catch (_) {}

    SEQ = {
      e,
      phases,
      idx: 0,
      elapsedMs: 0,
      running: true,
      last: performance.now(),
      raf: 0,
      onComplete
    };

    let ov = document.getElementById('v3PhaseOv');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'v3PhaseOv';
      ov.className = 'v3-phase-overlay';
      document.body.appendChild(ov);
    }
    ov.style.display = 'flex';
    v3RenderSequenceModal();
    SEQ.raf = requestAnimationFrame(v3SequenceLoop);
  };

  function v3RenderSequenceModal() {
    const ov = document.getElementById('v3PhaseOv');
    if (!ov || !SEQ) return;
    const cur = SEQ.phases[SEQ.idx];
    const keyframes = getExerciseKeyframes(SEQ.e);
    const activeFig = keyframes[Math.min(SEQ.idx, keyframes.length - 1)] || keyframes[0];

    ov.innerHTML = `
      <div class="v3-phase-card">
        <div class="r" style="justify-content:space-between;flex-wrap:nowrap">
          <div>
            <small class="mu">📊 Abfolge-Übung · Phase ${SEQ.idx + 1}/${SEQ.phases.length}</small>
            <h3 style="margin:2px 0 0">${esc(SEQ.e.n)}</h3>
          </div>
          <button type="button" class="x" onclick="v3CloseSequenceTimer()">✕</button>
        </div>
        ${activeFig && !activeFig.startsWith('BR') ? `<div style="width:120px;height:120px;margin:10px auto" class="fg">${figSvg(activeFig, SEQ.e)}</div>` : ''}
        <div class="v3-phase-label" style="margin:6px 0">${esc(cur.label)}</div>
        <div class="v3-phase-time" id="v3SeqMainTime">${Math.ceil((cur.sec * 1000 - SEQ.elapsedMs) / 1000)} s</div>

        <div class="v3-multibar-list">
          ${SEQ.phases.map((p, i) => {
            const pct = i < SEQ.idx ? 0 : i > SEQ.idx ? 100 : Math.max(0, 100 * (1 - SEQ.elapsedMs / (p.sec * 1000)));
            return `
              <div class="v3-multibar-row ${i === SEQ.idx ? 'active' : i < SEQ.idx ? 'done' : ''}">
                <div class="r" style="justify-content:space-between;font-size:12px;margin-bottom:3px">
                  <b>${i + 1}. ${esc(p.label)}</b>
                  <span id="v3SeqRowTime_${i}">${i < SEQ.idx ? '✓ Fertig' : i === SEQ.idx ? Math.ceil((p.sec * 1000 - SEQ.elapsedMs) / 1000) + ' s' : p.sec + ' s'}</span>
                </div>
                <div class="v3-shrink-bar-wrap">
                  <div class="v3-shrink-bar" id="v3SeqRowBar_${i}" style="width:${pct.toFixed(1)}%"></div>
                </div>
              </div>`;
          }).join('')}
        </div>

        <div class="r" style="justify-content:center;gap:8px;margin-top:14px">
          <button type="button" class="b g" onclick="v3ToggleSequencePause()">${SEQ.running ? '⏸ Pause' : '▶ Weiter'}</button>
          <button type="button" class="chip" onclick="v3NextSequenceStep()">⏭️ Nächster Balken</button>
        </div>
      </div>`;
  }

  function v3SequenceLoop() {
    if (!SEQ || !SEQ.running) return;
    const now = performance.now();
    SEQ.elapsedMs += now - SEQ.last;
    SEQ.last = now;
    const cur = SEQ.phases[SEQ.idx];
    const totalMs = cur.sec * 1000;

    if (SEQ.elapsedMs >= totalMs) {
      v3NextSequenceStep();
      return;
    }

    const rem = Math.max(0, Math.ceil((totalMs - SEQ.elapsedMs) / 1000));
    const pct = Math.max(0, Math.min(100, 100 * (1 - SEQ.elapsedMs / totalMs)));
    const mainT = document.getElementById('v3SeqMainTime');
    const rowT = document.getElementById('v3SeqRowTime_' + SEQ.idx);
    const rowB = document.getElementById('v3SeqRowBar_' + SEQ.idx);
    if (mainT) mainT.textContent = rem + ' s';
    if (rowT) rowT.textContent = rem + ' s';
    if (rowB) rowB.style.width = pct.toFixed(1) + '%';

    SEQ.raf = requestAnimationFrame(v3SequenceLoop);
  }

  window.v3NextSequenceStep = function () {
    if (!SEQ) return;
    if (SEQ.idx < SEQ.phases.length - 1) {
      beep();
      SEQ.idx++;
      SEQ.elapsedMs = 0;
      SEQ.last = performance.now();
      v3RenderSequenceModal();
      SEQ.raf = requestAnimationFrame(v3SequenceLoop);
    } else {
      if (typeof v27GoSound === 'function') v27GoSound();
      else beep();
      const cb = SEQ.onComplete;
      v3CloseSequenceTimer();
      if (typeof cb === 'function') cb();
    }
  };

  window.v3ToggleSequencePause = function () {
    if (!SEQ) return;
    SEQ.running = !SEQ.running;
    if (SEQ.running) {
      SEQ.last = performance.now();
      SEQ.raf = requestAnimationFrame(v3SequenceLoop);
    } else {
      cancelAnimationFrame(SEQ.raf);
    }
    v3RenderSequenceModal();
  };

  window.v3CloseSequenceTimer = function () {
    if (SEQ) {
      cancelAnimationFrame(SEQ.raf);
      SEQ = null;
    }
    const ov = document.getElementById('v3PhaseOv');
    if (ov) ov.style.display = 'none';
  };

  // --- 5. LINKS / RECHTS GETRENNT ABHAKEN (UNILATERAL TRACKING AUF HOME) ---
  window.v3ToggleLR = function (dt, pid, idx, setNum, side) {
    S.lrLog[dt] = S.lrLog[dt] || {};
    S.lrLog[dt][pid] = S.lrLog[dt][pid] || {};
    S.lrLog[dt][pid][idx] = S.lrLog[dt][pid][idx] || {};
    const cur = S.lrLog[dt][pid][idx][setNum] || { L: false, R: false };
    cur[side] = !cur[side];
    S.lrLog[dt][pid][idx][setNum] = cur;

    const p = S.plans.find(x => x.id === pid);
    if (!p || !p.items[idx]) return;

    const currentLogged = Number(((S.log[dt] || {})[pid] || {})[idx]) || 0;
    if (cur.L && cur.R && setNum > currentLogged) {
      tick(dt, pid, idx, setNum);
    } else if ((!cur.L || !cur.R) && currentLogged >= setNum) {
      tick(dt, pid, idx, setNum);
    } else {
      save();
      render();
    }
  };

  const _prevVTodayAdmin = vToday;
  vToday = function () {
    const html = _prevVTodayAdmin();
    const dt = iso(new Date());
    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    const titles = tpl.content.querySelectorAll('b[onclick^="tg(\'"]');
    titles.forEach(bEl => {
      const m = (bEl.getAttribute('onclick') || '').match(/^tg\('([^']+)_(\d+)'\)$/);
      if (!m) return;
      const pid = m[1];
      const idx = Number(m[2]);
      const p = S.plans.find(x => x.id === pid);
      if (!p || !p.items[idx]) return;
      const eff = effective(p.items[idx], p);
      const e = ex(eff.ex);
      if (!e) return;

      const container = bEl.closest('.r')?.parentElement;
      const setBtn = container?.querySelector('button.set');
      const actionRow = setBtn?.parentElement;
      if (!actionRow) return;

      if (getExecMode(e) === 'sequence') {
        const holdBtn = actionRow.querySelector('button[onclick^="holdT("]');
        if (holdBtn) {
          holdBtn.setAttribute('onclick', `v3OpenSequenceTimer('${e.id}',${eff.reps},()=>tickNext('${dt}','${pid}',${idx},${eff.sets}))`);
          holdBtn.innerHTML = `📊 Abfolge (${eff.reps}s)`;
        }
      }

      if (window.v3IsUnilateral(e)) {
        const doneCount = Number(((S.log[dt] || {})[pid] || {})[idx]) || 0;
        const lrMap = (((S.lrLog[dt] || {})[pid] || {})[idx] || {});
        const lrBar = document.createElement('div');
        lrBar.className = 'v3-lr-row';
        let chips = `<span class="mu" style="font-size:11px;margin-right:4px">↔️ L/R je Satz:</span>`;
        for (let s = 1; s <= eff.sets; s++) {
          const isFull = s <= doneCount;
          const st = lrMap[s] || { L: isFull, R: isFull };
          chips += `
            <span class="v3-lr-pair">
              <small>${s}</small>
              <button type="button" class="v3-lr-btn ${st.L ? 'on' : ''}" onclick="v3ToggleLR('${dt}','${pid}',${idx},${s},'L')" title="Satz ${s} Links">L</button>
              <button type="button" class="v3-lr-btn ${st.R ? 'on' : ''}" onclick="v3ToggleLR('${dt}','${pid}',${idx},${s},'R')" title="Satz ${s} Rechts">R</button>
            </span>`;
        }
        lrBar.innerHTML = chips;
        actionRow.after(lrBar);
      }
    });

    setTimeout(startGlobalMorphLoop, 40);
    return tpl.innerHTML;
  };

  // =========================================================================
  // 6. INTERAKTIVER ADMIN-EDITOR (FIX FÜR TOUCH/MOUSE DRAGGING & GLOBALS)
  // =========================================================================
  const JOINT_META = [
    { idx: 0, key: 'head', label: 'Kopf', color: '#38bdf8' },
    { idx: 2, key: 'shoulder', label: 'Schulter', color: '#f59e0b' },
    { idx: 4, key: 'pelvis', label: 'Becken', color: '#f97316' },
    { idx: 6, key: 'knee1', label: 'Knie 1', color: '#22c55e' },
    { idx: 8, key: 'foot1', label: 'Fuß 1', color: '#10b981' },
    { idx: 10, key: 'elbow1', label: 'Ellbogen 1', color: '#a855f7' },
    { idx: 12, key: 'hand1', label: 'Hand 1', color: '#ec4899' }
  ];

  function createEmptyAdminDraft() {
    const nextNum = Math.max(131, ...EX.filter(x => !String(x.id).startsWith('m')).map(x => Number(String(x.id).replace(/\D/g, '')) || 0)) + 1;
    return {
      isNew: true,
      id: 'e' + nextNum,
      n: '',
      al: [],
      c: 'Kraft',
      sub: '',
      m: '–',
      execMode: 'reps',
      unilateral: false,
      tags: [],
      d: '',
      s: '',
      mPos: '',
      e: '',
      l: '',
      g: '',
      x: '',
      hasMid: false,
      activePhase: 0,
      selectedJoint: 'knee1',
      frames: [
        parseFigString(STD_STANDING_FIG),
        parseFigString(STD_STANDING_FIG),
        parseFigString(STD_END_FIG)
      ],
      phases: [
        { label: 'Position 1 halten', sec: 20 },
        { label: 'Wechsel / Übergang', sec: 5 },
        { label: 'Position 2 halten', sec: 20 }
      ],
      ytList: []
    };
  }

  let AD = createEmptyAdminDraft();
  window.AD = AD;
  window.v3AdminDraftEx = null;

  function syncDraftToPreviewEx() {
    window.AD = AD;
    const startStr = serializeFigData(AD.frames[0]);
    const midStr = serializeFigData(AD.frames[1]);
    const endStr = serializeFigData(AD.frames[2]);
    window.v3AdminDraftEx = {
      id: AD.id,
      n: AD.n || 'Vorschau',
      al: AD.al,
      c: AD.c,
      sub: AD.sub,
      m: AD.m,
      execMode: AD.execMode,
      unilateral: AD.unilateral,
      tags: AD.tags,
      d: AD.d,
      s: AD.s,
      mPos: AD.mPos,
      e: AD.e,
      l: AD.l,
      g: AD.g,
      x: AD.x,
      fig: [startStr, endStr],
      figMid: AD.hasMid ? midStr : undefined,
      phases: AD.execMode === 'sequence' ? AD.phases : undefined,
      ytList: AD.ytList,
      yt: AD.ytList[0] || undefined
    };
    return window.v3AdminDraftEx;
  }

  window.v3AdminLoadExercise = function (id) {
    S.ui.v3AdminOpen = true;
    S.ui.settingsOpen.adminStudio = true;
    if (!id || id === '__new__') {
      AD = createEmptyAdminDraft();
      syncDraftToPreviewEx();
      render();
      return;
    }
    const existing = EX.find(x => x.id === id);
    if (!existing) return;
    const f0 = existing.fig?.[0] || STD_STANDING_FIG;
    const f2 = existing.fig?.[1] || f0;
    const f1 = existing.figMid || existing.fig?.[2] || window.v3InterpolateFig(f0, f2, 0.5);

    AD = {
      isNew: false,
      id: existing.id,
      n: existing.n || '',
      al: Array.isArray(existing.al) ? existing.al.slice() : [],
      c: existing.c || 'Kraft',
      sub: existing.sub || '',
      m: existing.m || '–',
      execMode: getExecMode(existing),
      unilateral: window.v3IsUnilateral(existing),
      tags: Array.isArray(existing.tags) ? existing.tags.slice() : [],
      d: existing.d || '',
      s: existing.s || '',
      mPos: existing.mPos || '',
      e: existing.e || '',
      l: existing.l || '',
      g: existing.g || '',
      x: existing.x || '',
      hasMid: !!(existing.figMid || existing.fig?.[2]),
      activePhase: 0,
      selectedJoint: 'knee1',
      frames: [parseFigString(f0), parseFigString(f1), parseFigString(f2)],
      phases: Array.isArray(existing.phases) && existing.phases.length
        ? JSON.parse(JSON.stringify(existing.phases))
        : [
            { label: (existing.n || 'Übung') + ' · Stellung 1', sec: 20 },
            { label: 'Übergang / Wechsel', sec: 5 },
            { label: (existing.n || 'Übung') + ' · Stellung 2', sec: 20 }
          ],
      ytList: getYoutubeList(existing)
    };
    syncDraftToPreviewEx();
    render();
  };

  // Globale Setter für Übungs-Typ & Ausführung (Fix für Punkt 2)
  window.v3AdminSetExecMode = function (mode) {
    if (!['reps', 'hold', 'sequence'].includes(mode)) return;
    AD.execMode = mode;
    S.ui.v3AdminOpen = true;
    S.ui.settingsOpen.adminStudio = true;
    syncDraftToPreviewEx();
    const box = document.getElementById('v3AdminExecBox');
    if (box) {
      box.outerHTML = renderAdminExecBoxHtml();
    } else {
      render();
    }
  };

  window.v3AdminSetUnilateral = function (checked) {
    AD.unilateral = !!checked;
    S.ui.v3AdminOpen = true;
    S.ui.settingsOpen.adminStudio = true;
    syncDraftToPreviewEx();
  };

  window.v3AdminUpdatePhase = function (idx, field, val) {
    if (!AD.phases[idx]) return;
    if (field === 'sec') AD.phases[idx].sec = Math.max(1, Number(val) || 10);
    else AD.phases[idx].label = String(val || '');
    syncDraftToPreviewEx();
  };

  window.v3AdminRemovePhaseRow = function (idx) {
    AD.phases.splice(idx, 1);
    syncDraftToPreviewEx();
    const box = document.getElementById('v3AdminExecBox');
    if (box) box.outerHTML = renderAdminExecBoxHtml();
  };

  window.v3AdminAddPhaseRow = function () {
    AD.phases.push({ label: 'Stellung ' + (AD.phases.length + 1) + ' halten', sec: 20 });
    syncDraftToPreviewEx();
    const box = document.getElementById('v3AdminExecBox');
    if (box) box.outerHTML = renderAdminExecBoxHtml();
  };

  window.v3AdminSelectJoint = function (jointKey) {
    AD.selectedJoint = jointKey;
    v3RefreshAdminStudioDOM(true);
  };

  window.v3AdminResetPose = function () {
    AD.frames[AD.activePhase] = parseFigString(AD.activePhase === 2 ? STD_END_FIG : STD_STANDING_FIG);
    syncDraftToPreviewEx();
    v3RefreshAdminStudioDOM(true);
    toast('🔄 Pose auf Standard-Stand zurückgesetzt');
  };

  window.v3AdminSetPhase = function (pIdx) {
    AD.activePhase = pIdx;
    if (pIdx === 1) AD.hasMid = true;
    syncDraftToPreviewEx();
    // Aktualisiere Phasen-Tab-Buttons und Controls
    [0, 1, 2].forEach(i => {
      const btn = document.getElementById('v3AdmPhaseBtn_' + i);
      if (btn) btn.classList.toggle('on', AD.activePhase === i);
    });
    const midCb = document.getElementById('v3AdmHasMidCb');
    if (midCb) midCb.checked = AD.hasMid;
    v3RefreshAdminStudioDOM(true);
  };

  window.v3AdminAutoMidpoint = function () {
    const startStr = serializeFigData(AD.frames[0]);
    const endStr = serializeFigData(AD.frames[2]);
    const midStr = window.v3InterpolateFig(startStr, endStr, 0.5);
    AD.frames[1] = parseFigString(midStr);
    AD.hasMid = true;
    window.v3AdminSetPhase(1);
    toast('✨ Übergangs-Position automatisch aus Start & Ende berechnet');
  };

  window.v3AdminCopyPhase = function (fromIdx, toIdx) {
    AD.frames[toIdx] = JSON.parse(JSON.stringify(AD.frames[fromIdx]));
    if (toIdx === 1) AD.hasMid = true;
    window.v3AdminSetPhase(toIdx);
    toast('Position kopiert');
  };

  window.v3AdminFlipHorizontal = function () {
    const fr = AD.frames[AD.activePhase];
    for (let i = 0; i < fr.coords.length; i += 2) {
      fr.coords[i] = Math.round((48 - fr.coords[i]) * 10) / 10;
    }
    if (fr.hasArm2) {
      fr.arm2[0] = Math.round((48 - fr.arm2[0]) * 10) / 10;
      fr.arm2[2] = Math.round((48 - fr.arm2[2]) * 10) / 10;
    }
    if (fr.hasLeg2) {
      fr.leg2[0] = Math.round((48 - fr.leg2[0]) * 10) / 10;
      fr.leg2[2] = Math.round((48 - fr.leg2[2]) * 10) / 10;
    }
    syncDraftToPreviewEx();
    v3RefreshAdminStudioDOM(true);
  };

  window.v3AdminToggleLimb2 = function (kind, enabled) {
    const fr = AD.frames[AD.activePhase];
    if (kind === 'leg2') fr.hasLeg2 = !!enabled;
    if (kind === 'arm2') fr.hasArm2 = !!enabled;
    if (kind === 'dumbbell') fr.dumbbell = !!enabled;
    syncDraftToPreviewEx();
    v3RefreshAdminStudioDOM(true);
  };

  window.v3AdminAddPropPreset = function (presetKey) {
    const preset = PROP_PRESETS[presetKey];
    if (!preset) return;
    AD.frames.forEach(fr => {
      fr.props = preset.path ? [preset.path] : [];
    });
    syncDraftToPreviewEx();
    v3RefreshAdminStudioDOM(true);
  };

  window.v3AdminToggleRegion = function (regName) {
    const isCurrentlyActive = REG[regName]?.test((AD.n || '') + ' ' + (AD.g || ''));
    const kw = REGION_KEYWORDS[regName] || regName;
    const firstWord = kw.split(',')[0].trim();
    let parts = (AD.g || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!isCurrentlyActive) {
      parts.push(firstWord);
    } else {
      parts = parts.filter(p => !REG[regName]?.test(p));
    }
    AD.g = parts.join(', ');
    const gInp = document.getElementById('v3Adm_g');
    if (gInp) gInp.value = AD.g;
    syncDraftToPreviewEx();
    const regBox = document.getElementById('v3AdminRegionsBox');
    if (regBox) regBox.outerHTML = renderAdminRegionsBoxHtml();
    v3RefreshAdminStudioDOM(true);
  };

  // Liefert alle aktuell aktiven Gelenke mit ihren Koordinaten für das aktuelle Frame
  function getActiveJointList(fr) {
    const list = JOINT_META.map(j => ({
      key: j.key,
      label: j.label,
      color: j.color,
      x: fr.coords[j.idx],
      y: fr.coords[j.idx + 1],
      dashed: false
    }));
    if (fr.hasLeg2) {
      list.push({ key: 'knee2', label: 'Knie 2', color: '#14b8a6', x: fr.leg2[0], y: fr.leg2[1], dashed: true });
      list.push({ key: 'foot2', label: 'Fuß 2', color: '#0d9488', x: fr.leg2[2], y: fr.leg2[3], dashed: true });
    }
    if (fr.hasArm2) {
      list.push({ key: 'elbow2', label: 'Ellbogen 2', color: '#c084fc', x: fr.arm2[0], y: fr.arm2[1], dashed: true });
      list.push({ key: 'hand2', label: 'Hand 2', color: '#f472b6', x: fr.arm2[2], y: fr.arm2[3], dashed: true });
    }
    return list;
  }

  function renderHandlesInnerSvg(fr) {
    const joints = getActiveJointList(fr);
    return joints.map(j => {
      const isSel = AD.selectedJoint === j.key;
      return `
        <g class="v3-joint-handle" data-joint="${j.key}" style="cursor:grab">
          ${isSel ? `<circle cx="${j.x}" cy="${j.y}" r="3.6" fill="none" stroke="${j.color}" stroke-width="0.7" opacity="0.85"/>` : ''}
          <circle cx="${j.x}" cy="${j.y}" r="${isSel ? 2.3 : 1.8}" fill="${j.color}" stroke="#fff" stroke-width="0.55" ${j.dashed ? 'stroke-dasharray="1,0.5"' : ''}/>
          <circle cx="${j.x}" cy="${j.y}" r="4.5" fill="transparent"/>
        </g>`;
    }).join('');
  }

  function renderJointChipsHtml(fr) {
    const joints = getActiveJointList(fr);
    return joints.map(j => `
      <button type="button" class="chip ${AD.selectedJoint === j.key ? 'on' : ''}"
        style="padding:4px 9px;font-size:11px;display:inline-flex;align-items:center;gap:4px"
        onclick="v3AdminSelectJoint('${j.key}')">
        <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${j.color}"></span>
        ${esc(j.label)}
      </button>
    `).join('');
  }

  function renderInteractiveEditorSvg() {
    const fr = AD.frames[AD.activePhase];
    const draftEx = syncDraftToPreviewEx();
    const curStr = serializeFigData(fr);

    let gridLines = '';
    for (let g = 6; g < 48; g += 6) {
      gridLines += `<line x1="${g}" y1="0" x2="${g}" y2="48" stroke="var(--bd)" stroke-width="0.25" opacity="0.5"/>`;
      gridLines += `<line x1="0" y1="${g}" x2="48" y2="${g}" stroke="var(--bd)" stroke-width="0.25" opacity="0.5"/>`;
    }

    const innerFig = figSvg(curStr, draftEx).replace(/^<svg[^>]*>|<\/svg>$/g, '');

    return `
      <svg id="v3AdminSvgCanvas" class="v3-admin-svg" viewBox="0 0 48 48" width="240" height="240">
        <g id="v3AdminGridLayer">${gridLines}</g>
        <g id="v3AdminFigLayer">${innerFig}</g>
        <g id="v3AdminHandlesLayer">${renderHandlesInnerSvg(fr)}</g>
      </svg>`;
  }

  // WICHTIGER FIX (Punkt 1): Das <svg>-Element bleibt beim Ziehen komplett erhalten!
  // Nur die inneren Layer (#v3AdminFigLayer und #v3AdminHandlesLayer) werden aktualisiert.
  function bindAdminCanvasPointerEvents() {
    const svg = document.getElementById('v3AdminSvgCanvas');
    if (!svg || svg.dataset.bound === '1') return;
    svg.dataset.bound = '1';

    let draggingJoint = null;

    const getSvgCoords = ev => {
      const rect = svg.getBoundingClientRect();
      // Schutz gegen Division durch 0 oder verstecktes Canvas (verhindert das Springen auf 47,46!)
      if (!rect || rect.width < 20 || rect.height < 20) return null;
      const clientX = ev.clientX !== undefined ? ev.clientX : (ev.touches?.[0]?.clientX);
      const clientY = ev.clientY !== undefined ? ev.clientY : (ev.touches?.[0]?.clientY);
      if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;

      const rawX = ((clientX - rect.left) / rect.width) * 48;
      const rawY = ((clientY - rect.top) / rect.height) * 48;
      if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;

      const x = Math.max(2, Math.min(46, Math.round(rawX * 2) / 2));
      const y = Math.max(2, Math.min(45, Math.round(rawY * 2) / 2));
      return [x, y];
    };

    const applyJointPosition = (jointKey, x, y) => {
      const fr = AD.frames[AD.activePhase];
      const mainMeta = JOINT_META.find(j => j.key === jointKey);
      if (mainMeta) {
        fr.coords[mainMeta.idx] = x;
        fr.coords[mainMeta.idx + 1] = y;
      } else if (jointKey === 'knee2') {
        fr.leg2[0] = x; fr.leg2[1] = y;
      } else if (jointKey === 'foot2') {
        fr.leg2[2] = x; fr.leg2[3] = y;
      } else if (jointKey === 'elbow2') {
        fr.arm2[0] = x; fr.arm2[1] = y;
      } else if (jointKey === 'hand2') {
        fr.arm2[2] = x; fr.arm2[3] = y;
      }
    };

    svg.addEventListener('pointerdown', ev => {
      const pt = getSvgCoords(ev);
      if (!pt) return;
      ev.preventDefault();
      const [x, y] = pt;
      const fr = AD.frames[AD.activePhase];
      const joints = getActiveJointList(fr);

      // 1. Prüfe, ob ein Gelenk in der Nähe des Finger-/Mausklicks liegt (Radius 8 Einheiten im 48x48 Feld)
      let bestKey = null;
      let bestDist = 8.5;
      joints.forEach(j => {
        const d = Math.hypot(j.x - x, j.y - y);
        // Falls zwei Gelenke aufeinander liegen, bevorzuge das bereits ausgewählte Gelenk
        const bonus = j.key === AD.selectedJoint ? -0.4 : 0;
        if (d + bonus < bestDist) {
          bestDist = d + bonus;
          bestKey = j.key;
        }
      });

      // 2. Falls weiter weg geklickt wurde, bewege das aktuell über die Chips ausgewählte Gelenk dorthin!
      draggingJoint = bestKey || AD.selectedJoint || 'knee1';
      AD.selectedJoint = draggingJoint;

      try { svg.setPointerCapture(ev.pointerId); } catch (_) {}
      applyJointPosition(draggingJoint, x, y);
      v3RefreshAdminStudioDOM(false);
    }, { passive: false });

    svg.addEventListener('pointermove', ev => {
      if (!draggingJoint) return;
      const pt = getSvgCoords(ev);
      if (!pt) return;
      ev.preventDefault();
      const [x, y] = pt;
      applyJointPosition(draggingJoint, x, y);
      v3RefreshAdminStudioDOM(false);
    }, { passive: false });

    const endDrag = ev => {
      if (!draggingJoint) return;
      try {
        if (ev && ev.pointerId !== undefined && svg.hasPointerCapture?.(ev.pointerId)) {
          svg.releasePointerCapture(ev.pointerId);
        }
      } catch (_) {}
      draggingJoint = null;
      v3RefreshAdminStudioDOM(true);
    };

    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
  }

  window.v3RefreshAdminStudioDOM = function (updateChips = false) {
    const fr = AD.frames[AD.activePhase];
    const draftEx = syncDraftToPreviewEx();
    const curStr = serializeFigData(fr);

    const figLayer = document.getElementById('v3AdminFigLayer');
    const handlesLayer = document.getElementById('v3AdminHandlesLayer');

    if (figLayer && handlesLayer) {
      figLayer.innerHTML = figSvg(curStr, draftEx).replace(/^<svg[^>]*>|<\/svg>$/g, '');
      handlesLayer.innerHTML = renderHandlesInnerSvg(fr);
    } else {
      const canvasWrap = document.getElementById('v3AdminCanvasWrap');
      if (canvasWrap) {
        canvasWrap.innerHTML = renderInteractiveEditorSvg();
        bindAdminCanvasPointerEvents();
      }
    }

    if (updateChips) {
      const chipsWrap = document.getElementById('v3AdminJointChips');
      if (chipsWrap) chipsWrap.innerHTML = renderJointChipsHtml(fr);
      const limb2Wrap = document.getElementById('v3AdminLimbToggles');
      if (limb2Wrap) {
        limb2Wrap.innerHTML = `
          <label class="chip" style="padding:5px 10px;font-size:12px"><input type="checkbox" ${fr.hasLeg2 ? 'checked' : ''} onchange="v3AdminToggleLimb2('leg2',this.checked)"> 🦵 2. Bein</label>
          <label class="chip" style="padding:5px 10px;font-size:12px"><input type="checkbox" ${fr.hasArm2 ? 'checked' : ''} onchange="v3AdminToggleLimb2('arm2',this.checked)"> 💪 2. Arm</label>
          <label class="chip" style="padding:5px 10px;font-size:12px"><input type="checkbox" ${fr.dumbbell ? 'checked' : ''} onchange="v3AdminToggleLimb2('dumbbell',this.checked)"> 🏋️ Hantel</label>`;
      }
    }

    const previewWrap = document.getElementById('v3AdminPreviewWrap');
    if (previewWrap) {
      previewWrap.innerHTML = renderAdminLivePreviews();
    }
    const codeInp = document.getElementById('v3AdminFigCode');
    if (codeInp && document.activeElement !== codeInp) {
      codeInp.value = curStr;
    }
    startGlobalMorphLoop();
  };

  function renderAdminLivePreviews() {
    const draftEx = syncDraftToPreviewEx();
    const s0 = serializeFigData(AD.frames[0]);
    const s1 = serializeFigData(AD.frames[1]);
    const s2 = serializeFigData(AD.frames[2]);

    return `
      <div class="r" style="gap:8px;justify-content:center">
        <div class="fg" style="width:76px;height:76px;cursor:pointer;${AD.activePhase === 0 ? 'border:2px solid var(--ac)' : ''}" onclick="v3AdminSetPhase(0)">
          ${figSvg(s0, draftEx)}<span class="mu fl">Start</span>
        </div>
        ${AD.hasMid ? `
        <div class="fg" style="width:76px;height:76px;cursor:pointer;${AD.activePhase === 1 ? 'border:2px solid var(--ac)' : ''}" onclick="v3AdminSetPhase(1)">
          ${figSvg(s1, draftEx)}<span class="mu fl">Übergang</span>
        </div>` : ''}
        <div class="fg" style="width:76px;height:76px;cursor:pointer;${AD.activePhase === 2 ? 'border:2px solid var(--ac)' : ''}" onclick="v3AdminSetPhase(2)">
          ${figSvg(s2, draftEx)}<span class="mu fl">Ende</span>
        </div>
        <div class="fg v3-morph-box" data-exid="__admin_draft__" style="width:88px;height:88px;border:2px solid var(--mc)">
          <div class="v3-morph-svg" style="width:100%;height:100%">${figSvg(s0, draftEx)}</div>
          <span class="mu fl v3-morph-lbl" style="color:var(--mc);font-weight:700">Morph</span>
        </div>
      </div>`;
  }

  function renderAdminRegionsBoxHtml() {
    const activeRegions = Object.keys(REG).filter(r => REG[r].test((AD.n || '') + ' ' + (AD.g || '')));
    return `
      <div class="v3-admin-box" id="v3AdminRegionsBox">
        <b>🔥 Beanspruchte Muskelpartien (färbt Körperteile automatisch ein)</b>
        <div class="r" style="gap:6px;margin-top:6px">
          ${Object.keys(REG).map(r => `
            <button type="button" class="chip ${activeRegions.includes(r) ? 'on' : ''}" style="padding:5px 10px;font-size:12px" onclick="v3AdminToggleRegion('${r}')">
              ${esc(r)}
            </button>
          `).join('')}
        </div>
      </div>`;
  }

  function renderAdminExecBoxHtml() {
    return `
      <div class="v3-admin-box" id="v3AdminExecBox">
        <b>⚙️ Übungs-Typ & Ausführung (steuert Timer & Info-Anzeige)</b>
        <div class="r" style="gap:6px;margin-top:6px">
          ${[
            ['reps', '🔁 Wiederholungsübung (Wdh.)'],
            ['hold', '⏱️ Halte-Übung (Statisch)'],
            ['sequence', '📊 Abfolge-Übung (Mehrere Balken)']
          ].map(([k, lbl]) => `
            <button type="button" class="chip ${AD.execMode === k ? 'on' : ''}" style="flex:1;font-size:12px;padding:8px" onclick="v3AdminSetExecMode('${k}')">${lbl}</button>
          `).join('')}
        </div>

        <label class="settingsRow" style="margin-top:10px;cursor:pointer">
          <input type="checkbox" ${AD.unilateral ? 'checked' : ''} onchange="v3AdminSetUnilateral(this.checked)">
          <span><b>↔️ Linke & Rechte Seite getrennt abhaken</b> (zeigt dem Nutzer L / R Buttons pro Satz)</span>
        </label>

        ${AD.execMode === 'sequence' ? `
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--bd)">
            <b style="font-size:13px">📊 Phasen / Ablauf-Balken konfigurieren:</b>
            ${AD.phases.map((ph, idx) => `
              <div class="r" style="margin-top:6px;flex-wrap:nowrap">
                <input placeholder="Stellung / Phase ${idx + 1}" value="${esc(ph.label)}" oninput="v3AdminUpdatePhase(${idx},'label',this.value)" style="flex:1">
                <input type="number" min="1" max="600" value="${ph.sec}" oninput="v3AdminUpdatePhase(${idx},'sec',this.value)" style="width:74px" title="Sekunden">
                <span class="mu" style="font-size:12px">s</span>
                <button type="button" class="x" onclick="v3AdminRemovePhaseRow(${idx})">✕</button>
              </div>
            `).join('')}
            <button type="button" class="chip" style="margin-top:6px;font-size:12px;padding:5px 10px" onclick="v3AdminAddPhaseRow()">+ Weitere Stellung / Balken hinzufügen</button>
          </div>` : ''}
      </div>`;
  }

  window.v3AdminSaveExercise = function () {
    if (!AD.n.trim()) {
      toast('Bitte einen Übungsnamen eingeben');
      return;
    }
    const exObj = syncDraftToPreviewEx();
    const clean = {
      id: exObj.id,
      n: exObj.n.trim(),
      al: exObj.al.filter(Boolean),
      c: exObj.c,
      m: exObj.m.trim() || '–',
      d: exObj.d.trim(),
      s: exObj.s.trim(),
      e: exObj.e.trim(),
      g: exObj.g.trim(),
      x: exObj.x.trim(),
      fig: [serializeFigData(AD.frames[0]), serializeFigData(AD.frames[2])]
    };
    if (AD.l.trim()) clean.l = AD.l.trim();
    if (AD.sub.trim()) clean.sub = AD.sub.trim();
    if (AD.hasMid) {
      clean.figMid = serializeFigData(AD.frames[1]);
      if (AD.mPos.trim()) clean.mPos = AD.mPos.trim();
    }
    if (AD.execMode && AD.execMode !== 'reps') clean.execMode = AD.execMode;
    if (AD.unilateral) clean.unilateral = true;
    if (AD.tags.length) clean.tags = AD.tags;
    if (AD.execMode === 'sequence' && AD.phases.length) clean.phases = AD.phases;
    if (AD.ytList.length) {
      clean.yt = AD.ytList[0];
      if (AD.ytList.length > 1) clean.ytList = AD.ytList;
    }

    const idx = EX.findIndex(x => x.id === clean.id);
    if (idx >= 0) EX[idx] = Object.assign({}, EX[idx], clean);
    else EX.push(clean);

    saveExerciseToAdminStore(clean);
    AD.isNew = false;
    toast(`✓ Übung „${clean.n}“ (${clean.id}) im Katalog gespeichert!`);
    render();
  };

  window.v3AdminExportExercisesJson = function () {
    const official = EX.filter(x => x && String(x.id)[0] !== 'c');
    const jsonText = JSON.stringify(official, null, 2);
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exercises.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 3000);
    toast(`📥 exercises.json (${official.length} Übungen) exportiert`);
  };

  window.v3AdminAddYtRow = function () {
    const urlInp = document.getElementById('v3AdmYtUrl');
    const titleInp = document.getElementById('v3AdmYtTitle');
    const vid = extractYoutubeId(urlInp?.value);
    if (!vid) {
      toast('Bitte YouTube-Link oder Video-ID eingeben');
      return;
    }
    AD.ytList.push({ id: vid, t: titleInp?.value?.trim() || (AD.n || 'Übung') + ' Anleitung' });
    if (urlInp) urlInp.value = '';
    if (titleInp) titleInp.value = '';
    S.ui.v3AdminOpen = true;
    S.ui.settingsOpen.adminStudio = true;
    render();
  };

  function renderAdminStudioCard() {
    const fr = AD.frames[AD.activePhase];
    const isOpen = !!(S.ui.settingsOpen?.adminStudio || S.ui.v3AdminOpen);

    return `
      <div class="c" id="v3AdminStudioCard" data-setting-key="adminStudio">
        <details ${isOpen ? 'open' : ''} ontoggle="S.ui.v3AdminOpen=this.open;d282ToggleSettings('adminStudio',this.open);if(this.open)setTimeout(()=>v3RefreshAdminStudioDOM(true),20)">
          <summary style="font-weight:700;cursor:pointer">🛠️ Admin: Übungskatalog-Studio (${EX.length} Übungen)</summary>
          <div style="margin-top:12px">
            <p class="mu" style="font-size:13px;margin-top:0">Erstelle neue Übungen oder passe bestehende an. Ziehe die Gelenke direkt im Feld oder wähle unten ein Gelenk aus und tippe auf die gewünschte Position.</p>

            <div class="r" style="gap:8px;margin-bottom:10px">
              <select style="flex:1" onchange="v3AdminLoadExercise(this.value)" aria-label="Übung zum Bearbeiten wählen">
                <option value="__new__" ${AD.isNew ? 'selected' : ''}>➕ Neue Übung anlegen (${AD.isNew ? AD.id : 'nächste freie ID'})</option>
                ${EX.map(x => `<option value="${esc(x.id)}" ${!AD.isNew && AD.id === x.id ? 'selected' : ''}>${esc(x.id)} · ${esc(x.n)} (${esc(x.c)})</option>`).join('')}
              </select>
              <button type="button" class="chip" onclick="v3AdminLoadExercise('__new__')">Neu</button>
            </div>

            <div class="v3-admin-box">
              <div class="r" style="justify-content:space-between;margin-bottom:8px">
                <b>🎨 Strichmännchen-Editor (48×48 Raster)</b>
                <span class="mu" style="font-size:12px">ID: <b>${esc(AD.id)}</b></span>
              </div>

              <div class="r" style="gap:6px;margin-bottom:8px">
                <button type="button" id="v3AdmPhaseBtn_0" class="chip ${AD.activePhase === 0 ? 'on' : ''}" style="flex:1;padding:8px" onclick="v3AdminSetPhase(0)">1. Start</button>
                <button type="button" id="v3AdmPhaseBtn_1" class="chip ${AD.activePhase === 1 ? 'on' : ''}" style="flex:1;padding:8px" onclick="v3AdminSetPhase(1)">2. Übergang ${AD.hasMid ? '✓' : '(opt.)'}</button>
                <button type="button" id="v3AdmPhaseBtn_2" class="chip ${AD.activePhase === 2 ? 'on' : ''}" style="flex:1;padding:8px" onclick="v3AdminSetPhase(2)">3. Ende</button>
              </div>

              <div class="v3-admin-editor-grid">
                <div id="v3AdminCanvasWrap" style="text-align:center">
                  ${renderInteractiveEditorSvg()}
                </div>

                <div style="flex:1;min-width:210px">
                  <div class="mu" style="font-size:12px;margin-bottom:4px">
                    <b>Gelenk direkt ziehen oder hier antippen & im Feld platzieren:</b>
                  </div>
                  <div class="r" id="v3AdminJointChips" style="gap:4px;margin-bottom:8px">
                    ${renderJointChipsHtml(fr)}
                  </div>

                  <div class="r" id="v3AdminLimbToggles" style="gap:6px;margin-bottom:8px">
                    <label class="chip" style="padding:5px 10px;font-size:12px"><input type="checkbox" ${fr.hasLeg2 ? 'checked' : ''} onchange="v3AdminToggleLimb2('leg2',this.checked)"> 🦵 2. Bein</label>
                    <label class="chip" style="padding:5px 10px;font-size:12px"><input type="checkbox" ${fr.hasArm2 ? 'checked' : ''} onchange="v3AdminToggleLimb2('arm2',this.checked)"> 💪 2. Arm</label>
                    <label class="chip" style="padding:5px 10px;font-size:12px"><input type="checkbox" ${fr.dumbbell ? 'checked' : ''} onchange="v3AdminToggleLimb2('dumbbell',this.checked)"> 🏋️ Hantel</label>
                  </div>

                  <div class="r" style="gap:6px;margin-bottom:8px">
                    <button type="button" class="chip" style="padding:5px 10px;font-size:12px" onclick="v3AdminAutoMidpoint()">✨ Übergang berechnen</button>
                    <button type="button" class="chip" style="padding:5px 10px;font-size:12px" onclick="v3AdminCopyPhase(0,2)">Start ➔ Ende</button>
                    <button type="button" class="chip" style="padding:5px 10px;font-size:12px" onclick="v3AdminFlipHorizontal()">↔️ Spiegeln</button>
                    <button type="button" class="chip" style="padding:5px 10px;font-size:12px" onclick="v3AdminResetPose()">🔄 Pose Reset</button>
                  </div>

                  <label class="mu" style="font-size:12px">Hilfsmittel im Bild (Wand, Stuhl, Stufe, Keil)</label>
                  <select style="font-size:13px;padding:6px;margin-bottom:8px" onchange="v3AdminAddPropPreset(this.value)">
                    <option value="">– Hilfsmittel-Vorlage wählen –</option>
                    ${Object.entries(PROP_PRESETS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}
                  </select>

                  <label class="mu" style="font-size:12px"><input id="v3AdmHasMidCb" type="checkbox" ${AD.hasMid ? 'checked' : ''} onchange="window.AD.hasMid=this.checked;v3RefreshAdminStudioDOM(false)"> Übergangs-Position im Übungsablauf speichern</label>
                </div>
              </div>

              <div style="margin-top:10px">
                <div class="mu" style="font-size:12px;text-align:center;margin-bottom:4px">Live-Vorschau (inkl. Echtzeit-Morphing für den User):</div>
                <div id="v3AdminPreviewWrap">${renderAdminLivePreviews()}</div>
              </div>

              <label class="mu" style="font-size:11px;margin-top:8px;display:block">Vektor-Code aktuelle Phase (kompatibel zu figSvg)
                <input id="v3AdminFigCode" style="font-family:monospace;font-size:11px;padding:5px" value="${esc(serializeFigData(fr))}" onchange="window.v3AdminApplyRawFigCode(this.value)">
              </label>
            </div>

            ${renderAdminRegionsBoxHtml()}
            ${renderAdminExecBoxHtml()}

            <div class="v3-admin-box">
              <b>📝 Text, Hashtags & Beispielvideos</b>
              <div class="r" style="margin-top:6px">
                <div style="flex:2;min-width:160px">
                  <label class="mu" style="font-size:12px">Name der Übung *</label>
                  <input value="${esc(AD.n)}" oninput="window.AD.n=this.value" placeholder="z. B. Bulgarische Kniebeuge">
                </div>
                <div style="flex:1;min-width:130px">
                  <label class="mu" style="font-size:12px">Kategorie</label>
                  <select onchange="window.AD.c=this.value">
                    ${['Kraft', 'Rumpf', 'Gleichgewicht', 'Mobilisation', 'Dehnung', 'Schnelligkeit', 'Fitnessstudio', 'Atmen', 'Denkfehler', 'Alltags-Hürden', 'Mentales Training'].map(c => `<option value="${c}" ${AD.c === c ? 'selected' : ''}>${c}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="r" style="margin-top:6px">
                <div style="flex:1;min-width:150px">
                  <label class="mu" style="font-size:12px">Aliasse (kommagetrennt)</label>
                  <input value="${esc(AD.al.join(', '))}" oninput="window.AD.al=this.value.split(',').map(s=>s.trim()).filter(Boolean)" placeholder="z. B. Bulgarian Split Squat, BSS">
                </div>
                <div style="flex:1;min-width:130px">
                  <label class="mu" style="font-size:12px">Material / Gerät</label>
                  <input value="${esc(AD.m)}" oninput="window.AD.m=this.value" placeholder="z. B. Bank, Kurzhanteln">
                </div>
              </div>

              <label class="mu" style="font-size:12px;margin-top:6px;display:block">Hashtags (komma- oder leerzeichengetrennt, durchsuchbar)</label>
              <input value="${esc(AD.tags.join(' '))}" oninput="window.AD.tags=this.value.split(/[\\s,]+/).map(s=>s.trim()).filter(Boolean).map(s=>s.startsWith('#')?s:'#'+s)" placeholder="#knie #reha #büro #beinkraft">

              <label class="mu" style="font-size:12px;margin-top:6px;display:block">Kurzbeschreibung</label>
              <textarea rows="2" oninput="window.AD.d=this.value" placeholder="Wichtigste Ausführungshinweise...">${esc(AD.d)}</textarea>

              <div class="r" style="margin-top:6px">
                <div style="flex:1"><label class="mu" style="font-size:12px">Startposition</label><input value="${esc(AD.s)}" oninput="window.AD.s=this.value"></div>
                <div style="flex:1"><label class="mu" style="font-size:12px">Übergangsposition (opt.)</label><input value="${esc(AD.mPos)}" oninput="window.AD.mPos=this.value"></div>
                <div style="flex:1"><label class="mu" style="font-size:12px">Endposition</label><input value="${esc(AD.e)}" oninput="window.AD.e=this.value"></div>
              </div>

              <label class="mu" style="font-size:12px;margin-top:6px;display:block">Gut bei / Ziel (steuert auch Muskel-Färbung)</label>
              <input id="v3Adm_g" value="${esc(AD.g)}" oninput="window.AD.g=this.value;v3RefreshAdminStudioDOM(false)">

              <label class="mu" style="font-size:12px;margin-top:6px;display:block">Eher nicht machen bei (Kontraindikationen)</label>
              <input value="${esc(AD.x)}" oninput="window.AD.x=this.value">

              <label class="mu" style="font-size:12px;margin-top:6px;display:block">Genauere Anleitung (optional)</label>
              <textarea rows="2" oninput="window.AD.l=this.value">${esc(AD.l)}</textarea>

              <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--bd)">
                <b style="font-size:13px">🎬 YouTube-Beispielvideos (${AD.ytList.length})</b>
                ${AD.ytList.map((v, i) => `
                  <div class="settingsRow" style="font-size:12px">
                    <span style="flex:1">▶ <b>${esc(v.t)}</b> (<code>${esc(v.id)}</code>)</span>
                    <button type="button" class="x" onclick="window.AD.ytList.splice(${i},1);render()">✕</button>
                  </div>
                `).join('')}
                <div class="r" style="margin-top:6px">
                  <input id="v3AdmYtUrl" style="flex:1;min-width:140px" placeholder="YouTube-URL oder ID (z. B. XQ0hB29DMpo)">
                  <input id="v3AdmYtTitle" style="flex:1;min-width:140px" placeholder="Videotitel (optional)">
                  <button type="button" class="chip" onclick="v3AdminAddYtRow()">+ Video</button>
                </div>
              </div>
            </div>

            <div class="r" style="gap:8px;margin-top:12px">
              <button type="button" class="b" style="flex:1" onclick="v3AdminSaveExercise()">💾 Übung im Katalog speichern (${esc(AD.id)})</button>
              <button type="button" class="b g" style="flex:1" onclick="v3AdminExportExercisesJson()">📥 exercises.json exportieren</button>
            </div>
          </div>
        </details>
      </div>`;
  }

  window.v3AdminApplyRawFigCode = function (val) {
    AD.frames[AD.activePhase] = parseFigString(val);
    syncDraftToPreviewEx();
    v3RefreshAdminStudioDOM(true);
  };

  // =========================================================================
  // 7. EINSTELLUNGEN STRUKTURIEREN (PUNKTE 3, 4, 5, 6)
  // - Alle Punkte einklappbar (<details>)
  // - Lokale Benachrichtigungen + Kalender-Erinnerung zusammengeführt
  // - Pläne sichern + Verlauf sichern + Plan duplizieren + Plan Bild/Druck-Export zusammengeführt
  // =========================================================================
  function wrapCardAsCollapsible(cardEl, key, customSummaryTitle) {
    if (!cardEl) return;
    // Falls die Karte bereits ein Top-Level <details> hat, nur den State synchronisieren
    const existingDetails = cardEl.querySelector(':scope > details');
    if (existingDetails) {
      if (S.ui.settingsOpen?.[key]) existingDetails.setAttribute('open', '');
      else existingDetails.removeAttribute('open');
      existingDetails.setAttribute('ontoggle', `d282ToggleSettings('${key}',this.open)`);
      if (customSummaryTitle) {
        const sum = existingDetails.querySelector(':scope > summary');
        if (sum) sum.innerHTML = customSummaryTitle;
      }
      return;
    }

    const h3 = cardEl.querySelector(':scope > h3');
    const titleHtml = customSummaryTitle || (h3 ? h3.innerHTML : 'Einstellung');
    if (h3) h3.remove();
    const inner = cardEl.innerHTML;
    const isOpen = !!S.ui.settingsOpen?.[key];
    cardEl.innerHTML = `
      <details ${isOpen ? 'open' : ''} ontoggle="d282ToggleSettings('${key}',this.open)">
        <summary style="font-weight:700;cursor:pointer">${titleHtml}</summary>
        <div style="margin-top:12px">${inner}</div>
      </details>`;
  }

  function buildPlanActionsForBackupCard() {
    if (!S.plans || !S.plans.length) {
      return `<p class="mu" style="font-size:13px;margin:8px 0">Noch keine eigenen Trainingspläne angelegt.</p>`;
    }
    return `
      <div style="margin-top:10px">
        <p class="mu" style="font-size:13px;margin:4px 0 8px">Einzelnen Plan duplizieren oder als Bild (PNG) bzw. Druck-Tabelle exportieren:</p>
        ${S.plans.map(p => `
          <div class="settingsRow" style="padding:6px 0;border-bottom:1px solid var(--bd)">
            <b style="flex:1;min-width:130px">${esc(p.name)} <small class="mu">(${esc(getPlanLevel(p))})</small></b>
            <button type="button" class="b g" style="padding:6px 10px;min-height:36px;font-size:12px" onclick="v3DuplicatePlan('${p.id}')">📋 Duplizieren</button>
            <button type="button" class="b g" style="padding:6px 10px;min-height:36px;font-size:12px" onclick="v3OpenPlanExportModal('${p.id}')">📤 Bild / Tabelle</button>
          </div>
        `).join('')}
      </div>`;
  }

  const _prevVSetAdmin = vSet;
  vSet = function () {
    const html = _prevVSetAdmin();
    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    const allCards = [...tpl.content.querySelectorAll(':scope > .c')];

    const findCard = regex => allCards.find(c => {
      const heading = c.querySelector(':scope > h3, :scope > details > summary')?.textContent || '';
      return regex.test(heading);
    });

    const getCardInnerBody = card => {
      if (!card) return '';
      const clone = card.cloneNode(true);
      const det = clone.querySelector(':scope > details');
      if (det) {
        det.querySelector(':scope > summary')?.remove();
        return det.innerHTML;
      }
      clone.querySelector(':scope > h3')?.remove();
      return clone.innerHTML;
    };

    // --- PUNKT 6: Lokale Benachrichtigungen + Kalender-Erinnerung zusammenführen ---
    const notifyCard = findCard(/Lokale Benachrichtigungen|Local notifications/i);
    const calendarCard = findCard(/Kalender-Erinnerung|Calendar reminder/i);
    if (notifyCard && calendarCard) {
      const notifyBody = getCardInnerBody(notifyCard);
      const calendarBody = getCardInnerBody(calendarCard);
      notifyCard.innerHTML = `
        <details ${S.ui.settingsOpen?.notifications ? 'open' : ''} ontoggle="d282ToggleSettings('notifications',this.open)">
          <summary style="font-weight:700;cursor:pointer">🔔 Benachrichtigungen & Kalender-Erinnerung</summary>
          <div style="margin-top:12px">
            <h4 style="margin:0 0 6px">📱 Lokale App-Benachrichtigungen</h4>
            ${notifyBody}
            <hr style="border:0;border-top:1px solid var(--bd);margin:16px 0">
            <h4 style="margin:0 0 6px">📅 Kalender-Eintrag (.ics Export & Google Kalender)</h4>
            ${calendarBody}
          </div>
        </details>`;
      calendarCard.remove();
    } else if (notifyCard) {
      wrapCardAsCollapsible(notifyCard, 'notifications', '🔔 Benachrichtigungen & Kalender-Erinnerung');
    } else if (calendarCard) {
      wrapCardAsCollapsible(calendarCard, 'notifications', '🔔 Benachrichtigungen & Kalender-Erinnerung');
    }

    // --- PUNKT 4 & 5: Pläne sichern + Verlauf sichern + Plan duplizieren + Bild/Tabelle Export zusammenführen ---
    const plansBackupCard = findCard(/Pläne sichern|Backup plans/i);
    const histBackupCard = findCard(/Verlauf sichern|Backup history/i);
    if (plansBackupCard || histBackupCard) {
      const targetCard = plansBackupCard || histBackupCard;
      const plansBody = getCardInnerBody(plansBackupCard);
      const histBody = getCardInnerBody(histBackupCard);
      targetCard.innerHTML = `
        <details ${S.ui.settingsOpen?.backupAll ? 'open' : ''} ontoggle="d282ToggleSettings('backupAll',this.open)">
          <summary style="font-weight:700;cursor:pointer">💾 Pläne & Verlauf sichern / exportieren</summary>
          <div style="margin-top:12px">
            <h4 style="margin:0 0 6px">📋 Trainingspläne duplizieren & als Bild / Druck-Tabelle exportieren</h4>
            ${buildPlanActionsForBackupCard()}
            <hr style="border:0;border-top:1px solid var(--bd);margin:14px 0">
            <h4 style="margin:0 0 6px">📦 Alle Pläne sichern & übertragen</h4>
            ${plansBody}
            <hr style="border:0;border-top:1px solid var(--bd);margin:14px 0">
            <h4 style="margin:0 0 6px">📈 Trainingsverlauf sichern & importieren</h4>
            ${histBody}
          </div>
        </details>`;
      if (plansBackupCard && histBackupCard) histBackupCard.remove();
    }

    // --- Admin-Studio vor Datenschutz/Impressum einfügen ---
    const remainingCards = [...tpl.content.querySelectorAll(':scope > .c')];
    const imprintCard = remainingCards.find(c => /Impressum|Imprint|Datenschutz|Privacy/i.test(c.textContent || ''));
    const adminWrap = document.createElement('template');
    adminWrap.innerHTML = renderAdminStudioCard();

    if (imprintCard) {
      imprintCard.before(adminWrap.content.firstElementChild);
    } else {
      tpl.content.appendChild(adminWrap.content.firstElementChild);
    }

    // --- PUNKT 3: Alle übrigen Einstellungskarten einklappbar machen ---
    const finalCards = [...tpl.content.querySelectorAll(':scope > .c')];
    finalCards.forEach((card, idx) => {
      if (card.querySelector(':scope > details')) return;
      const headingText = (card.querySelector(':scope > h3')?.textContent || '').trim();
      let key = 'sec_' + idx;
      let customTitle = null;
      if (/Darstellung|Appearance/i.test(headingText)) { key = 'appearance'; customTitle = '🎨 ' + headingText; }
      else if (/Gewicht|BMI/i.test(headingText)) { key = 'weight'; customTitle = '⚖️ ' + headingText; }
      else if (/^Training$|^Workout$/i.test(headingText)) { key = 'training'; customTitle = '🏋️ Training, Pause-Timer & Challenge'; }
      else if (/Serien-Schutz|Joker/i.test(headingText)) { key = 'pauseJoker'; }
      else if (/Widgets/i.test(headingText)) { key = 'widgets'; customTitle = '📱 ' + headingText; }
      else if (/Datenschutz|Privacy/i.test(headingText)) { key = 'privacy'; customTitle = '🔒 Datenschutz & Impressum'; }
      else if (/Übungskatalog & Online-Updates/i.test(headingText)) { key = 'catalogSync'; }
      wrapCardAsCollapsible(card, key, customTitle);
    });

    setTimeout(() => {
      bindAdminCanvasPointerEvents();
      startGlobalMorphLoop();
    }, 30);

    return tpl.innerHTML;
  };

  // --- 8. TRAININGSPLAN-EXPORT ALS BILD (PNG) & DRUCK-TABELLE ---
  function resolveSvgForCanvas(svgHtml) {
    const style = getComputedStyle(document.documentElement);
    const vars = {
      'var(--ac)': style.getPropertyValue('--ac').trim() || '#0f766e',
      'var(--ac2)': style.getPropertyValue('--ac2').trim() || '#ccfbf1',
      'var(--mc)': style.getPropertyValue('--mc').trim() || '#f97316',
      'var(--bb)': style.getPropertyValue('--bb').trim() || '#64748b',
      'var(--bd)': style.getPropertyValue('--bd').trim() || '#cbd5e1',
      'var(--mu)': style.getPropertyValue('--mu').trim() || '#64748b',
      'var(--tx)': style.getPropertyValue('--tx').trim() || '#1e293b',
      'var(--ok)': style.getPropertyValue('--ok').trim() || '#16a34a'
    };
    let out = svgHtml.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    Object.entries(vars).forEach(([k, v]) => {
      out = out.split(k).join(v);
    });
    return out;
  }

  function svgToImage(svgHtml) {
    return new Promise(resolve => {
      const img = new Image();
      const cleanSvg = resolveSvgForCanvas(svgHtml);
      const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  let lastGeneratedPlanCanvas = null;

  window.v3OpenPlanExportModal = async function (pid) {
    const p = S.plans.find(x => x.id === pid);
    if (!p) return;

    v27Modal(`
      <h2>📤 Plan exportieren: ${esc(p.name)}</h2>
      <p class="mu" style="margin:0 0 10px">Wähle zwischen einem hochauflösenden <b>Übungs-Bild (PNG)</b> für dein Smartphone/WhatsApp oder einer <b>Druck- & Physio-Tabelle</b> mit Notizspalte.</p>
      <div class="r" style="gap:8px;margin-bottom:12px">
        <button type="button" class="b" style="flex:1" onclick="v3DownloadPlanImage('${p.id}')">🖼️ Bild (PNG) speichern</button>
        <button type="button" class="b g" style="flex:1" onclick="v3SharePlanImage('${p.id}')">📲 Bild teilen</button>
        <button type="button" class="b g" style="flex:1" onclick="v3PrintPlanTable('${p.id}')">🖨️ Druck-Tabelle</button>
      </div>
      <div id="v3PlanImgPreviewWrap" style="text-align:center;padding:10px;border:1px solid var(--bd);border-radius:12px;background:var(--bg)">
        <span class="mu">Generiere Bild-Vorschau mit Übungs-Illustrationen...</span>
      </div>
    `, true);

    const canvas = await v3RenderPlanToCanvas(p);
    lastGeneratedPlanCanvas = canvas;
    const wrap = document.getElementById('v3PlanImgPreviewWrap');
    if (wrap && canvas) {
      wrap.innerHTML = `<img src="${canvas.toDataURL('image/png')}" alt="Trainingsplan Vorschau" style="max-width:100%;height:auto;border-radius:8px">`;
    }
  };

  async function v3RenderPlanToCanvas(p) {
    const scale = 2;
    const width = 820;
    const rowH = 104;
    const headerH = 115;
    const footerH = 44;
    const items = p.items.map(it => ({ raw: it, eff: effective(it, p), e: ex(it.ex) })).filter(x => !!x.e);
    const height = headerH + items.length * rowH + footerH;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    const isDark = document.documentElement.getAttribute('data-mode') === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark-gold';
    const bgCol = isDark ? '#12161f' : '#f8fafc';
    const cardCol = isDark ? '#1e2532' : '#ffffff';
    const txCol = isDark ? '#f1f5f9' : '#0f172a';
    const muCol = isDark ? '#94a3b8' : '#64748b';
    const acCol = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#0f766e';
    const bdCol = isDark ? '#334155' : '#e2e8f0';

    ctx.fillStyle = bgCol;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = acCol;
    ctx.fillRect(0, 0, width, 8);
    ctx.fillStyle = txCol;
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(p.name, 28, 46);

    const sched = p.days?.length ? p.days.map(d => DAYS[d]).join(', ') : `${p.pw || 1}× pro Woche (flexibel)`;
    ctx.fillStyle = muCol;
    ctx.font = '600 15px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Stufe: ${getPlanLevel(p)}  ·  Rhythmus: ${sched}  ·  ${items.length} Übungen`, 28, 74);

    ctx.strokeStyle = bdCol;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, 94);
    ctx.lineTo(width - 28, 94);
    ctx.stroke();

    for (let i = 0; i < items.length; i++) {
      const { eff, e } = items[i];
      const y = headerH + i * rowH - 6;

      ctx.fillStyle = cardCol;
      ctx.strokeStyle = bdCol;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(24, y, width - 48, rowH - 12, 12) : ctx.rect(24, y, width - 48, rowH - 12);
      ctx.fill();
      ctx.stroke();

      const f0 = e.fig?.[0];
      const f1 = e.fig?.[1] || f0;
      if (f0 && !f0.startsWith('BR')) {
        const img0 = await svgToImage(figSvg(f0, e));
        if (img0) ctx.drawImage(img0, 36, y + 10, 72, 72);
      }
      if (f1 && !f1.startsWith('BR')) {
        const img1 = await svgToImage(figSvg(f1, e));
        if (img1) ctx.drawImage(img1, 114, y + 10, 72, 72);
      }

      const textX = 202;
      ctx.fillStyle = txCol;
      ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
      const uniTag = window.v3IsUnilateral(e) ? ' (Links & Rechts)' : '';
      ctx.fillText(`${i + 1}. ${e.n}${uniTag}`, textX, y + 30);

      ctx.fillStyle = muCol;
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      const descShort = (e.d || '').length > 72 ? e.d.slice(0, 70) + '…' : (e.d || '');
      ctx.fillText(`${e.c}${e.m && e.m !== '–' ? ' · ' + e.m : ''} — ${descShort}`, textX, y + 52);

      if (e.g) {
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        const goalShort = e.g.length > 75 ? e.g.slice(0, 73) + '…' : e.g;
        ctx.fillText(`Ziel: ${goalShort}`, textX, y + 72);
      }

      const doseTxt = `${eff.sets} × ${eff.reps} ${window.v3Unit(e)}${+eff.kg ? ' · ' + eff.kg + ' kg' : ''}`;
      ctx.fillStyle = acCol;
      ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
      const tw = ctx.measureText(doseTxt).width;
      ctx.fillText(doseTxt, width - 42 - tw, y + 32);
    }

    ctx.fillStyle = muCol;
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Erstellt mit „BOND – Body & Mind Training“ · Stand: ${new Date().toLocaleDateString('de-AT')}`, 28, height - 16);

    return canvas;
  }

  window.v3DownloadPlanImage = async function (pid) {
    const p = S.plans.find(x => x.id === pid);
    if (!p) return;
    const canvas = lastGeneratedPlanCanvas || await v3RenderPlanToCanvas(p);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Trainingsplan-${p.name.replace(/[^A-Za-z0-9äöüÄÖÜß-]+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 2000);
    toast('🖼️ Trainingsplan als PNG gespeichert');
  };

  window.v3SharePlanImage = async function (pid) {
    const p = S.plans.find(x => x.id === pid);
    if (!p) return;
    const canvas = lastGeneratedPlanCanvas || await v3RenderPlanToCanvas(p);
    canvas.toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], `Trainingsplan-${p.name}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title: 'Trainingsplan: ' + p.name, files: [file] });
          return;
        } catch (_) {}
      }
      window.v3DownloadPlanImage(pid);
    }, 'image/png');
  };

  window.v3PrintPlanTable = function (pid) {
    const p = S.plans.find(x => x.id === pid);
    if (!p) return;
    v27CloseModal();

    const sched = p.days?.length ? p.days.map(d => DAYS[d]).join(', ') : `${p.pw || 1}× pro Woche (flexibel)`;
    const rowsHtml = p.items.map((rawIt, idx) => {
      const eff = effective(rawIt, p);
      const e = ex(eff.ex);
      if (!e) return '';
      const f0 = e.fig?.[0];
      const fMid = e.figMid || e.fig?.[2];
      const f1 = e.fig?.[1] || f0;
      const svg0 = f0 && !f0.startsWith('BR') ? `<div class="v3-print-svg">${figSvg(f0, e)}</div>` : '';
      const svgMid = fMid && !fMid.startsWith('BR') ? `<div class="v3-print-svg">${figSvg(fMid, e)}</div>` : '';
      const svg1 = f1 && !f1.startsWith('BR') ? `<div class="v3-print-svg">${figSvg(f1, e)}</div>` : '';

      return `
        <tr>
          <td style="font-weight:700;text-align:center">${idx + 1}</td>
          <td>
            <div style="display:flex;gap:6px;align-items:center">
              ${svg0}${svgMid}${svg1}
            </div>
          </td>
          <td>
            <b>${esc(e.n)}</b> ${window.v3IsUnilateral(e) ? '<small>(L/R je Seite)</small>' : ''}<br>
            <small>${esc(e.c)}${e.m && e.m !== '–' ? ' · ' + esc(e.m) : ''}</small><br>
            <small style="color:#475569">${esc(e.d || '')}</small>
          </td>
          <td style="white-space:nowrap;font-weight:700">
            ${eff.sets} × ${eff.reps} ${window.v3Unit(e)}<br>
            <small>${+eff.kg ? eff.kg + ' kg' : 'Eigengewicht'}</small>
          </td>
          <td style="min-width:140px"></td>
        </tr>`;
    }).join('');

    let printOv = document.getElementById('v3PrintOv');
    if (!printOv) {
      printOv = document.createElement('div');
      printOv.id = 'v3PrintOv';
      printOv.className = 'v3-print-overlay';
      document.body.appendChild(printOv);
    }
    printOv.style.display = 'block';
    printOv.innerHTML = `
      <div class="v3-print-sheet">
        <div class="v3-no-print r" style="justify-content:space-between;margin-bottom:16px">
          <button type="button" class="b" onclick="window.print()">🖨️ Jetzt drucken / Als PDF speichern</button>
          <button type="button" class="b g" onclick="document.getElementById('v3PrintOv').style.display='none'">✕ Schließen</button>
        </div>
        <h2 style="margin:0 0 4px">${esc(p.name)}</h2>
        <p style="margin:0 0 12px;color:#475569;font-size:14px">
          <b>Stufe:</b> ${esc(getPlanLevel(p))} · <b>Wochentage:</b> ${esc(sched)} · <b>Stand:</b> ${new Date().toLocaleDateString('de-AT')}
        </p>
        <table class="v3-print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ausführung (Start / Ende)</th>
              <th>Übung & Anleitung</th>
              <th>Sätze × Dosis</th>
              <th>Notizen / Physio / Datum</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>`;
  };

  render();
})();
