/* Approximate prices in the visitor's currency.
   Rates: https://www.exchangerate-api.com (free, updated daily). Prices are always charged in JPY.
   Usage: <span class="fx" data-yen="90000"></span> and <span class="fx-pick"></span> <span class="fx-note"></span> */
(function () {
  const API = "https://open.er-api.com/v6/latest/JPY";
  const LIST = ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "KRW", "TWD", "HKD", "CNY", "SGD", "THB", "JPY"];
  const BY_REGION = { US: "USD", CA: "CAD", GB: "GBP", AU: "AUD", NZ: "AUD", IE: "EUR", FR: "EUR", DE: "EUR", AT: "EUR", IT: "EUR", ES: "EUR",
    NL: "EUR", BE: "EUR", FI: "EUR", PT: "EUR", LU: "EUR", CH: "CHF", KR: "KRW", TW: "TWD", HK: "HKD", MO: "HKD", CN: "CNY", SG: "SGD", TH: "THB", JP: "JPY" };
  const BY_LANG = { ko: "KRW", "zh-Hant": "TWD", "zh-Hans": "CNY", fr: "EUR", de: "EUR", "de-CH": "CHF", ja: "JPY", en: "USD" };
  const TXT = {
    en: ["Show in", "≈ approximate amount in your currency (rate updated daily). You pay in Japanese yen."],
    ja: ["表示通貨", "≈ はおおよその金額です（レートは毎日更新）。お支払いは日本円です。"],
    ko: ["표시 통화", "≈ 는 대략적인 금액입니다(환율은 매일 갱신). 결제는 일본 엔화로 진행됩니다."],
    "zh-Hans": ["显示货币", "≈ 为大约金额（汇率每日更新），实际以日元付款。"],
    "zh-Hant": ["顯示幣別", "≈ 為大約金額（匯率每日更新），實際以日圓付款。"],
    fr: ["Afficher en", "≈ montant approximatif dans ta devise (taux mis à jour chaque jour). Le paiement se fait en yens."],
    de: ["Anzeigen in", "≈ ungefährer Betrag in deiner Währung (Kurs täglich aktualisiert). Bezahlt wird in Yen."],
    "de-CH": ["Anzeigen in", "≈ ungefährer Betrag in deiner Währung (Kurs täglich aktualisiert). Bezahlt wird in Yen."]
  };
  let rates = null, cur = null, chosen = false;

  function pageLang() { return document.documentElement.lang || "en"; }
  function guess() {
    try { const s = localStorage.getItem("hgo-cur"); if (s && LIST.includes(s)) { chosen = true; return s; } } catch (e) {}
    for (const l of (navigator.languages || [navigator.language || ""])) {
      const m = String(l).match(/[-_]([A-Za-z]{2})\b/);
      if (m && BY_REGION[m[1].toUpperCase()]) return BY_REGION[m[1].toUpperCase()];
    }
    return BY_LANG[pageLang()] || "USD";
  }
  function money(v) {
    const l = pageLang() === "en" ? "en-US" : pageLang();
    const big = v >= 100;
    try {
      return new Intl.NumberFormat(l, { style: "currency", currency: cur, maximumFractionDigits: big ? 0 : 2, minimumFractionDigits: 0 }).format(big ? Math.round(v) : v);
    } catch (e) { return cur + " " + Math.round(v); }
  }
  function render() {
    const t = TXT[pageLang()] || TXT.en;
    document.querySelectorAll(".fx-pick").forEach(box => {
      if (!box.querySelector("select")) {
        box.innerHTML = '<label><span></span> <select class="fx-cur" aria-label="Currency"></select></label>';
        box.querySelector("select").addEventListener("change", e => {
          cur = e.target.value; chosen = true;
          try { localStorage.setItem("hgo-cur", cur); } catch (err) {}
          render();
        });
      }
      box.querySelector("span").textContent = t[0];
      const sel = box.querySelector("select");
      sel.innerHTML = LIST.map(c => `<option value="${c}">${c}</option>`).join("");
      sel.value = cur;
      box.hidden = !rates;
    });
    document.querySelectorAll(".fx-note").forEach(n => { n.textContent = rates && cur !== "JPY" ? t[1] : ""; });
    document.querySelectorAll(".fx").forEach(el => {
      const yen = Number(el.dataset.yen);
      el.textContent = rates && cur !== "JPY" && rates[cur] && yen ? "≈ " + money(yen * rates[cur]) : "";
    });
  }
  async function load() {
    try {
      const c = JSON.parse(sessionStorage.getItem("hgo-fx") || "null");
      if (c && Date.now() - c.at < 6 * 3600000) rates = c.rates;
    } catch (e) {}
    if (!rates) {
      try {
        const r = await fetch(API);
        const j = await r.json();
        if (j.result === "success") {
          rates = j.rates;
          try { sessionStorage.setItem("hgo-fx", JSON.stringify({ at: Date.now(), rates })); } catch (e) {}
        }
      } catch (e) { rates = null; }
    }
    render();
  }
  cur = guess();
  // follow the page's language switcher
  new MutationObserver(() => { if (!chosen) cur = guess(); render(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  window.HGOfx = { render };
  load();
})();
