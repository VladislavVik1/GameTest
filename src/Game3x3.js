

export function initGame3x3(root) {

  const ASSET = (name) => new URL(`./assets/${name}`, import.meta.url).href;

  const moneyPng     = ASSET('money.png');
  const bombPng      = ASSET('bomb.png');
  const gemPng       = ASSET('gem.png');
  const lightPng     = ASSET('light.png');
  const stopPng      = ASSET('stop.png');
  const OfficePng    = ASSET('Office.png');
  const ResourcesPng = ASSET('Resource.png');
  const MaterialsPng = ASSET('Materials.png');
  const GoodsPng     = ASSET('Goods.png');
  const StockPng     = ASSET('Stock.png');


  const CELL_TYPES = { CASH: "cash", BOMB: "bomb", X2: "x2", ZERO: "zero", STOP: "stop" };

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const fmt = (n) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  const fmtCompact = (n) =>new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 0 }).format(Math.round(n));
  const el = (t, cls="", html="") => { const e=document.createElement(t); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; };
  const show = (node, v)=> node.classList.toggle("hidden", !v);
  const shuffle = (a) => {
    const arr=[...a];
    for (let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
    return arr;
  };

  const formatMoneyStep = (value) => {
    const steps = [100,150,200,250,300,350,400,450,500,1000,1500,2000,2500,3000,3500,4000,4500,5000,5500,6000,6500,7000,7500,8000,8500,9000,9500,10000,20000,50000,100000,200000,500000,1000000];
    const closest = steps.reduce((p,c)=> Math.abs(c-value)<Math.abs(p-value)?c:p);
    if (closest>=1_000_000) return (closest/1_000_000)+'M';
    if (closest>=1_000)     return (closest/1_000)+'K';
    return String(closest);
  };

  function createDeck() {
    const d = [
      ...Array(5).fill(CELL_TYPES.CASH),
      CELL_TYPES.BOMB,
      CELL_TYPES.X2,
      CELL_TYPES.ZERO,
      CELL_TYPES.STOP,
    ];
    return shuffle(d).map((t, i) => ({
      id: i,
      type: t,
      value: t === CELL_TYPES.CASH ? randomInt(100, 10000) : 0,
    }));
  }

  function countTypes(deck){
    const c={ cash:0,x2:0,zero:0,bomb:0,stop:0 };
    deck.forEach(card=>{
      if (card.type===CELL_TYPES.CASH) c.cash++;
      else if (card.type===CELL_TYPES.X2) c.x2++;
      else if (card.type===CELL_TYPES.ZERO) c.zero++;
      else if (card.type===CELL_TYPES.BOMB) c.bomb++;
      else if (card.type===CELL_TYPES.STOP) c.stop++;
    });
    return c;
  }


  let deck = createDeck();
  let revealed = Array(9).fill(false);
  let multiplier = 1;
  let baseBalance = 0;       
  let bombHit = false;
  let claimOpen = false;
  let bombOpen = false;
  let stopOpen = false;
  let started = false;
  let flash = false;

  const countsTotal = countTypes(deck);
  let countsFound = { cash:0,x2:0,zero:0,bomb:0,stop:0 };

  root.innerHTML = `
    <div class="h-screen w-full text-slate-100 overflow-y-auto flex justify-center items-start relative">
      <div class="absolute inset-0 bg-board-gradient"></div>
      <div class="absolute inset-0 stars"></div>

      <div class="relative w-full max-w-sm px-4 py-5">
        <div class="text-center mb-2">
          <div class="text-white/90 tracking-wide text-lg font-semibold">Roll Craft</div>
        </div>

        <div class="flex items-center justify-center gap-2 mb-4">
          <span id="multBox" class="px-2 py-1 rounded-lg bg-white/10 text-xs font-bold hidden"></span>
          <div id="balanceBox" class="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/20 border border-white/10 shadow">
            <img src="${moneyPng}" class="w-6 h-6" draggable="false"/>
            <div id="balanceVal" class="text-2xl font-extrabold counter-glow">0</div>
          </div>
        </div>

        <div id="boardWrap" class="relative rounded-3xl p-4 bg-black/20 backdrop-blur-sm border border-white/10">
          <div id="grid" class="grid grid-cols-3 gap-3 perspective"></div>

          <div class="mt-4 rounded-2xl bg-black/20 border border-white/10 px-3 py-2">
            <div id="panelCounts" class="flex items-center justify-center gap-4"></div>
          </div>
        </div>

        <button id="btnClaim" class="mt-4 w-full rounded-2xl bg-claim-btn py-3 font-semibold text-slate-900 shadow-btn disabled:opacity-50 disabled:shadow-none" disabled>
          Claim
        </button>

        <div class="mt-3 grid grid-cols-5 gap-2" id="navBar"></div>
      </div>

      <!-- Claim modal -->
      <div id="modalClaim" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/70" data-close="modalClaim"></div>
        <div class="relative z-10 w-full max-w-sm mx-auto mt-12 sm:mt-24 px-4">
          <div class="modal-panel">
            <h2 class="text-xl font-bold mb-1">Claim</h2>
            <div class="mb-3 text-sm text-white/70">Усе, що відкрито на цьому полі:</div>
            <div id="claimList" class="space-y-2 max-h-64 overflow-auto pr-1 text-left"></div>
            <div class="mt-4 flex items-center justify-between">
              <div class="text-white/80">Поточний баланс</div>
              <div id="claimBalance" class="text-2xl font-extrabold text-lime-300">0</div>
            </div>
            <div class="mt-4 flex justify-center">
              <button id="claimOk" class="rounded-2xl px-6 py-3 bg-claim-btn text-slate-900 font-semibold shadow-btn">OK</button>
              <button id="claimRestart" class="ml-2 rounded-2xl px-6 py-3 bg-white/10">Restart</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bomb modal -->
      <div id="modalBomb" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" data-close="modalBomb"></div>
        <div class="relative z-10 w-full max-w-sm mx-auto mt-12 sm:mt-24 px-4">
          <div class="rounded-[22px] p-6 text-center border border-white/10 shadow-xl overflow-hidden"
               style="background:
                 radial-gradient(80% 60% at 50% 0%, rgba(255,255,255,.08), transparent 60%),
                 radial-gradient(100% 80% at 50% 120%, rgba(255,255,255,.05), transparent 60%),
                 rgba(20,20,35,.72);">
            <h3 class="text-2xl font-extrabold mb-1 text-white" style="text-shadow:0 4px 18px rgba(255,80,80,.55)">Danger ahead!</h3>
            <p class="text-sm text-white/80 mb-4 max-w-xs mx-auto">You’re on a Bomb Square! You hit a bomb and lose all rewards from this field…</p>

            <div class="relative mx-auto mb-5 w-[364px] h-[260px] select-none">
              <div class="absolute inset-0 -z-20 rounded-[18px]
                          bg-[radial-gradient(circle_at_center,rgba(255,0,0,.55)_0%,rgba(255,0,0,.25)_38%,transparent_68%)]"></div>
              <img src="${lightPng}" class="absolute left-[34%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[115%] object-contain pointer-events-none -z-10" style="filter:hue-rotate(-20deg) saturate(4) brightness(1.2)" draggable="false"/>
              <img src="${bombPng}"  class="absolute left-[34%] top-[46%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 drop-shadow-[0_10px_20px_rgba(0,0,0,.45)] z-10" draggable="false"/>
              <img src="${moneyPng}" class="absolute left-[34%] -translate-x-1/2 w-[46px] h-[46px] drop-shadow-[0_6px_12px_rgba(0,0,0,.35)] z-10" style="top:65%" draggable="false"/>
              <div id="bombSum" class="absolute left-[34%] -translate-x-1/2 text-base font-extrabold text-white leading-none z-10" style="top:84%">0</div>
            </div>

            <p class="text-xs text-white/70 mb-5">…or defuse it and save your run!</p>
            <div class="flex gap-3">
              <button id="btnTakeHit" class="flex-1 rounded-2xl py-3 bg-gradient-to-b from-[#ff6a5f] to-[#e63c3c] text-white font-semibold shadow-[0_10px_24px_rgba(230,60,60,.45)] flex items-center justify-center gap-2">
                <img src="${bombPng}" class="w-5 h-5" draggable="false"/> Take a hit
              </button>
              <button id="btnDefuse" class="flex-1 rounded-2xl py-3 bg-gradient-to-r from-[#9a8cff] to-[#6d54ff] text-white font-semibold shadow-[0_10px_24px_rgba(109,84,255,.45)] flex items-center justify-center gap-2">
                <img src="${gemPng}" class="w-5 h-5 ml-1" draggable="false"/> Defuse for 49
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- STOP modal -->
      <div id="modalStop" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" data-close="modalStop"></div>
        <div class="relative z-10 w-full max-w-sm mx-auto mt-12 sm:mt-24 px-4">
          <div class="rounded-[22px] p-6 text-center border border-white/10 shadow-xl overflow-hidden"
               style="background:
                 radial-gradient(80% 60% at 50% 0%, rgba(255,255,255,.08), transparent 60%),
                 radial-gradient(100% 80% at 50% 120%, rgba(255,255,255,.05), transparent 60%),
                 rgba(20,20,35,.72);">
            <h3 class="text-2xl font-extrabold mb-1 text-white">Game over!</h3>
            <p class="text-sm text-white/80 mb-4">You’ve reached the end of this run…</p>

            <div class="relative mx-auto mb-5 w-[364px] h-[260px] select-none">
              <img src="${lightPng}" class="absolute left-[34%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[115%] object-contain pointer-events-none -z-10" draggable="false"/>
              <img src="${stopPng}"  class="absolute left-[34%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 drop-shadow-[0_6px_12px_rgba(0,0,0,.35)] z-10" draggable="false"/>
              <img src="${moneyPng}" class="absolute left-[34%] -translate-x-1/2 w-[46px] h-[46px] drop-shadow-[0_6px_12px_rgba(0,0,0,.35)] z-10" style="top:65%" draggable="false"/>
              <div id="stopSum" class="absolute left-[34%] -translate-x-1/2 text-base font-extrabold text-white leading-none z-10" style="top:83%">0</div>
            </div>

            <p class="text-xs text-white/70 mb-5">…claim and return to the main board</p>
            <button id="btnStopClaim" class="rounded-2xl px-6 py-3 bg-claim-btn text-slate-900 font-semibold shadow-btn">Claim</button>
          </div>
        </div>
      </div>
    </div>
  `;


  const gridEl        = root.querySelector("#grid");
  const panelCountsEl = root.querySelector("#panelCounts");
  const multBoxEl     = root.querySelector("#multBox");
  const balanceValEl  = root.querySelector("#balanceVal");
  const balanceBoxEl  = root.querySelector("#balanceBox");
  const btnClaimEl    = root.querySelector("#btnClaim");

  const modalClaim    = root.querySelector("#modalClaim");
  const modalBomb     = root.querySelector("#modalBomb");
  const modalStop     = root.querySelector("#modalStop");
  const claimListEl   = root.querySelector("#claimList");
  const claimBalEl    = root.querySelector("#claimBalance");
  const bombSumEl     = root.querySelector("#bombSum");
  const stopSumEl     = root.querySelector("#stopSum");

 
  function updateMultiplier(){
    multBoxEl.textContent = `x${multiplier}`;
    show(multBoxEl, multiplier>1);
  }

  function total() { return baseBalance * multiplier; }

  function updateBalanceDisplays(){
    const t = total();
    balanceValEl.textContent = fmt(t);
    claimBalEl.textContent   = fmt(t);
    bombSumEl.textContent    = fmtCompact(t);
    stopSumEl.textContent    = fmtCompact(t);
  }

  function PanelItem(iconSrc, count, active) {
    const wrap = el("div", `flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg ${active? "opacity-100" : "opacity-35 grayscale"}`);
    const img  = el("img", "w-6 h-6"); img.src = iconSrc; img.draggable=false;
    const txt  = el("span","text-sm font-semibold", String(count));
    wrap.append(img, txt);
    return wrap;
  }

  function renderPanelCounts(){
    panelCountsEl.innerHTML = "";
    const src = started ? countsFound : countsTotal;
    panelCountsEl.append(
      PanelItem(moneyPng, src.cash, !started || src.cash>0),
      PanelItem(gemPng,   src.x2,   !started || src.x2>0),
      PanelItem(lightPng, src.zero, !started || src.zero>0),
      PanelItem(bombPng,  src.bomb, !started || src.bomb>0),
      PanelItem(stopPng,  src.stop, !started || src.stop>0),
    );
  }

  function MoneyImg(cls="w-12 h-12"){ const i=el("img",cls); i.src=moneyPng; i.draggable=false; return i; }


  function cellFront() {
    const front = el("div","absolute inset-0 backface-hidden grid place-items-center rounded-2xl bg-cell-idle border border-white/10 shadow-card");
    const glyph = el("span","cell-glyph","$");
    front.append(glyph);
    return front;
  }

  function cellBack(card) {
    const base = "absolute inset-0 backface-hidden rotate-y-180 grid place-items-center rounded-2xl border border-black/20 shadow-card";
    if (card.type === CELL_TYPES.CASH) {
      const d = el("div", `${base} text-slate-900 font-bold text-m left-[8px] relative overflow-hidden`);
      d.style.width="100%"; d.style.height="100%"; d.style.borderRadius="12px";
      d.style.background = "linear-gradient(180deg,#a7ff6b 0%,#5fd137 50%,#2d8a12 100%)";
      const rays = el("img","absolute inset-0 object-contain pointer-events-none"); rays.src = lightPng;
      rays.style.transform = "scale(2.5) translateY(4px)";
      rays.style.filter = "hue-rotate(95deg) saturate(2) brightness(1.1)";
      rays.style.opacity = "0.95"; rays.draggable=false;
      const cont = el("div","relative z-10 flex items-center");
      cont.append(MoneyImg("w-5 h-5"), el("span","", `+${formatMoneyStep(card.value)}`));
      d.append(rays, cont);
      return d;
    }
    if (card.type === CELL_TYPES.X2) {
      return el("div", `${base} bg-cell-blue text-white font-extrabold text-xl`, "×2");
    }
    if (card.type === CELL_TYPES.ZERO) {
      const d = el("div", `${base} font-bold text-lg relative overflow-hidden`);
      d.style.width="100%"; d.style.height="100%"; d.style.borderRadius="12px";
      d.style.background = "linear-gradient(180deg,#ffe680 0%,#ffc233 50%,#b37700 100%)";
      const rays = el("img","absolute inset-0 object-contain pointer-events-none"); rays.src = lightPng;
      rays.style.transform = "scale(2.5) translateY(6px)";
      rays.style.filter = "hue-rotate(40deg) saturate(2) brightness(1.1)";
      rays.style.opacity = "0.95"; rays.draggable=false;
      const num = el("div","relative z-10 flex items-center justify-center w-full h-full",
        `<span class="text-4xl font-extrabold drop-shadow-[0_2px_2px_rgba(0,0,0,.5)]" style="transform:translateY(2px);color:#ffeb3b">0</span>`);
      d.append(rays,num);
      return d;
    }
    if (card.type === CELL_TYPES.STOP) {
      const d = el("div", `${base} text-white font-bold text-lg relative overflow-hidden`);
      d.style.width="100%"; d.style.height="100%"; d.style.borderRadius="12px";
      d.style.background = "linear-gradient(180deg,#ffe680 0%,#ffc233 50%,#b37700 100%)";
      const rays = el("img","absolute inset-0 object-contain pointer-events-none"); rays.src = lightPng;
      rays.style.transform = "scale(2.5) translateY(5px)";
      rays.style.filter = "hue-rotate(40deg) saturate(2) brightness(1.1)";
      rays.style.opacity = "0.95"; rays.draggable=false;
      const iconWrap = el("div","relative z-10 flex items-center justify-center w-full h-full");
      const ic = el("img","w-10 h-10 drop-shadow-[0_4px_6px_rgba(0,0,0,.4)]"); ic.src = stopPng; ic.draggable=false;
      iconWrap.append(ic);
      d.append(rays,iconWrap);
      return d;
    }

    const d = el("div", `${base} text-white font-bold text-lg relative overflow-hidden`);
    d.style.width="100%"; d.style.height="100%"; d.style.borderRadius="12px";
    d.style.background = "linear-gradient(180deg,#ff8a8a 0%,#ff4040 50%,#a60000 100%)";
    const rays = el("img","absolute inset-0 object-contain pointer-events-none"); rays.src = lightPng;
    rays.style.transform = "scale(2.5) translateY(5px)";
    rays.style.filter = "hue-rotate(-20deg) saturate(2) brightness(1.1)";
    rays.style.opacity = "0.95"; rays.draggable=false;
    const iconWrap = el("div","relative z-10 flex items-center justify-center w-full h-full");
    const ic = el("img","w-10 h-10 drop-shadow-[0_4px_6px_rgba(0,0,0,.4)]"); ic.src = bombPng; ic.style.transform="translateY(-3px)"; ic.draggable=false;
    iconWrap.append(ic);
    d.append(rays,iconWrap);
    return d;
  }

  function createCell(card, idx){
    const slot = el("div","relative preserve-3d select-none");
    const btn  = el("button","relative w-full aspect-square rounded-2xl outline-none focus:ring-2 ring-lime-300 overflow-hidden");
    btn.dataset.idx = idx;

    const flip = el("div","absolute inset-0 transition-transform duration-[550ms] ease-[cubic-bezier(.22,1,.36,1)] preserve-3d");
    flip.append(cellFront(), cellBack(card));
    btn.append(flip);
    btn.addEventListener("click", () => reveal(idx, flip));
    slot.append(btn);
    return slot;
  }

  function renderBoard(){
    gridEl.innerHTML = "";
    deck.forEach((card, idx)=>{
      const c = createCell(card, idx);
      if (revealed[idx]) c.querySelector(".absolute.inset-0").style.transform="rotateY(180deg)";
      gridEl.append(c);
    });
    root.querySelector("#boardWrap").classList.toggle("splash", flash);
  }


  function openAll(){
    revealed = Array(9).fill(true);
    renderBoard();
  }

  function reveal(idx, flipEl){
    if (revealed[idx] || bombHit || stopOpen) return;
    revealed[idx] = true;
    started = true;
    flipEl.style.transform = "rotateY(180deg)";

    const card = deck[idx];

 
    if (card.type===CELL_TYPES.CASH) countsFound.cash++;
    else if (card.type===CELL_TYPES.X2) countsFound.x2++;
    else if (card.type===CELL_TYPES.ZERO) countsFound.zero++;
    else if (card.type===CELL_TYPES.BOMB) countsFound.bomb++;
    else if (card.type===CELL_TYPES.STOP) countsFound.stop++;
    renderPanelCounts();


    if (card.type === CELL_TYPES.CASH) {
      baseBalance += card.value;
      updateBalanceDisplays();
      btnClaimEl.disabled = false;
      makeFly(idx);
      return;
    }
    if (card.type === CELL_TYPES.X2) {
      multiplier *= 2;
      updateMultiplier();
      updateBalanceDisplays();
      btnClaimEl.disabled = false;
      return;
    }
    if (card.type === CELL_TYPES.ZERO) {
      btnClaimEl.disabled = false;
      return;
    }
    if (card.type === CELL_TYPES.BOMB) {
      bombHit = true;
      flash = true;
      renderBoard();
      setTimeout(()=>{ flash=false; renderBoard(); openBomb(); }, 450);
      return;
    }
    if (card.type === CELL_TYPES.STOP) {
      openAll();
      openStop();
      return;
    }
  }

  function FlyingCoins(start, end, onComplete) {
    const delays = [0, 60, 120, 180, 240]; 
    let done = 0;
    delays.forEach((delay) => {
      const coin = el("img","pointer-events-none fixed top-0 left-0 z-[70] w-12 h-12");
      coin.src = moneyPng;
      coin.style.transform = `translate(${start.x}px,${start.y}px) scale(.95)`;
      coin.style.opacity = "0.95";
      document.body.appendChild(coin);
      setTimeout(()=>{
        coin.animate(
          [
            { transform:`translate(${start.x}px,${start.y}px) scale(.95)`, opacity:.95 },
            { transform:`translate(${end.x}px,${end.y}px) scale(.6)`,    opacity:0 }
          ],
          { duration: 900, easing: 'cubic-bezier(.22,1,.36,1)' }
        ).onfinish = () => {
          coin.remove();
          if (++done === delays.length && onComplete) onComplete();
        };
      }, delay);
    });
  }

  function makeFly(cellIndex) {
    const balRect = balanceBoxEl.getBoundingClientRect();
    const cellBtn = gridEl.querySelector(`[data-idx="${cellIndex}"]`);
    if (!cellBtn) return;
    const r = cellBtn.getBoundingClientRect();
    const start = { x: r.left + r.width/2, y: r.top + r.height/2 };
    const end   = { x: balRect.left + balRect.width/2, y: balRect.top + balRect.height/2 };
    FlyingCoins(start, end);
  }


  function fillClaimList(){
    const opened = deck.filter((_,i)=> revealed[i]);
    claimListEl.innerHTML = "";
    opened.forEach((c)=>{
      const row = el("div","flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2");
      const left= el("span","flex items-center gap-2 capitalize");
      if (c.type===CELL_TYPES.CASH) left.append(MoneyImg("w-12 h-12"));
      left.append(el("span","", c.type));
      const right = el("span","font-semibold", c.type===CELL_TYPES.CASH ? `+${fmt(c.value)} × ${multiplier}` : "");
      row.append(left,right);
      claimListEl.append(row);
    });
  }

  function openClaim(){
    claimOpen = true;
    fillClaimList();
    updateBalanceDisplays();
    show(modalClaim, true);
  }
  function closeClaim(){ claimOpen=false; show(modalClaim,false); }

  function openBomb(){ bombOpen=true; updateBalanceDisplays(); show(modalBomb,true); }
  function closeBomb(){ bombOpen=false; show(modalBomb,false); bombHit=false; }

  function openStop(){ stopOpen=true; updateBalanceDisplays(); show(modalStop,true); }
  function closeStop(){ stopOpen=false; show(modalStop,false); }


  btnClaimEl.addEventListener("click", openClaim);


  [modalClaim, modalBomb, modalStop].forEach(m=>{
    m.addEventListener("click",(e)=>{ const id=e.target.getAttribute("data-close"); if(id) show(root.querySelector("#"+id), false); });
  });

  root.querySelector("#claimOk").addEventListener("click", ()=> closeClaim());
  root.querySelector("#claimRestart").addEventListener("click", ()=>{
    reset(true);
    closeClaim();
  });

  root.querySelector("#btnStopClaim").addEventListener("click", ()=>{
    closeStop();
    openClaim();
  });

  root.querySelector("#btnTakeHit").addEventListener("click", ()=>{

    baseBalance = 0;
    multiplier = 1;
    updateMultiplier();
    updateBalanceDisplays();
    closeBomb();
  });

  root.querySelector("#btnDefuse").addEventListener("click", ()=>{
    const cost = 49;
    baseBalance = Math.max(0, baseBalance - cost/Math.max(1,multiplier)); 
    updateBalanceDisplays();
    closeBomb();
  });


  const navBar = root.querySelector("#navBar");
  [
    {img:OfficePng,label:"Office"},
    {img:ResourcesPng,label:"Resources"},
    {img:MaterialsPng,label:"Materials"},
    {img:GoodsPng,label:"Goods"},
    {img:StockPng,label:"Stock"},
  ].forEach(n=>{
    const b=el("button","flex flex-col items-center gap-1 rounded-xl px-2 py-2 bg-white/5 hover:bg-white/10 transition border border-white/10 shadow-card");
    const i=el("img","w-7 h-7"); i.src=n.img; i.draggable=false; i.alt=n.label;
    const s=el("span","text-[10px] text-white/70",n.label);
    b.append(i,s); navBar.append(b);
  });


  function reset(newDeck=true){
    if (newDeck) deck = createDeck();
    revealed = Array(9).fill(false);
    multiplier = 1;
    baseBalance = 0;
    bombHit = false;
    claimOpen = false;
    bombOpen = false;
    stopOpen = false;
    started = false;
    flash = false;
    countsFound = { cash:0,x2:0,zero:0,bomb:0,stop:0 };
    updateMultiplier();
    updateBalanceDisplays();
    renderPanelCounts();
    renderBoard();
    btnClaimEl.disabled = true;
  }

  injectOnce("flip3d-css", `
    .perspective { perspective: 900px; }
    .preserve-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
  `);

  function injectOnce(id, css){
    if (document.getElementById(id)) return;
    const s=document.createElement("style"); s.id=id; s.textContent=css; document.head.appendChild(s);
  }


  updateMultiplier();
  updateBalanceDisplays();
  renderPanelCounts();
  renderBoard();
}
