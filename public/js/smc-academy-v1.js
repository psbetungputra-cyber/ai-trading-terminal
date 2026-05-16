(function () {
  const modules = [
    {
      no: "01",
      title: "Market Structure: HH, HL, LH, LL",
      chart: "structure",
      body: `
        <p>Market structure adalah cara membaca arah market dari swing high dan swing low. Sebelum entry, trader harus tahu market sedang bullish, bearish, atau range.</p>
        <ul>
          <li><b>HH / Higher High:</b> high baru lebih tinggi dari high sebelumnya.</li>
          <li><b>HL / Higher Low:</b> low baru lebih tinggi dari low sebelumnya.</li>
          <li><b>LH / Lower High:</b> high baru lebih rendah dari high sebelumnya.</li>
          <li><b>LL / Lower Low:</b> low baru lebih rendah dari low sebelumnya.</li>
        </ul>
        <p class="muted">Cara pakai: gunakan H4/M30 untuk membaca arah besar, lalu M15/M5/M1 untuk mencari entry.</p>
      `
    },
    {
      no: "02",
      title: "BOS & CHoCH",
      chart: "bos",
      body: `
        <p><b>BOS</b> atau Break of Structure adalah saat harga mematahkan struktur penting searah trend. <b>CHoCH</b> atau Change of Character adalah tanda awal perubahan karakter market.</p>
        <ul>
          <li><b>BOS bullish:</b> harga menembus high penting dan trend naik berpotensi lanjut.</li>
          <li><b>BOS bearish:</b> harga menembus low penting dan trend turun berpotensi lanjut.</li>
          <li><b>CHoCH:</b> struktur kecil mulai berubah arah setelah sweep/rejection.</li>
        </ul>
        <p class="muted">Kesalahan umum: menganggap semua breakout sebagai BOS valid. Tunggu candle close, displacement, dan konteks liquidity.</p>
      `
    },
    {
      no: "03",
      title: "Liquidity: Internal, External, BSL, SSL",
      chart: "liquidity",
      body: `
        <p>Liquidity adalah area tempat banyak order dan stop loss terkumpul. Market sering bergerak ke area liquidity sebelum melanjutkan trend atau reversal.</p>
        <ul>
          <li><b>Internal Liquidity:</b> liquidity kecil di dalam range atau struktur sementara.</li>
          <li><b>External Liquidity:</b> liquidity besar di luar swing high/low utama.</li>
          <li><b>Buy Side Liquidity / BSL:</b> stop loss seller yang berada di atas high.</li>
          <li><b>Sell Side Liquidity / SSL:</b> stop loss buyer yang berada di bawah low.</li>
        </ul>
        <p class="muted">Cara pakai: jangan entry sebelum tahu liquidity mana yang kemungkinan sedang ditarget market.</p>
      `
    },
    {
      no: "04",
      title: "Liquidity Sweep / Liquidity Grab",
      chart: "sweep",
      body: `
        <p>Liquidity sweep terjadi ketika harga mengambil high/low penting lalu rejection dan bergerak berlawanan. Ini sering terlihat seperti false breakout.</p>
        <ul>
          <li><b>Sweep high:</b> harga ambil liquidity di atas high lalu turun.</li>
          <li><b>Sweep low:</b> harga ambil liquidity di bawah low lalu naik.</li>
          <li><b>Liquidity grab:</b> pergerakan cepat untuk mengambil stop loss sebelum arah utama muncul.</li>
        </ul>
        <p class="muted">Cara pakai: tunggu sweep, rejection candle, lalu cari CHoCH/BOS kecil di timeframe rendah.</p>
      `
    },
    {
      no: "05",
      title: "Inducement",
      chart: "inducement",
      body: `
        <p>Inducement adalah pancingan. Market membuat setup terlihat valid agar trader retail masuk terlalu cepat, lalu harga mengambil liquidity mereka sebelum bergerak ke POI utama.</p>
        <ul>
          <li>Biasanya muncul sebelum harga menyentuh order block/FVG utama.</li>
          <li>Sering berupa break kecil atau retest yang terlihat menarik.</li>
          <li>Trader yang entry terlalu cepat biasanya kena stop loss dulu.</li>
        </ul>
        <p class="muted">Cara pakai: jangan buru-buru entry di POI pertama. Lihat apakah masih ada liquidity yang belum diambil.</p>
      `
    },
    {
      no: "06",
      title: "FVG / Imbalance",
      chart: "fvg",
      body: `
        <p><b>FVG</b> atau Fair Value Gap adalah area imbalance yang muncul saat harga bergerak impulsif. Area ini sering menjadi tempat retest sebelum continuation.</p>
        <ul>
          <li><b>Bullish FVG:</b> imbalance setelah candle dorongan naik.</li>
          <li><b>Bearish FVG:</b> imbalance setelah candle dorongan turun.</li>
          <li><b>FVG valid:</b> muncul bersama displacement, BOS/CHoCH, dan searah bias.</li>
        </ul>
        <p class="muted">Kesalahan umum: entry di semua FVG. Pilih FVG yang punya konteks liquidity dan struktur jelas.</p>
      `
    },
    {
      no: "07",
      title: "Order Block & Mitigation",
      chart: "ob",
      body: `
        <p>Order Block adalah area candle terakhir sebelum harga bergerak impulsif dan mematahkan struktur. OB yang bagus biasanya punya displacement kuat setelahnya.</p>
        <ul>
          <li><b>Bullish OB:</b> area demand sebelum impuls naik.</li>
          <li><b>Bearish OB:</b> area supply sebelum impuls turun.</li>
          <li><b>Mitigation:</b> harga kembali ke OB untuk mengambil order sebelum lanjut.</li>
        </ul>
        <p class="muted">OB bukan sembarang candle. Harus ada reaksi kuat, liquidity context, dan struktur yang mendukung.</p>
      `
    },
    {
      no: "08",
      title: "Premium, Discount & Equilibrium",
      chart: "pd",
      body: `
        <p>Premium dan discount dipakai untuk mencari harga yang lebih ideal. Dalam bullish bias, buy lebih bagus di area discount. Dalam bearish bias, sell lebih bagus di area premium.</p>
        <ul>
          <li><b>Premium:</b> area harga mahal, ideal untuk sell saat bearish.</li>
          <li><b>Discount:</b> area harga murah, ideal untuk buy saat bullish.</li>
          <li><b>Equilibrium:</b> area tengah 50%, bukan zona entry terbaik.</li>
        </ul>
        <p class="muted">Cara pakai: tarik swing high ke swing low, lalu lihat area 50% sebagai pembatas premium/discount.</p>
      `
    },
    {
      no: "09",
      title: "Entry Model: HTF ke LTF",
      chart: "entry",
      body: `
        <p>Entry model adalah alur dari timeframe besar ke timeframe kecil. Tujuannya agar entry tidak asal dan tetap mengikuti struktur market.</p>
        <ul>
          <li><b>H4/M30:</b> tentukan bias utama dan area POI.</li>
          <li><b>M15:</b> tunggu harga masuk area POI.</li>
          <li><b>M5/M1:</b> tunggu sweep, CHoCH/BOS kecil, lalu entry.</li>
          <li><b>SL:</b> di luar area invalidation, bukan terlalu dekat.</li>
        </ul>
        <p class="muted">Alur sederhana: bias → liquidity → POI → sweep → confirmation → entry.</p>
      `
    },
    {
      no: "10",
      title: "Trade Checklist",
      chart: "checklist",
      body: `
        <div class="smc-checklist">
          <label><input type="checkbox"> HTF bias sudah jelas</label>
          <label><input type="checkbox"> Liquidity sudah diambil</label>
          <label><input type="checkbox"> Ada POI: OB / FVG / Supply Demand</label>
          <label><input type="checkbox"> Ada CHoCH atau BOS kecil di LTF</label>
          <label><input type="checkbox"> Entry tidak mepet high impact news</label>
          <label><input type="checkbox"> Risk reward minimal 1:2</label>
        </div>
        <p class="muted">Checklist ini membantu user tidak entry berdasarkan feeling saja. Kalau banyak poin belum valid, lebih aman tunggu setup berikutnya.</p>
      `
    }
  ];


  function chart(type) {
    const data = {
      structure: {
        label: "Bullish structure",
        zone: "",
        candles: [[28,118,132,88,92,1],[58,92,98,80,84,1],[88,84,116,82,110,0],[118,110,116,74,78,1],[148,78,88,66,70,1],[178,70,96,68,90,0],[208,90,96,54,58,1],[238,58,82,52,76,0],[268,76,82,38,42,1]],
        notes: [["HH",142,62],["HL",174,110],["HH",262,34]]
      },
      bos: {
        label: "Break structure",
        zone: '<line class="level" x1="35" y1="70" x2="325" y2="70"/>',
        candles: [[35,120,128,96,100,1],[65,100,108,86,90,1],[95,90,116,88,110,0],[125,110,118,82,86,1],[155,86,96,75,78,1],[185,78,84,58,62,1],[215,62,86,60,82,0],[245,82,90,54,58,1],[275,58,66,38,42,1]],
        notes: [["BOS",252,52],["close above",205,104]]
      },
      liquidity: {
        label: "Liquidity pool",
        zone: '<line class="level" x1="30" y1="48" x2="330" y2="48"/><line class="level" x1="30" y1="132" x2="330" y2="132"/>',
        candles: [[35,120,126,94,98,1],[65,98,105,78,84,1],[95,84,112,80,108,0],[125,108,115,76,82,1],[155,82,112,78,108,0],[185,108,118,70,76,1],[215,76,116,74,110,0],[245,110,118,82,88,1],[275,88,124,84,120,0]],
        notes: [["BSL",45,38],["SSL",45,158]]
      },
      sweep: {
        label: "Sweep then reject",
        zone: '<line class="level" x1="35" y1="62" x2="325" y2="62"/>',
        candles: [[35,120,128,92,98,1],[65,98,108,82,88,1],[95,88,112,86,108,0],[125,108,116,74,78,1],[155,78,84,54,58,1],[185,58,42,38,78,0],[215,78,86,70,84,0],[245,84,94,82,92,0],[275,92,122,88,118,0]],
        notes: [["sweep high",170,34],["reversal",230,140]]
      },
      inducement: {
        label: "Inducement before POI",
        zone: '<rect class="zone" x="190" y="48" width="78" height="40" rx="8"/>',
        candles: [[35,125,130,104,108,1],[65,108,112,92,96,1],[95,96,116,92,112,0],[125,112,118,90,94,1],[155,94,122,92,118,0],[185,118,124,80,84,1],[215,84,90,58,62,1],[245,62,86,60,82,0],[275,82,94,48,52,1]],
        notes: [["inducement",92,145],["POI",213,44]]
      },
      fvg: {
        label: "Fair Value Gap",
        zone: '<rect class="zone" x="145" y="58" width="78" height="54" rx="8"/>',
        candles: [[35,126,132,112,116,1],[65,116,122,108,112,1],[95,112,118,100,104,1],[125,104,108,92,96,1],[155,96,100,48,54,1],[185,54,62,42,48,1],[215,48,72,46,68,0],[245,68,80,58,62,1],[275,62,68,44,48,1]],
        notes: [["FVG",166,90],["impulse",188,38]]
      },
      ob: {
        label: "Order Block",
        zone: '<rect class="zone" x="70" y="100" width="75" height="34" rx="8"/>',
        candles: [[35,122,130,112,118,0],[65,118,124,108,112,0],[95,112,120,100,104,0],[125,104,110,88,92,1],[155,92,96,62,66,1],[185,66,72,50,54,1],[215,54,70,52,66,0],[245,66,74,46,50,1],[275,50,58,36,40,1]],
        notes: [["OB",88,96],["displacement",160,84]]
      },
      pd: {
        label: "Premium / Discount",
        zone: '<line class="level" x1="35" y1="52" x2="325" y2="52"/><line class="mid" x1="35" y1="88" x2="325" y2="88"/><line class="level" x1="35" y1="128" x2="325" y2="128"/>',
        candles: [[40,122,132,112,116,1],[70,116,124,96,100,1],[100,100,108,78,82,1],[130,82,92,70,88,0],[160,88,96,58,62,1],[190,62,74,56,70,0],[220,70,82,66,78,0],[250,78,88,74,84,0],[280,84,94,80,90,0]],
        notes: [["Premium",48,42],["50%",48,84],["Discount",48,154]]
      },
      entry: {
        label: "Sweep + CHoCH entry",
        zone: '<rect class="zone" x="155" y="70" width="78" height="42" rx="8"/>',
        candles: [[35,122,130,102,106,1],[65,106,112,90,94,1],[95,94,126,90,122,0],[125,122,132,112,116,0],[155,116,120,84,88,1],[185,88,94,72,78,1],[215,78,92,76,88,0],[245,88,96,62,66,1],[275,66,74,46,50,1]],
        notes: [["sweep",84,145],["POI",178,66],["entry",252,58]]
      },
      checklist: {
        label: "Valid setup",
        zone: '<rect class="zone" x="55" y="46" width="250" height="82" rx="16"/>',
        candles: [[60,116,124,100,104,1],[90,104,110,88,92,1],[120,92,118,90,114,0],[150,114,122,82,86,1],[180,86,92,66,70,1],[210,70,80,64,76,0],[240,76,86,56,60,1],[270,60,70,48,52,1]],
        notes: [["Bias + Liquidity + POI + Confirmation",62,150]]
      }
    };

    const item = data[type] || data.structure;

    function candle(c) {
      const [x, open, high, low, close, bull] = c;
      const y = Math.min(open, close);
      const h = Math.max(8, Math.abs(close - open));
      const cls = bull ? "bull" : "bear";
      return `
        <line class="wick ${cls}" x1="${x}" y1="${high}" x2="${x}" y2="${low}"></line>
        <rect class="body ${cls}" x="${x - 6}" y="${y}" width="12" height="${h}" rx="3"></rect>
      `;
    }

    return `
      <div class="smc-chart smc-candle-chart">
        <svg viewBox="0 0 360 170">
          <text class="chart-title" x="18" y="22">${item.label}</text>
          ${item.zone || ""}
          ${item.candles.map(candle).join("")}
          ${(item.notes || []).map(n => `<text class="chart-note" x="${n[1]}" y="${n[2]}">${n[0]}</text>`).join("")}
        </svg>
      </div>
    `;
  }


  function renderModules() {
    return modules.map((m, i) => `
      <details class="smc-card" ${i === 0 ? "open" : ""}>
        <summary><span>${m.no}</span><b>${m.title}</b></summary>
        ${chart(m.chart)}
        ${m.body}
      </details>
    `).join("");
  }

  const html = `
    <div class="smc-academy">
      <div class="lab-upgrade-card smc-hero">
        <span class="badge free">SMC ACADEMY V1</span>
        <h3>Smart Money Concept Learning Desk</h3>
        <p class="muted">
          Modul lengkap untuk belajar mapping market: structure, BOS/CHoCH, liquidity, sweep, inducement,
          FVG, order block, premium-discount, entry model, dan checklist.
        </p>
      </div>
      ${renderModules()}
    </div>
  `;

  const oldShowLabTab = window.showLabTab;

  window.showLabTab = function (tab) {
    const target = String(tab || "journal").toLowerCase();

    if (target !== "academy") {
      if (typeof oldShowLabTab === "function") oldShowLabTab(tab);
      return;
    }

    document.querySelectorAll(".lab-panel").forEach(p => {
      p.classList.remove("active");
      p.style.display = "none";
    });

    document.querySelectorAll("[onclick^='showLabTab']").forEach(btn => btn.classList.remove("active"));

    const clicked = document.querySelector("[onclick=\"showLabTab('academy')\"]");
    if (clicked) clicked.classList.add("active");

    const root = document.querySelector("#lab .card") || document.getElementById("lab");
    if (!root) return;

    let panel = document.getElementById("lab-academy");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "lab-academy";
      panel.className = "lab-panel";
      root.appendChild(panel);
    }

    panel.classList.add("active");
    panel.style.display = "";
    panel.innerHTML = html;
  };
})();
