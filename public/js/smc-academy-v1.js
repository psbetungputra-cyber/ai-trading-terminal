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
    const charts = {
      structure: `<polyline points="25,130 80,90 125,112 180,62 225,84 305,35"/><text x="72" y="82">HH</text><text x="118" y="128">HL</text><text x="176" y="56">HH</text><text x="220" y="100">HL</text>`,
      bos: `<polyline points="25,120 80,80 130,105 185,55 240,95 315,42"/><line x1="185" y1="55" x2="330" y2="55"/><text x="250" y="48">BOS</text><line x1="130" y1="105" x2="330" y2="105"/><text x="230" y="122">CHoCH</text>`,
      liquidity: `<line x1="35" y1="42" x2="325" y2="42"/><line x1="35" y1="130" x2="325" y2="130"/><polyline points="40,120 90,70 135,105 180,65 225,110 285,82 320,120"/><text x="45" y="31">BSL</text><text x="45" y="155">SSL</text>`,
      sweep: `<line x1="40" y1="62" x2="310" y2="62"/><polyline points="35,120 85,88 130,103 180,65 215,42 250,85 315,128"/><circle cx="215" cy="42" r="8"/><text x="224" y="39">Sweep</text>`,
      inducement: `<rect x="86" y="92" width="70" height="34" rx="8"/><polyline points="35,125 88,98 130,116 175,82 210,60 250,92 315,38"/><text x="77" y="145">Inducement</text><text x="215" y="56">POI</text>`,
      fvg: `<rect x="145" y="55" width="72" height="58" rx="8"/><polyline points="40,125 95,112 135,100 175,42 230,58 300,38"/><text x="156" y="89">FVG</text>`,
      ob: `<rect x="80" y="100" width="76" height="32" rx="7"/><polyline points="35,120 80,115 125,118 170,72 220,52 290,35"/><text x="86" y="96">OB</text><text x="175" y="88">Displacement</text>`,
      pd: `<line x1="45" y1="40" x2="315" y2="40"/><line x1="45" y1="85" x2="315" y2="85"/><line x1="45" y1="130" x2="315" y2="130"/><text x="55" y="32">Premium</text><text x="55" y="81">50%</text><text x="55" y="154">Discount</text>`,
      entry: `<polyline points="35,125 80,105 125,114 170,70 220,86 285,45"/><rect x="155" y="72" width="68" height="38" rx="8"/><circle cx="128" cy="114" r="7"/><text x="95" y="145">Sweep</text><text x="164" y="68">POI</text><text x="235" y="55">Entry</text>`,
      checklist: `<polyline points="45,95 80,128 150,50"/><polyline points="175,95 210,128 305,38"/><text x="52" y="154">Valid setup checklist</text>`
    };

    return `
      <div class="smc-chart">
        <svg viewBox="0 0 360 170">
          ${charts[type] || charts.structure}
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
