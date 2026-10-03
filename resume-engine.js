/* Résumé engine: one layout feeds the PDF and the on-screen preview; DOCX is built separately. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ResumeEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Content (final, as approved) ---------- */
  var R = {
    name: 'MOHIT KUMAR',
    role: 'Full-Stack Product Engineer',
    tagline: 'Screen to database to tests',
    contact: [
      [
        { t: 'Ahmedabad, India' },
        { t: '+91 91730 86652' },
        { t: 'mohit.bakugo@gmail.com', href: 'mailto:mohit.bakugo@gmail.com' }
      ],
      [
        { t: 'linkedin.com/in/mohitanimator9898', href: 'https://linkedin.com/in/mohitanimator9898' },
        { t: 'github.com/BAKUGOS1', href: 'https://github.com/BAKUGOS1' },
        { t: 'mohitstack.vercel.app', href: 'https://mohitstack.vercel.app' }
      ]
    ],
    summary: 'Full-stack product engineer who designs, builds and ships web and mobile products end to end: interface, API, database and automated tests. Three years in accounts operations bring a practical understanding of the business workflows that software must support.',
    experience: [
      {
        title: 'Software Engineer, Product & Support',
        org: 'Zybra Accounting Software',
        when: 'Nov 2025 – Present',
        bullets: [
          'Rebuilt the company website in Next.js, matching the live site one to one.',
          'Added a release gate: every build must pass lint, unit tests, Playwright end-to-end tests and a production build.',
          "Diagnose and resolve customer issues in the company's accounting software."
        ]
      },
      {
        title: 'Accounts and Office Operations',
        org: null,
        when: 'Oct 2022 – Oct 2025',
        bullets: [
          'Managed accounting, cashiering and bank reconciliation for high-volume stores across multiple companies.',
          'Maintained records on ERP and POS systems and trained new staff to use them.'
        ]
      }
    ],
    projects: [
      {
        n: '01', name: 'Phere', url: 'https://app.wrkly.in',
        kind: 'Wedding finance app · Web, Android, iOS', when: 'May 2026 – Present',
        stack: 'React, Supabase, PostgreSQL, Capacitor',
        bullets: [
          'Designed, built and shipped solo; live in production with active users, now at v3.0.0.',
          'Unified wedding budgets, expenses, vendors, guests, RSVPs and e-invites in one secure workspace.',
          'Secured data with Supabase Auth, roles and row-level security; added OCR and AI through Edge Functions.',
          'Built an encrypted offline outbox that syncs changes safely on reconnect.'
        ]
      },
      {
        n: '02', name: 'QaAgent-Pro', url: 'https://github.com/BAKUGOS1/QaAgent-Pro',
        kind: 'Open-source QA agent', when: 'Jun 2026',
        stack: 'TypeScript, Playwright, Node.js',
        bullets: [
          'Tests a custom enterprise CRM the way a human QA engineer would, across 56 deterministic scenarios.',
          'Splits the work across five roles: planner, risk analyst, executor, defect verifier and release judge.',
          'Writes only to verified staging, then delivers a go or no-go Excel report with evidence.'
        ]
      },
      {
        n: '03', name: 'Taazu', url: 'https://taazu.vercel.app',
        kind: 'Operations CRM · Client project', when: 'Sep 2026 – Present',
        stack: 'TypeScript, React, Next.js, Supabase',
        bullets: [
          'Built a custom CRM for a business owner running a drink-brand pilot in Ahmedabad.',
          'Brings live KPIs, supplier and buyer directories, budget tracking and a city map into one place.',
          'Added a spreadsheet importer with column matching, deduplication and undo.'
        ]
      }
    ],
    alsoBuilt: [
      { name: 'BeforeCode', url: 'https://github.com/BAKUGOS1/beforecode', desc: 'npm CLI for AI coding agents' },
      { name: 'CanvaSync', url: 'https://github.com/BAKUGOS1/canvasync', desc: 'real-time collaborative canvas' },
      { name: 'CaseSheet', url: 'https://github.com/BAKUGOS1/casesheet', desc: 'Smart India Hackathon project' }
    ],
    skills: [
      ['Languages', 'TypeScript, JavaScript, Go, Python, SQL'],
      ['Interface (Frontend)', 'React, Next.js, Vite, Tailwind CSS, shadcn/ui, Capacitor, PWA'],
      ['API (Backend)', 'Node.js, Supabase Edge Functions, REST, gRPC, Django'],
      ['Data', 'PostgreSQL, Supabase, Prisma, Drizzle, row-level security'],
      ['QA (Testing & CI)', 'Playwright, Vitest, axe accessibility testing, risk-based testing, GitHub Actions'],
      ['AI tooling', 'Claude Code, Codex, agent workflows, OCR pipelines'],
      ['Domain', 'Accounting, reconciliation, ERP, POS'],
      ['Spoken', 'English, Hindi, Gujarati']
    ],
    education: [
      { title: 'BCA (Bachelor of Computer Applications)', org: 'Monark University', when: '2022 – 2026' },
      { title: 'Higher Secondary, Commerce', org: 'Om Shanti Higher Secondary', when: '2022' }
    ]
  };

  /* ---------- Page + palette (from mohitstack.vercel.app, adapted for paper) ---------- */
  var PAGE = { w: 595.28, h: 841.89, ml: 42, mr: 42, mt: 38, mb: 30 };
  var COL = {
    ink: '#0a0a0a',     // portfolio ground, used as ink on paper
    body: '#24211d',
    muted: '#6d675e',   // warm grey, stands in for the site's 55% cream
    label: '#57524a',
    faint: '#a59e93',
    rule: '#e2ddd4',
    accent: '#d9622b',  // portfolio "work" tone
    link: '#b5451a'     // portfolio GitHub key
  };
  var FAM = { sans: 'GoogleSansFlex', mono: 'DisketMono' };
  var FONT_KEYS = {
    'GSF-R': ['sans', false], 'GSF-B': ['sans', true],
    'DM-R': ['mono', false], 'DM-B': ['mono', true]
  };
  function faceKey(font, bold) { return (font === 'mono' ? 'DM' : 'GSF') + (bold ? '-B' : '-R'); }

  function registerFonts(doc, fonts) {
    Object.keys(FONT_KEYS).forEach(function (k) {
      var f = FONT_KEYS[k];
      doc.addFileToVFS(k + '.ttf', fonts[k]);
      doc.addFont(k + '.ttf', FAM[f[0]], f[1] ? 'bold' : 'normal');
    });
  }

  function makeMeasurer(doc) {
    var cache = {};
    return function (text, font, bold, size) {
      var key = font + (bold ? 1 : 0) + '|' + text;
      var u = cache[key];
      if (u === undefined) {
        doc.setFont(FAM[font], bold ? 'bold' : 'normal');
        u = cache[key] = doc.getStringUnitWidth(text);
      }
      return u * size;
    };
  }

  /* ---------- Layout ---------- */
  function layout(measure, s) {
    var ops = [];
    var X = PAGE.ml, RX = PAGE.w - PAGE.mr, W = RX - X;
    var y = PAGE.mt;

    function S(font, bold, size, color, cs) {
      return { font: font, bold: bold, size: size * s, color: color, cs: (cs || 0) * s };
    }
    var st = {
      name: S('mono', true, 23, COL.ink, -0.7),
      role: S('sans', true, 10.6, COL.ink),
      tag: S('sans', true, 10.6, COL.accent),
      sepHead: S('sans', false, 10.6, COL.faint),
      contact: S('sans', false, 8.6, COL.body),
      contactSep: S('sans', false, 8.6, COL.faint),
      label: S('mono', true, 7.6, COL.label, 1.05),
      title: S('sans', true, 10, COL.ink),
      dash: S('sans', false, 10, COL.muted),
      org: S('sans', false, 10, COL.ink),
      date: S('mono', false, 7.2, COL.muted, 0.55),
      num: S('mono', true, 7.8, COL.accent, 0.3),
      pname: S('mono', true, 10.4, COL.ink, -0.2),
      kind: S('sans', false, 9.3, COL.muted),
      meta: S('sans', false, 8.5, COL.muted),
      url: S('sans', false, 8.5, COL.link),
      body: S('sans', false, 9.1, COL.body),
      bodySep: S('sans', false, 9.1, COL.faint),
      strong: S('sans', true, 9.1, COL.ink),
      bodyLink: S('sans', false, 9.1, COL.link),
      bullet: S('sans', true, 9.1, COL.accent)
    };
    var LH = { body: 12.6 * s, title: 13.4 * s, meta: 12 * s };

    function tw(text, t) { return measure(text, t.font, t.bold, t.size) + t.cs * text.length; }

    function drawText(text, t, x, yy, link) {
      ops.push({ type: 'text', text: text, x: x, y: yy, font: t.font, bold: t.bold, size: t.size, color: t.color, cs: t.cs });
      if (link) ops.push({ type: 'link', url: link, x: x, y: yy - t.size * 0.8, w: tw(text, t) - t.cs, h: t.size * 1.05 });
    }

    // Rich-text flow: breaks only at whitespace; returns baseline of the last line.
    function flow(runs, x0, y0, width, lh) {
      var items = [];
      runs.forEach(function (r) {
        r.t.split(/(\s+)/).forEach(function (piece) {
          if (!piece) return;
          var p = { s: piece, st: r.st, link: r.link || null, w: tw(piece, r.st) };
          var sp = /^\s+$/.test(piece);
          var last = items[items.length - 1];
          if (!sp && last && !last.sp) { last.pieces.push(p); last.w += p.w; }
          else items.push({ sp: sp, pieces: [p], w: p.w });
        });
      });
      var lines = [], line = [], lw = 0;
      items.forEach(function (it) {
        if (it.sp) { if (line.length) { line.push(it); lw += it.w; } return; }
        if (line.length && lw + it.w > width + 0.01) {
          while (line.length && line[line.length - 1].sp) lw -= line.pop().w;
          lines.push(line); line = []; lw = 0;
        }
        line.push(it); lw += it.w;
      });
      while (line.length && line[line.length - 1].sp) line.pop();
      if (line.length) lines.push(line);

      var yy = y0;
      lines.forEach(function (ln, i) {
        var pieces = [];
        ln.forEach(function (it) { pieces = pieces.concat(it.pieces); });
        var x = x0, j = 0;
        while (j < pieces.length) {
          var k = j, text = '';
          while (k < pieces.length && pieces[k].st === pieces[j].st && pieces[k].link === pieces[j].link) { text += pieces[k].s; k++; }
          drawText(text, pieces[j].st, x, yy, pieces[j].link);
          x += tw(text, pieces[j].st);
          j = k;
        }
        if (i < lines.length - 1) yy += lh;
      });
      return yy;
    }

    function section(label) {
      y += 10.5 * s;
      ops.push({ type: 'line', x1: X, y1: y, x2: RX, y2: y, color: COL.rule, lw: 0.6 });
      y += 11.5 * s;
      var t = st.label;
      ops.push({ type: 'rect', x: X, y: y - t.size * 0.35 - 0.8 * s, w: 7 * s, h: 1.6 * s, color: COL.accent });
      drawText(label.toUpperCase(), t, X + 11 * s, y);
      y += 13.6 * s;
    }

    function bullets(list) {
      list.forEach(function (b) {
        y += 12.9 * s;
        drawText('•', st.bullet, X + 1.2 * s, y);
        y = flow([{ t: b, st: st.body }], X + 10.5 * s, y, W - 10.5 * s, LH.body);
      });
    }

    // Title line with a right-aligned date; title is drawn first so extracted text reads in order.
    function titled(runs, when) {
      var date = when.toUpperCase();
      var dw = tw(date, st.date) - st.date.cs;
      var yT = y;
      y = flow(runs, X, y, W - dw - 14 * s, LH.title);
      drawText(date, st.date, RX - dw, yT);
    }

    /* Header */
    y += st.name.size * 0.72;
    drawText(R.name, st.name, X, y);
    y += 17 * s;
    y = flow([{ t: R.role, st: st.role }, { t: '  ·  ', st: st.sepHead }, { t: R.tagline, st: st.tag }], X, y, W, LH.body);
    y += 3 * s;
    R.contact.forEach(function (row) {
      y += 12.2 * s;
      var runs = [];
      row.forEach(function (c, i) {
        if (i) runs.push({ t: '  ·  ', st: st.contactSep });
        runs.push({ t: c.t, st: st.contact, link: c.href });
      });
      y = flow(runs, X, y, W, 12.2 * s);
    });

    /* Summary */
    section('Summary');
    y = flow([{ t: R.summary, st: st.body }], X, y, W, LH.body);

    /* Experience */
    section('Experience');
    R.experience.forEach(function (e, i) {
      if (i) y += 21 * s;
      var runs = [{ t: e.title, st: st.title }];
      if (e.org) runs.push({ t: ' — ', st: st.dash }, { t: e.org, st: st.org });
      titled(runs, e.when);
      bullets(e.bullets);
    });

    /* Projects */
    section('Projects');
    R.projects.forEach(function (p, i) {
      if (i) y += 22 * s;
      titled([
        { t: p.n + ' ', st: st.num },
        { t: p.name.toUpperCase(), st: st.pname },
        { t: '  —  ' + p.kind, st: st.kind }
      ], p.when);
      y += 12.4 * s;
      y = flow([{ t: p.url, st: st.url, link: p.url }, { t: '  ·  Stack: ' + p.stack, st: st.meta }], X, y, W, LH.meta);
      bullets(p.bullets);
    });
    y += 18 * s;
    var ab = [{ t: 'Also built: ', st: st.strong }];
    R.alsoBuilt.forEach(function (a, i) {
      if (i) ab.push({ t: '  ·  ', st: st.bodySep });
      ab.push({ t: a.name, st: st.strong }, { t: ' (', st: st.body }, { t: a.url, st: st.bodyLink, link: a.url }, { t: ', ' + a.desc + ')', st: st.body });
    });
    y = flow(ab, X, y, W, LH.body);

    /* Skills */
    section('Skills');
    R.skills.forEach(function (row, i) {
      if (i) y += 13.1 * s;
      y = flow([{ t: row[0] + ': ', st: st.strong }, { t: row[1], st: st.body }], X, y, W, LH.body);
    });

    /* Education */
    section('Education');
    R.education.forEach(function (e, i) {
      if (i) y += 14.2 * s;
      titled([{ t: e.title, st: st.title }, { t: ' — ', st: st.dash }, { t: e.org, st: st.org }], e.when);
    });

    return { ops: ops, bottom: y + 3 * s };
  }

  // Largest text scale that keeps everything on one A4 page (shrinks when content grows).
  var MAX_SCALE = 1.06;
  function fit(measure) {
    var limit = PAGE.h - PAGE.mb;
    var r = layout(measure, MAX_SCALE);
    if (r.bottom <= limit) return { s: MAX_SCALE, ops: r.ops, bottom: r.bottom, fits: true };
    var lo = 0.6, hi = MAX_SCALE;
    for (var i = 0; i < 16; i++) {
      var mid = (lo + hi) / 2;
      if (layout(measure, mid).bottom <= limit) lo = mid; else hi = mid;
    }
    var s = Math.floor(lo * 1000) / 1000;
    r = layout(measure, s);
    return { s: s, ops: r.ops, bottom: r.bottom, fits: r.bottom <= limit };
  }

  /* ---------- PDF ---------- */
  function drawPDF(doc, ops) {
    ops.forEach(function (o) {
      if (o.type === 'text') {
        doc.setFont(FAM[o.font], o.bold ? 'bold' : 'normal');
        doc.setFontSize(o.size);
        doc.setTextColor(o.color);
        if (doc.setCharSpace) doc.setCharSpace(o.cs || 0);
        doc.text(o.text, o.x, o.y, { charSpace: o.cs || 0, baseline: 'alphabetic' });
      } else if (o.type === 'rect') {
        doc.setFillColor(o.color);
        doc.rect(o.x, o.y, o.w, o.h, 'F');
      } else if (o.type === 'line') {
        doc.setDrawColor(o.color);
        doc.setLineWidth(o.lw);
        doc.line(o.x1, o.y1, o.x2, o.y2);
      } else if (o.type === 'link') {
        doc.link(o.x, o.y, o.w, o.h, { url: o.url });
      }
    });
    if (doc.setCharSpace) doc.setCharSpace(0);
  }

  function buildPDF(jsPDF, fonts) {
    var doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    registerFonts(doc, fonts);
    var res = fit(makeMeasurer(doc));
    doc.setProperties({
      title: 'Mohit Kumar – Résumé',
      subject: 'Full-Stack Product Engineer',
      author: 'Mohit Kumar',
      keywords: 'Full-Stack Product Engineer, React, Next.js, TypeScript, Node.js, Supabase, PostgreSQL, Playwright',
      creator: 'Mohit Kumar'
    });
    try { doc.setLanguage('en-IN'); } catch (e) { /* optional */ }
    drawPDF(doc, res.ops);
    return { doc: doc, scale: res.s, fits: res.fits, pages: doc.getNumberOfPages(), ops: res.ops };
  }

  /* ---------- Canvas preview (same ops as the PDF) ---------- */
  function drawCanvas(ctx, ops, k) {
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE.w, PAGE.h);
    ctx.textBaseline = 'alphabetic';
    ops.forEach(function (o) {
      if (o.type === 'text') {
        ctx.font = o.size + 'px "' + faceKey(o.font, o.bold) + '"';
        ctx.fillStyle = o.color;
        if (!o.cs) { ctx.fillText(o.text, o.x, o.y); return; }
        var x = o.x;
        for (var i = 0; i < o.text.length; i++) {
          var ch = o.text[i];
          ctx.fillText(ch, x, o.y);
          x += ctx.measureText(ch).width + o.cs;
        }
      } else if (o.type === 'rect') {
        ctx.fillStyle = o.color;
        ctx.fillRect(o.x, o.y, o.w, o.h);
      } else if (o.type === 'line') {
        ctx.strokeStyle = o.color;
        ctx.lineWidth = o.lw;
        ctx.beginPath(); ctx.moveTo(o.x1, o.y1); ctx.lineTo(o.x2, o.y2); ctx.stroke();
      }
    });
  }

  /* ---------- DOCX (plain, single column, for job portals) ---------- */
  function buildDOCX(JSZip) {
    var W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    var R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    var PG_W = 11906, MARGIN_X = 794, TAB = PG_W - 2 * MARGIN_X;
    var links = [];

    function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function run(t, o) {
      o = o || {};
      var pr = (o.style ? '<w:rStyle w:val="' + o.style + '"/>' : '') +
        (o.b ? '<w:b/><w:bCs/>' : '') +
        (o.color ? '<w:color w:val="' + o.color + '"/>' : '') +
        (o.sz ? '<w:sz w:val="' + o.sz + '"/><w:szCs w:val="' + o.sz + '"/>' : '');
      return '<w:r>' + (pr ? '<w:rPr>' + pr + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + esc(t) + '</w:t></w:r>';
    }
    function tab() { return '<w:r><w:tab/></w:r>'; }
    function link(url, text, o) {
      var id = 'rIdL' + (links.length + 1);
      links.push('<Relationship Id="' + id + '" Type="' + R_NS + '/hyperlink" Target="' + esc(url) + '" TargetMode="External"/>');
      var ro = Object.assign({}, o || {}, { style: 'Hyperlink' });
      return '<w:hyperlink r:id="' + id + '" w:history="1">' + run(text, ro) + '</w:hyperlink>';
    }
    function p(inner, o) {
      o = o || {};
      var pr = (o.style ? '<w:pStyle w:val="' + o.style + '"/>' : '') +
        (o.keepNext ? '<w:keepNext/>' : '') +
        (o.bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '') +
        (o.tabs ? '<w:tabs><w:tab w:val="right" w:pos="' + TAB + '"/></w:tabs>' : '') +
        (o.before || o.after ? '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after || 0) + '"/>' : '');
      return '<w:p>' + (pr ? '<w:pPr>' + pr + '</w:pPr>' : '') + inner + '</w:p>';
    }
    function heading(t) { return p(run(t), { style: 'Heading1' }); }

    var body = [];
    body.push(p(run(R.name, { b: true, sz: 32 }), { after: 20 }));
    body.push(p(run(R.role + ' · ' + R.tagline, { sz: 22 }), { after: 40 }));
    R.contact.forEach(function (row) {
      var inner = '';
      row.forEach(function (c, i) {
        if (i) inner += run(' · ');
        inner += c.href ? link(c.href, c.t) : run(c.t);
      });
      body.push(p(inner));
    });

    body.push(heading('SUMMARY'));
    body.push(p(run(R.summary)));

    body.push(heading('EXPERIENCE'));
    R.experience.forEach(function (e, i) {
      body.push(p(run(e.title, { b: true }) + (e.org ? run(' — ' + e.org) : '') + tab() + run(e.when),
        { tabs: true, keepNext: true, before: i ? 100 : 0 }));
      e.bullets.forEach(function (b) { body.push(p(run(b), { bullet: true })); });
    });

    body.push(heading('PROJECTS'));
    R.projects.forEach(function (pr, i) {
      body.push(p(run(pr.n + ' ' + pr.name, { b: true }) + run(' — ' + pr.kind) + tab() + run(pr.when),
        { tabs: true, keepNext: true, before: i ? 100 : 0 }));
      body.push(p(link(pr.url, pr.url) + run(' · Stack: ' + pr.stack), { keepNext: true }));
      pr.bullets.forEach(function (b) { body.push(p(run(b), { bullet: true })); });
    });
    var ab = run('Also built: ', { b: true });
    R.alsoBuilt.forEach(function (a, i) {
      if (i) ab += run(' · ');
      ab += run(a.name, { b: true }) + run(' (') + link(a.url, a.url) + run(', ' + a.desc + ')');
    });
    body.push(p(ab, { before: 100 }));

    body.push(heading('SKILLS'));
    R.skills.forEach(function (row) { body.push(p(run(row[0] + ': ', { b: true }) + run(row[1]))); });

    body.push(heading('EDUCATION'));
    R.education.forEach(function (e) {
      body.push(p(run(e.title, { b: true }) + run(' — ' + e.org) + tab() + run(e.when), { tabs: true }));
    });

    var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="' + W_NS + '" xmlns:r="' + R_NS + '"><w:body>' + body.join('') +
      '<w:sectPr><w:pgSz w:w="' + PG_W + '" w:h="16838"/><w:pgMar w:top="720" w:right="' + MARGIN_X + '" w:bottom="680" w:left="' + MARGIN_X + '" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>' +
      '</w:body></w:document>';

    var stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="' + W_NS + '">' +
      '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="en-IN"/></w:rPr></w:rPrDefault>' +
      '<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="245" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>' +
      '<w:pPr><w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="8C8C8C"/></w:pBdr><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="0"/></w:pPr>' +
      '<w:rPr><w:b/><w:bCs/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style>' +
      '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="1F4E79"/><w:u w:val="single"/></w:rPr></w:style>' +
      '</w:styles>';

    var numberingXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:numbering xmlns:w="' + W_NS + '"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>' +
      '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/>' +
      '<w:pPr><w:ind w:left="284" w:hanging="227"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr></w:lvl></w:abstractNum>' +
      '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>';

    var docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rIdS" Type="' + R_NS + '/styles" Target="styles.xml"/>' +
      '<Relationship Id="rIdN" Type="' + R_NS + '/numbering" Target="numbering.xml"/>' +
      links.join('') + '</Relationships>';

    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
      '</Types>';

    var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="' + R_NS + '/officeDocument" Target="word/document.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '<Relationship Id="rId3" Type="' + R_NS + '/extended-properties" Target="docProps/app.xml"/>' +
      '</Relationships>';

    var core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<dc:title>Mohit Kumar – Résumé</dc:title><dc:creator>Mohit Kumar</dc:creator><dc:subject>Full-Stack Product Engineer</dc:subject>' +
      '</cp:coreProperties>';
    var app = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office Word</Application></Properties>';

    var zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypes);
    zip.file('_rels/.rels', rootRels);
    zip.file('docProps/core.xml', core);
    zip.file('docProps/app.xml', app);
    zip.file('word/document.xml', documentXml);
    zip.file('word/styles.xml', stylesXml);
    zip.file('word/numbering.xml', numberingXml);
    zip.file('word/_rels/document.xml.rels', docRels);
    return zip;
  }

  return { RESUME: R, PAGE: PAGE, faceKey: faceKey, buildPDF: buildPDF, drawCanvas: drawCanvas, buildDOCX: buildDOCX };
});
