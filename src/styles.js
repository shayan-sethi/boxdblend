const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Mono:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#0a0905;--card:#131109;--card2:#1a1610;--border:#2a2418;
    --gold:#c9a84c;--gold-dim:#8a6f2e;--amber:#e8791a;
    --cream:#f0e8d8;--muted:#6b5d48;--red:#c94040;--green:#4a8c5c;
  }
  body{background:var(--bg);color:var(--cream);font-family:'DM Mono',monospace;min-height:100vh;
    background-image:radial-gradient(ellipse 80% 50% at 50% 0%,rgba(201,168,76,.07) 0%,transparent 70%);}
  .app{max-width:820px;margin:0 auto;padding:40px 20px 80px;}

  /* header */
  .hdr{text-align:center;margin-bottom:40px;animation:fadeUp .7s ease both;}
  .hdr-eye{font-size:10px;letter-spacing:.3em;color:var(--gold);text-transform:uppercase;margin-bottom:12px;}
  .hdr h1{font-family:'Playfair Display',serif;font-size:clamp(48px,9vw,84px);font-weight:900;line-height:.92;color:var(--cream);}
  .hdr h1 em{font-style:italic;color:var(--gold);}
  .hdr-sub{font-size:11px;color:var(--muted);letter-spacing:.1em;margin-top:12px;}
  .divider{width:56px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);margin:16px auto;}

  /* mode picker */
  .mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:32px;animation:fadeUp .7s .1s ease both;}
  .mode-btn{border:1px solid var(--border);background:var(--card);border-radius:4px;padding:28px 20px;cursor:pointer;
    text-align:left;transition:all .2s;color:var(--cream);}
  .mode-btn:hover{border-color:var(--gold-dim);background:var(--card2);}
  .mode-btn.active{border-color:var(--gold);background:var(--card2);}
  .mode-icon{font-size:28px;margin-bottom:10px;}
  .mode-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:4px;}
  .mode-desc{font-size:10px;color:var(--muted);letter-spacing:.08em;line-height:1.6;}

  /* panels */
  .panel{border:1px solid var(--border);background:var(--card);border-radius:4px;overflow:hidden;
    animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both;margin-bottom:16px;}
  .panel-head{padding:18px 22px 14px;border-bottom:1px solid var(--border);}
  .panel-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;}
  .panel-sub{font-size:10px;color:var(--muted);letter-spacing:.1em;margin-top:3px;}
  .panel-body{padding:20px 22px;}

  /* uploader */
  .uploader{border:1px solid var(--border);border-radius:3px;overflow:hidden;transition:border-color .2s;}
  .uploader:hover{border-color:var(--gold-dim);}
  .uploader.loaded{border-color:var(--gold);}
  .uploader.errored{border-color:var(--red);}
  .upl-name-wrap{padding:10px 14px 0;}
  .upl-label{font-size:9px;letter-spacing:.2em;color:var(--gold);text-transform:uppercase;margin-bottom:5px;}
  .upl-name-input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--border);
    color:var(--cream);font-family:'Playfair Display',serif;font-size:19px;font-style:italic;
    padding:4px 0 8px;outline:none;}
  .upl-name-input::placeholder{color:var(--muted);}
  .drop-zone{padding:18px 14px;text-align:center;cursor:pointer;transition:background .2s;}
  .drop-zone:hover{background:rgba(201,168,76,.04);}
  .drop-icon{font-size:22px;margin-bottom:5px;opacity:.65;}
  .drop-text{font-size:10px;color:var(--muted);letter-spacing:.07em;}
  .drop-text span{color:var(--gold);}
  .file-ok{display:flex;align-items:center;gap:8px;padding:10px 14px;
    background:rgba(74,140,92,.08);border-top:1px solid rgba(74,140,92,.2);}
  .file-ok-dot{width:6px;height:6px;border-radius:50%;background:var(--green);flex-shrink:0;}
  .file-ok-name{font-size:10px;color:var(--green);}
  .file-ok-count{font-size:9px;color:var(--muted);}
  .file-err{display:flex;align-items:center;gap:8px;padding:10px 14px;
    background:rgba(201,64,64,.08);border-top:1px solid rgba(201,64,64,.2);font-size:10px;color:var(--red);}

  /* code display */
  .code-box{border:1px solid var(--gold-dim);border-radius:4px;padding:28px 24px;text-align:center;
    background:linear-gradient(135deg,var(--card2),var(--card));position:relative;overflow:hidden;}
  .code-box::before{content:'';position:absolute;inset:0;
    background:radial-gradient(ellipse 60% 60% at 50% 100%,rgba(201,168,76,.06),transparent);pointer-events:none;}
  .code-eye{font-size:9px;letter-spacing:.25em;color:var(--muted);text-transform:uppercase;margin-bottom:10px;}
  .code-val{font-family:'Playfair Display',serif;font-size:52px;font-weight:900;color:var(--gold);
    letter-spacing:.15em;line-height:1;}
  .code-hint{font-size:10px;color:var(--muted);margin-top:10px;line-height:1.7;}
  .copy-btn{margin-top:14px;padding:10px 22px;background:transparent;border:1px solid var(--gold-dim);
    color:var(--gold);font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.2em;
    text-transform:uppercase;cursor:pointer;border-radius:2px;transition:all .18s;}
  .copy-btn:hover{background:var(--gold);color:var(--bg);}
  .copy-btn.copied{background:var(--green);border-color:var(--green);color:#fff;}

  /* code input */
  .code-input-wrap{display:flex;gap:8px;margin-bottom:4px;}
  .code-input{flex:1;background:var(--card2);border:1px solid var(--border);border-radius:3px;
    color:var(--cream);font-family:'Playfair Display',serif;font-size:28px;font-weight:700;
    letter-spacing:.15em;text-align:center;padding:12px 16px;outline:none;text-transform:uppercase;
    transition:border-color .2s;}
  .code-input:focus{border-color:var(--gold);}
  .code-input::placeholder{color:var(--muted);font-size:16px;letter-spacing:.05em;}
  .join-btn{padding:12px 20px;background:var(--gold);color:var(--bg);border:none;cursor:pointer;
    font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;
    border-radius:3px;transition:all .18s;white-space:nowrap;}
  .join-btn:hover{background:var(--amber);}
  .join-btn:disabled{opacity:.3;cursor:not-allowed;}
  .join-err{font-size:10px;color:var(--red);margin-top:6px;}
  .join-info{font-size:10px;color:var(--muted);margin-top:6px;line-height:1.6;}

  /* waiting state */
  .waiting-box{border:1px dashed var(--border);border-radius:4px;padding:32px 24px;text-align:center;}
  .waiting-spinner{font-size:28px;animation:spin 2s linear infinite;display:inline-block;margin-bottom:12px;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .waiting-title{font-family:'Playfair Display',serif;font-size:20px;font-style:italic;margin-bottom:6px;}
  .waiting-sub{font-size:10px;color:var(--muted);letter-spacing:.08em;line-height:1.7;}

  /* action buttons */
  .action-btn{display:block;width:100%;padding:16px;background:var(--gold);color:var(--bg);
    font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.28em;
    text-transform:uppercase;border:none;cursor:pointer;transition:all .2s;border-radius:2px;margin-top:14px;}
  .action-btn:hover{background:var(--amber);transform:translateY(-1px);}
  .action-btn:disabled{opacity:.3;cursor:not-allowed;transform:none;}
  .action-btn.ghost{background:transparent;border:1px solid var(--border);color:var(--muted);}
  .action-btn.ghost:hover{border-color:var(--gold);color:var(--gold);transform:none;}

  /* friend ready banner */
  .friend-banner{display:flex;align-items:center;gap:12px;padding:14px 18px;
    background:rgba(74,140,92,.09);border:1px solid rgba(74,140,92,.25);border-radius:3px;margin-bottom:14px;}
  .friend-banner-dot{width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0;
    animation:pulse 1.5s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
  .friend-banner-text{font-size:11px;color:var(--green);}

  /* card reveal */
  .reveal-card{animation:cardIn .52s cubic-bezier(.22,1,.36,1) both;}
  @keyframes cardIn{from{opacity:0;transform:translateY(22px) scale(.985);}to{opacity:1;transform:none;}}
  .card-nav{display:flex;align-items:center;justify-content:space-between;margin-top:16px;gap:10px;}
  .card-pips{display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:center;}
  .pip{width:20px;height:3px;border-radius:2px;background:var(--border);transition:background .3s;cursor:pointer;}
  .pip.active{background:var(--gold);}
  .pip.done{background:var(--gold-dim);}
  .nav-btn{padding:11px 20px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.2em;
    text-transform:uppercase;border:1px solid var(--border);background:transparent;color:var(--cream);
    cursor:pointer;transition:all .18s;border-radius:2px;white-space:nowrap;}
  .nav-btn:hover{border-color:var(--gold);color:var(--gold);}
  .nav-btn.primary{background:var(--gold);color:var(--bg);border-color:var(--gold);}
  .nav-btn.primary:hover{background:var(--amber);border-color:var(--amber);}
  .nav-btn:disabled{opacity:.2;cursor:not-allowed;}
  .card-counter{text-align:center;font-size:10px;color:var(--muted);letter-spacing:.12em;margin-top:12px;}

  /* score hero */
  .score-hero{border:1px solid var(--border);background:var(--card);border-radius:4px;
    padding:52px 32px 44px;text-align:center;position:relative;overflow:hidden;}
  .score-hero::before{content:'';position:absolute;inset:0;
    background:radial-gradient(ellipse 70% 80% at 50% 110%,rgba(201,168,76,.09),transparent);pointer-events:none;}
  .s-eye{font-size:10px;letter-spacing:.3em;color:var(--muted);text-transform:uppercase;margin-bottom:10px;}
  .s-num{font-family:'Playfair Display',serif;font-size:clamp(76px,15vw,120px);font-weight:900;line-height:1;color:var(--gold);}
  .s-pct{font-size:.38em;vertical-align:top;margin-top:16px;display:inline-block;}
  .s-lbl{font-family:'Playfair Display',serif;font-style:italic;font-size:21px;color:var(--cream);margin-top:8px;}
  .s-names{font-size:11px;color:var(--muted);letter-spacing:.15em;margin-top:8px;}
  .s-bar-wrap{max-width:260px;margin:16px auto 0;height:3px;background:var(--border);border-radius:2px;overflow:hidden;}
  .s-bar-fill{height:100%;background:linear-gradient(90deg,var(--gold-dim),var(--gold));transition:width 1.2s cubic-bezier(.4,0,.2,1);}

  /* stat cards */
  .sc{border:1px solid var(--border);background:var(--card);border-radius:4px;overflow:hidden;}
  .sc-head{padding:18px 22px 14px;border-bottom:1px solid var(--border);}
  .sc-title{font-family:'Playfair Display',serif;font-size:21px;font-weight:700;}
  .sc-sub{font-size:10px;color:var(--muted);letter-spacing:.1em;margin-top:3px;}
  .sc-body{padding:18px 22px;}
  .qs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
  .qs-item{border:1px solid var(--border);background:var(--card2);border-radius:3px;padding:16px 12px;text-align:center;}
  .qs-num{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:var(--gold);line-height:1;}
  .qs-label{font-size:9px;letter-spacing:.16em;color:var(--muted);text-transform:uppercase;margin-top:5px;line-height:1.4;}

  /* film rows */
  .film-list{display:flex;flex-direction:column;gap:2px;}
  .film-row{display:flex;align-items:center;gap:10px;padding:8px;border-radius:3px;transition:background .15s;}
  .film-row:hover{background:rgba(201,168,76,.05);}
  .film-rank{font-size:10px;color:var(--muted);width:16px;text-align:right;flex-shrink:0;}
  .film-info{flex:1;min-width:0;}
  .film-title{font-family:'Playfair Display',serif;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .film-year{font-size:10px;color:var(--muted);margin-top:1px;}
  .film-ratings{display:flex;gap:12px;flex-shrink:0;}
  .film-rating{display:flex;flex-direction:column;align-items:center;gap:1px;}
  .film-rating-val{font-size:12px;color:var(--gold);}
  .film-rating-who{font-size:9px;color:var(--muted);}

  /* clash rows */
  .clash-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid var(--border);}
  .clash-row:last-child{border-bottom:none;}
  .clash-info{flex:1;min-width:0;}
  .clash-title{font-family:'Playfair Display',serif;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .clash-year{font-size:10px;color:var(--muted);margin-top:2px;}
  .clash-ratings{display:flex;align-items:center;gap:8px;flex-shrink:0;}
  .clash-r{display:flex;flex-direction:column;align-items:center;min-width:42px;}
  .clash-r-stars{font-size:12px;}
  .clash-r-who{font-size:9px;color:var(--muted);margin-top:1px;}
  .clash-arrow{font-size:10px;color:var(--border);}
  .clash-delta{font-size:11px;padding:2px 7px;border-radius:2px;background:rgba(201,64,64,.13);color:var(--red);font-weight:500;flex-shrink:0;}

  /* two col */
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
  .col-label{font-family:'Playfair Display',serif;font-style:italic;font-size:15px;color:var(--gold);margin-bottom:10px;}

  /* decade bars */
  .decade-row{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
  .decade-lbl{font-size:10px;color:var(--muted);width:44px;flex-shrink:0;}
  .decade-bars{flex:1;display:flex;flex-direction:column;gap:3px;}
  .decade-bar-line{display:flex;align-items:center;gap:5px;}
  .decade-who{font-size:9px;color:var(--muted);width:16px;}
  .decade-track{flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden;}
  .decade-fill{height:100%;border-radius:3px;transition:width .9s cubic-bezier(.4,0,.2,1);}
  .decade-count{font-size:9px;color:var(--muted);width:26px;text-align:right;}

  /* highlight boxes */
  .hbox{border:1px solid var(--border);border-radius:3px;padding:14px 16px;background:var(--card2);
    display:flex;align-items:flex-start;gap:12px;}
  .hbox-icon{font-size:24px;flex-shrink:0;padding-top:2px;}
  .hbox-label{font-size:9px;letter-spacing:.15em;color:var(--muted);text-transform:uppercase;margin-bottom:3px;}
  .hbox-val{font-family:'Playfair Display',serif;font-size:16px;line-height:1.3;}
  .hbox-sub{font-size:10px;color:var(--muted);margin-top:3px;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}

  @media(max-width:560px){
    .mode-grid{grid-template-columns:1fr;}
    .qs-grid{grid-template-columns:1fr 1fr;}
    .two-col{grid-template-columns:1fr;}
  }
`;

export default css;
