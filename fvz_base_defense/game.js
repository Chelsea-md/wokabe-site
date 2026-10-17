import { rules, assetFiles, preloadIds } from "./config.js";
import {
  chapterFor,
  priceAt,
  costFor,
  increaseStat,
  countForWave,
  kindForSpawn,
  spawnInterval,
  killReward,
  mergeHealth,
} from "./systems.js";
import { loadProgress, persistProgress } from "./storage.js";
(() => {
  "use strict";
  const canvas = document.querySelector("#game"),
    g = canvas.getContext("2d"),
    controls = document.querySelector("#controls"),
    status = document.querySelector("#status");
  const names = preloadIds;
  const art = {};
  let loaded = 0,
    fontsReady = false;
  for (const n of names) {
    const im = new Image();
    im.onload = () => loaded++;
    im.onerror = () => {
      loaded++;
      console.error("Asset failed: " + n);
    };
    im.src = "assets/" + assetFiles[n];
    art[n] = im;
  }
  let saved = loadProgress();
  let homePalette = null;
  let scene = "home",
    modal = null,
    tab = "battle",
    selected = 0,
    wave = 1,
    meat = 0,
    hp = 20,
    earned = 0,
    countdown = 10,
    elapsed = 0,
    spawnClock = 0,
    spawned = 0,
    killed = 0,
    units = [],
    enemies = [],
    shots = [],
    enemyShots = [],
    effects = [],
    drag = null,
    buttons = [],
    last = performance.now(),
    screenW = 0,
    screenH = 0,
    scale = 1,
    ox = 0,
    oy = 0,
    time = 0,
    resultWin = false,
    waveBanner = 0,
    celebrate = 0,
    winAge = 0;
  const slots = rules.slots;
  const chapterWaves = () => chapterFor(saved).waves;
  const waveCount = () => countForWave(saved, wave);
  const enemyKind = (index, total) => kindForSpawn(saved, wave, index, total);
  const save = () => persistProgress(saved);
  function announce(t) {
    status.textContent = t;
  }
  function fit() {
    screenW = innerWidth;
    screenH = innerHeight;
    const d = Math.min(devicePixelRatio || 1, 2);
    canvas.width = screenW * d;
    canvas.height = screenH * d;
    g.setTransform(d, 0, 0, d, 0, 0);
    scale = Math.pow(screenW / 824, 0.7) * Math.pow(screenH / 419, 0.3);
    ox = (screenW - 824 * scale) / 2;
    oy = (screenH - 419 * scale) / 2;
    ui();
  }
  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left - ox) / scale,
      y: (e.clientY - r.top - oy) / scale,
    };
  }
  function worldPos(e) {
    const k = screenH / 419;
    return { x: (e.clientX - (screenW - 824 * k) / 2) / k, y: e.clientY / k };
  }
  function world(fn) {
    g.save();
    const k = screenH / 419 / scale;
    g.translate(411, 209.5);
    g.scale(k, k);
    g.translate(-411, -209.5);
    fn();
    g.restore();
  }
  function image(n, x, y, w, h = w, alpha = 1) {
    const a = art[n];
    if (!a?.complete || !a.naturalWidth) return;
    g.save();
    g.globalAlpha = alpha;
    if (n === "dialog") {
      const sh = Math.round(a.height * 0.25),
        hh = h < 120 ? 20 : 24;
      g.filter = "hue-rotate(10deg) saturate(.8) brightness(1.1)";
      g.drawImage(a, 0, 0, a.width, sh, x - w / 2, y - h / 2, w, hh);
      g.filter = "saturate(.25) brightness(1.05)";
      g.drawImage(
        a,
        0,
        sh,
        a.width,
        a.height - sh,
        x - w / 2,
        y - h / 2 + hh,
        w,
        h - hh,
      );
      g.restore();
      return;
    }
    if (
      [
        "purchase-card",
        "upgrade-frame",
        "upgrade-cyan",
        "dialog",
        "ribbon",
        "green-button",
        "tab",
        "selected-tab",
      ].includes(n)
    ) {
      g.drawImage(a, x - w / 2, y - h / 2, w, h);
      g.restore();
      return;
    }
    const k = Math.min(w / a.width, h / a.height);
    g.drawImage(
      a,
      x - (a.width * k) / 2,
      y - (a.height * k) / 2,
      a.width * k,
      a.height * k,
    );
    g.restore();
  }
  function coinLabel(n) {
    return n < 1000
      ? String(n)
      : (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  function text(t, x, y, size = 16, color = "#fff", stroke = 2) {
    g.font = size + "px Lilita,Arial Black";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    g.lineWidth = stroke;
    g.strokeStyle = "#151515";
    g.fillStyle = color;
    if (stroke) g.strokeText(t, x, y);
    g.fillText(t, x, y);
  }
  function rect(x, y, w, h, color) {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  }
  function button(id, label, x, y, w, h, fn, opts = {}) {
    const b = document.createElement("button");
    b.id = id;
    b.setAttribute("aria-label", opts.aria || label);
    b.style.cssText = `left:${ox + x * scale}px;top:${oy + y * scale}px;width:${w * scale}px;height:${h * scale}px;font-size:${(opts.size || 16) * scale}px`;
    if (opts.bg) {
      const im = document.createElement("img");
      im.src = "assets/" + opts.bg + ".png";
      im.style.cssText = "inset:0;width:100%;height:100%;object-fit:fill";
      b.append(im);
    }
    if (opts.icon) {
      const im = document.createElement("img");
      im.src = "assets/" + opts.icon + ".png";
      im.style.cssText = `width:60%;height:65%;left:20%;top:${label ? 4 : 15}%`;
      if (id === "settings")
        im.style.cssText =
          scene === "battle" || scene === "result"
            ? "width:100%;height:100%;left:0;top:0"
            : "width:70%;height:70%;left:15%;top:15%";
      b.append(im);
    }
    if (label) {
      const s = document.createElement("b");
      s.textContent = label;
      s.style.whiteSpace = "pre-line";
      if (opts.icon)
        s.style.cssText =
          "position:absolute;bottom:5%;width:100%;font-size:65%";
      b.append(s);
    }
    if (id === "start-wave") {
      const hand = document.createElement("img");
      hand.src = "assets/guide-hand.svg";
      hand.className = "guide-hand";
      hand.style.cssText =
        "width:28%;height:76%;left:84%;top:70%;object-fit:contain;pointer-events:none";
      b.append(hand);
    }
    if (id.startsWith("upgrade-")) {
      const labelNode = b.querySelector("b");
      if (label === "Free") {
        if (labelNode) labelNode.style.visibility = "hidden";
        b.classList.add("free-offer");
      } else if (opts.bg === "paid-upgrade") {
        if (labelNode) {
          labelNode.style.cssText =
            "position:absolute;left:41%;top:24%;width:42%;height:49%;background:#46d100;border-radius:3px;font-size:13px;line-height:1.15;-webkit-text-stroke:1px #151515;";
        }
      } else {
        const coin = document.createElement("img");
        coin.src = "assets/coin.png";
        coin.style.cssText =
          "width:23%;height:65%;left:8%;top:18%;object-fit:contain";
        b.append(coin);
        if (labelNode) labelNode.style.paddingLeft = "24%";
      }
    }
    b.onclick = fn;
    controls.append(b);
    buttons.push(b);
    return b;
  }
  function ui() {
    controls.replaceChildren();
    buttons = [];
    if (modal === "tutorial") {
      button(
        "tutorial-start",
        "Tap To Start",
        337,
        257,
        150,
        26,
        () => {
          modal = null;
          saved.tutorial = true;
          save();
          ui();
        },
        { size: 15 },
      );
      return;
    }
    if (modal === "settings") {
      button(
        "close-settings",
        "",
        470,
        99,
        23,
        23,
        () => {
          modal = null;
          ui();
        },
        { aria: "Close settings" },
      );
      button(
        "sound-toggle",
        "",
        442,
        175,
        31,
        22,
        () => {
          saved.sound = !saved.sound;
          save();
          ui();
        },
        { size: 10, aria: "Toggle sound" },
      );
      if (scene === "battle")
        button(
          "end-battle",
          "",
          378,
          250,
          68,
          30,
          () => {
            modal = "confirm-end";
            ui();
          },
          { aria: "END BATTLE", size: 10 },
        );
      return;
    }
    if (modal === "confirm-end") {
      button(
        "cancel-end",
        "",
        348,
        234,
        58,
        24,
        () => {
          modal = "settings";
          ui();
        },
        { aria: "No", size: 12 },
      );
      button("confirm-end-yes", "", 422, 234, 58, 24, abandon, {
        aria: "Yes",
        size: 12,
      });
      return;
    }
    if (modal === "reward") {
      const rewardButton = button(
        "finish-reward",
        "Continue!",
        311,
        350,
        202,
        48,
        () => {
          const action = rewardAction;
          rewardAction = null;
          action?.();
          modal = null;
          save();
          ui();
        },
        { bg: "green-button" },
      );
      rewardButton.disabled = true;
      return;
    }
    if (scene !== "troops")
      button(
        "settings",
        "",
        30 - ox / scale,
        26 - oy / scale,
        38,
        38,
        () => {
          modal = "settings";
          ui();
        },
        { icon: "gear", aria: "Settings" },
      );
    if (scene === "home" || scene === "troops") {
      [0, 1, 2, 3, 4].forEach((v) => {
        const active =
          (v === 1 && scene === "troops") || (v === 2 && scene === "home");
        button(
          "tab-" + v,
          "",
          (((82 + v * 132) / 824) * screenW - ox) / scale,
          (active ? 335 : 364) + oy / scale,
          ((134 / 824) * screenW) / scale,
          active ? 84 : 55,
          () => {
            if (v !== 1 && v !== 2) {
              announce("Locked");
              return;
            }
            scene = v === 1 ? "troops" : "home";
            homePalette = null;
            ui();
          },
          {
            bg:
              v === 1
                ? active
                  ? "nav-troops-active"
                  : "nav-troops"
                : v === 2
                  ? active
                    ? "nav-battle-active"
                    : "nav-battle"
                  : "nav-locked",
            aria: v === 1 ? "Troops" : v === 2 ? "Battle" : "Locked tab",
          },
        );
      });
      if (scene === "home") {
        button(
          "start-wave",
          "START\nWAVE",
          494,
          saved.played ? 79 : 145,
          171,
          73,
          start,
          { bg: "start-button", size: 21 },
        );
        if (saved.played) {
          ["health", "rate", "income"].forEach((key, i) => {
            const cost = upgradeCost(key);
            button(
              "upgrade-" + key,
              saved.coins >= cost || saved.freeUsed?.[key]
                ? coinLabel(cost)
                : "Free",
              438 + i * 102,
              297,
              81,
              34,
              () => upgrade(key),
              {
                bg:
                  saved.coins < cost && !saved.freeUsed?.[key]
                    ? "free-button"
                    : "paid-upgrade",
                size: 15,
                aria: "Upgrade " + key,
              },
            );
            const b = buttons.at(-1);
            b.disabled = saved.coins < cost && !!saved.freeUsed?.[key];
            if (b.disabled) b.style.filter = "grayscale(1)";
          });
        }
      } else
        [0, 1, 2].forEach((n) => {
          if (saved.unlocks[n]) return;
          button(
            "troop-" + n,
            "",
            saved.unlocks[n] ? 234 + n * 127 : 360 + (n - 1) * 127,
            saved.unlocks[n] ? 77 : 194,
            saved.unlocks[n] ? 102 : 108,
            saved.unlocks[n] ? 169 : 53,
            () => {
              if (!saved.unlocks[n]) {
                const cost = n === 1 ? 200 : 400;
                if (saved.coins < cost) {
                  announce("Not enough coins");
                  return;
                }
                saved.coins -= cost;
                saved.unlocks[n] = true;
                save();
              }
              ui();
            },
            {
              bg: saved.unlocks[n]
                ? null
                : "unlock-" +
                  (n === 1 ? "200" : "400") +
                  (saved.coins >= (n === 1 ? 200 : 400) ? "-ready" : ""),
              aria:
                "Unlock " +
                ["Peashooter", "Cabbage", "Cactus"][n] +
                " for " +
                (n === 1 ? 200 : 400) +
                " coins",
              size: 13,
            },
          );
        });
    } else if (scene === "result") {
      if (earned > 0)
        button(
          "claim-double",
          "",
          resultWin ? 359 : 347,
          resultWin ? 301 : 265,
          resultWin ? 107 : 126,
          resultWin ? 43 : 52,
          () => reward(() => collectResult(true)),
          {
            bg: resultWin ? "win-double" : "claim-button",
            aria: "Claim x2",
            size: 21,
          },
        );
      button(
        "continue",
        earned > 0 ? "No Thanks" : "Continue",
        341,
        resultWin ? 349 : 345,
        140,
        34,
        () => collectResult(false),
        { size: 20 },
      );
    }
  }
  let rewardAction = null,
    rewardReady = 0;
  let audio = null;
  function tone(freq, duration = 0.07) {
    if (!saved.sound) return;
    try {
      audio ??= new AudioContext();
      if (audio.state === "suspended") audio.resume();
      const o = audio.createOscillator(),
        v = audio.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(freq, audio.currentTime);
      o.frequency.exponentialRampToValueAtTime(
        Math.max(50, freq * 0.5),
        audio.currentTime + duration,
      );
      v.gain.setValueAtTime(0.035, audio.currentTime);
      v.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
      o.connect(v);
      v.connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + duration);
    } catch {}
  }
  document.addEventListener("pointerdown", () => tone(660, 0.035), {
    capture: true,
  });
  function reward(fn) {
    rewardAction = fn;
    rewardReady = performance.now() + rules.economy.adDurationMs;
    modal = "reward";
    ui();
  }
  function upgradeCost(k) {
    return costFor(saved, k);
  }
  function upgrade(k) {
    const cost = upgradeCost(k);
    const run = () => {
      increaseStat(saved, k);
      save();
      announce("Upgrade complete");
    };
    if (saved.coins >= cost) {
      saved.coins -= cost;
      run();
      ui();
    } else if (!saved.freeUsed?.[k])
      reward(() => {
        saved.freeUsed ??= {};
        saved.freeUsed[k] = true;
        run();
      });
  }
  function start() {
    scene = "battle";
    wave = 1;
    waveBanner = 0;
    meat = 0;
    hp = saved.health;
    earned = 0;
    countdown = 10;
    elapsed = 0;
    spawnClock = 0;
    spawned = 0;
    killed = 0;
    units = [];
    enemies = [];
    shots = [];
    enemyShots = [];
    effects = [];
    saved.played = true;
    if (!saved.tutorial) modal = "tutorial";
    save();
    ui();
    announce("Wave one. Drag the plant card onto a tile.");
  }
  function abandon() {
    scene = "home";
    homePalette = null;
    modal = null;
    drag = null;
    earned = 0;
    units = [];
    enemies = [];
    shots = [];
    meat = 0;
    saved.freeUsed = {};
    save();
    ui();
    announce("Returned home");
  }
  function collectResult(doubled) {
    if (scene !== "result") return;
    if (doubled) saved.coins += earned;
    if (resultWin) {
      saved.chapter = Math.min(
        rules.chapters.length - 1,
        (saved.chapter || 0) + 1,
      );
      celebrate = 3.2;
    }
    scene = "home";
    homePalette = null;
    modal = null;
    save();
    ui();
    announce(
      resultWin
        ? "Chapter finished. " + chapterFor(saved).name + " unlocked."
        : "Returned home",
    );
  }
  function finish(win) {
    scene = "result";
    resultWin = win;
    winAge = 0;
    modal = null;
    drag = null;
    meat = 0;
    saved.coins += earned;
    saved.freeUsed = {};
    save();
    ui();
    announce(win ? "Chapter finished" : "Coins collected: " + earned);
  }
  const slotPoint = (i) => ({ x: 411 + slots[i][0], y: 178 + slots[i][1] });
  function tileAt(p) {
    let best = -1,
      dist = 27;
    slots.forEach((_, i) => {
      const q = slotPoint(i),
        d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return best;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (scene !== "battle" || modal) return;
    const p = pos(e),
      wp = worldPos(e),
      card = shopCards().find(
        (c) =>
          Math.abs(p.x - c.x) < 29 &&
          p.y > 320 + oy / scale &&
          p.y < 398 + oy / scale,
      );
    if (card) {
      if (meat < card.cost) {
        announce("Need " + card.cost + " sun");
        return;
      }
      drag = {
        shop: true,
        type: card.type,
        cost: card.cost,
        level: 0,
        x: wp.x,
        y: wp.y,
      };
    } else {
      const i = tileAt(wp),
        u = units.find((v) => v.slot === i);
      if (u)
        drag = {
          shop: false,
          unit: u,
          type: u.type,
          level: u.level,
          x: wp.x,
          y: wp.y,
        };
    }
    if (drag) {
      drag.tx = drag.x;
      drag.ty = drag.y;
      drag.age = 0;
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (drag) {
      const p = worldPos(e);
      drag.tx = p.x;
      drag.ty = p.y;
      e.preventDefault();
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.unit) {
      d.unit.drawX = d.x;
      d.unit.drawY = d.y;
      d.unit.placeT = 0.22;
    }
    const i = tileAt(worldPos(e));
    if (i < 0) return;
    const target = units.find((u) => u.slot === i && u !== d.unit);
    if (target && (target.type !== d.type || target.level !== d.level)) {
      announce("Merge matching plants of the same level");
      return;
    }
    if (d.shop && meat < d.cost) return;
    if (d.shop) meat -= d.cost;
    if (target) {
      tone(1000, 0.16);
      target.level++;
      Object.assign(target, mergeHealth(target, target.level));
      target.placeT = 0.3;
      if (d.unit) units = units.filter((u) => u !== d.unit);
      const p = slotPoint(i);
      effects.push({ ...p, t: 1.3, label: "LVL UP!", kind: "merge" });
      announce("Plant merged");
    } else if (d.unit) d.unit.slot = i;
    else
      units.push({
        slot: i,
        type: d.type,
        level: d.level,
        hp: troopStats[d.type].hp,
        maxHp: troopStats[d.type].hp,
        cooldown: 0,
        drawX: d.x,
        drawY: d.y,
        placeT: 0.22,
      });
  });
  canvas.addEventListener("pointercancel", () => (drag = null));
  window.addEventListener("blur", () => {
    drag = null;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modal = modal === "settings" ? null : "settings";
      ui();
    }
  });
  function coinValue(e) {
    return killReward(saved, e.kind);
  }
  function spawn() {
    const a = Math.random() * Math.PI * 2,
      r = 280 + Math.random() * 70,
      total = waveCount(),
      kind = enemyKind(spawned, total),
      maxHp =
        kind === 3
          ? saved.chapter > 0
            ? 4500
            : 3200
          : (40 + Math.max(0, wave - 1) * 10) *
            (kind === 1 ? 2 : kind === 4 ? 2.5 : kind === 2 ? 0.8 : 1);
    enemies.push({
      x: 411 + Math.cos(a) * r,
      y: 178 + Math.sin(a) * r,
      hp: maxHp,
      maxHp,
      speed: kind === 3 ? 18 : (kind === 1 ? 9 : 11) + wave * 0.6,
      hit: 0,
      kind,
    });
    spawned++;
  }
  function update(dt) {
    time += dt;
    const follow = 1 - Math.exp(-rules.motion.followSpeed * dt);
    if (drag) {
      drag.age += dt;
      drag.x += (drag.tx - drag.x) * follow;
      drag.y += (drag.ty - drag.y) * follow;
    }
    for (const u of units) {
      const p = slotPoint(u.slot);
      u.drawX =
        u.drawX === undefined ? p.x : u.drawX + (p.x - u.drawX) * follow;
      u.drawY =
        u.drawY === undefined ? p.y : u.drawY + (p.y - u.drawY) * follow;
      u.placeT = Math.max(0, (u.placeT || 0) - dt);
    }
    celebrate = Math.max(0, celebrate - dt);
    if (scene === "result" && resultWin) winAge += dt;
    if (modal === "reward") {
      const b = document.querySelector("#finish-reward");
      if (b) {
        const remain = Math.ceil((rewardReady - performance.now()) / 1000);
        b.disabled = remain > 0;
        b.querySelector("b").textContent =
          remain > 0 ? "Continue in " + remain : "Continue!";
      }
    }
    const description =
      scene === "battle"
        ? `Wave ${wave} of ${chapterWaves()}. Sun ${Math.floor(meat)}. Base health ${Math.max(0, hp)}. Plants ${units.length}. Levels ${units.map((u) => u.level + 1).join(",") || "none"}. Tiles ${units.map((u) => u.slot + 1).join(",") || "none"}. Types ${units.map((u) => u.type).join(",") || "none"}.${enemies.some((e) => e.kind === 3) ? " Reaper boss health " + Math.ceil(enemies.find((e) => e.kind === 3).hp) + "." : ""}${drag ? " Dragging plant. Attack range " + troopStats[drag.type].range + "." : ""}`
        : `Garden Defence ${scene}. Coins ${saved.coins}.`;
    if (canvas.getAttribute("aria-label") !== description)
      canvas.setAttribute("aria-label", description);
    effects.forEach((e) => (e.t -= dt));
    effects = effects.filter((e) => e.t > 0);
    if (scene !== "battle" || modal) return;
    waveBanner = Math.max(0, waveBanner - dt);
    meat += saved.rate * dt;
    if (countdown > 0) {
      countdown -= dt;
      return;
    }
    elapsed += dt;
    spawnClock -= dt;
    const total = waveCount();
    if (spawnClock <= 0 && spawned < total) {
      spawn();
      spawnClock = spawnInterval(saved, wave);
    }
    for (const u of units) {
      u.cooldown -= dt;
      u.recoil = Math.max(0, (u.recoil || 0) - dt);
      const p = slotPoint(u.slot);
      const target = enemies
        .filter(
          (e) =>
            e.hp > 0 &&
            Math.hypot(e.x - p.x, e.y - p.y) < troopStats[u.type].range,
        )
        .sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        )[0];
      if (target) u.facing = target.x < p.x ? -1 : 1;
      if (target && u.cooldown <= 0) {
        u.recoil = 0.14;
        tone(u.type === 2 ? 110 : 240);
        if (u.type === 2) {
          const damage =
            troopStats[u.type].attack *
            Math.pow(rules.merge.attackGrowth, u.level);
          target.hp -= damage;
          effects.push(
            {
              x: p.x,
              y: p.y,
              tx: target.x,
              ty: target.y,
              t: 0.09,
              kind: "trace",
            },
            { x: target.x, y: target.y, t: 0.16, kind: "impact" },
            {
              x: target.x,
              y: target.y - 10,
              t: 0.45,
              label: String(Math.floor(damage)),
              damage: true,
            },
          );
        } else
          shots.push({
            x: p.x,
            y: p.y,
            target,
            damage:
              troopStats[u.type].attack *
              Math.pow(rules.merge.attackGrowth, u.level),
            type: u.type,
          });
        u.cooldown = troopStats[u.type].cooldown;
      }
    }
    for (const s of shots) {
      const dx = s.target.x - s.x,
        dy = s.target.y - s.y,
        d = Math.hypot(dx, dy);
      if (d < 8) {
        s.target.hp -= s.damage;
        effects.push({ x: s.target.x, y: s.target.y, t: 0.16, kind: "impact" });
        effects.push({
          x: s.target.x,
          y: s.target.y - 10,
          t: 0.45,
          label: String(Math.floor(s.damage)),
          damage: true,
        });
        s.dead = true;
      } else {
        s.x += (dx / d) * 240 * dt;
        s.y += (dy / d) * 240 * dt;
      }
    }
    shots = shots.filter((s) => !s.dead && s.target.hp > 0);
    for (const e of enemies) {
      const ranged = e.kind === 2 || e.kind === 4;
      if (e.hp <= 0) {
        earned += coinValue(e);
        effects.push({ x: e.x, y: e.y, t: 1.1, kind: "death" });
        effects.push({ x: e.x, y: e.y, t: 0.7, label: "+" + coinValue(e) });
        killed++;
        continue;
      }
      e.hit -= dt;
      let target = { x: 411, y: 178, base: true };
      const near = units
        .map((u) => ({ u, ...slotPoint(u.slot) }))
        .filter(
          (p) =>
            Math.hypot(p.x - e.x, p.y - e.y) <
            (ranged ? (e.kind === 4 ? 125 : 160) : 38),
        )
        .sort(
          (a, b) =>
            Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y),
        )[0];
      if (near) target = near;
      const dx = target.x - e.x,
        dy = target.y - e.y,
        d = Math.hypot(dx, dy);
      if (d > (ranged ? (e.kind === 4 ? 90 : 125) : 17)) {
        e.x += (dx / d) * e.speed * dt;
        e.y += (dy / d) * e.speed * dt;
      } else if (e.hit <= 0) {
        if (ranged) {
          enemyShots.push({
            x: e.x,
            y: e.y,
            target: target.base ? null : target.u,
            damage: e.kind === 4 ? 20 : 10 + wave * 2,
          });
          e.hit = e.kind === 4 ? 1.1 : 1.8;
        } else {
          const damage = e.kind === 3 ? 40 : 10;
          if (target.base) hp -= damage;
          else target.u.hp -= damage;
          e.hit = e.kind === 3 ? 1.1 : 1.2;
        }
      }
    }
    for (const b of enemyShots) {
      if (b.target && !units.includes(b.target)) {
        b.dead = true;
        continue;
      }
      const p = b.target ? slotPoint(b.target.slot) : { x: 411, y: 178 },
        dx = p.x - b.x,
        dy = p.y - b.y,
        d = Math.hypot(dx, dy);
      b.angle = Math.atan2(dy, dx);
      if (d < 8) {
        if (b.target) b.target.hp -= b.damage;
        else hp -= b.damage;
        b.dead = true;
      } else {
        b.x += (dx / d) * 150 * dt;
        b.y += (dy / d) * 150 * dt;
      }
    }
    enemyShots = enemyShots.filter((b) => !b.dead);
    enemies = enemies.filter((e) => e.hp > 0);
    for (const u of units)
      if (u.hp <= 0) {
        effects.push({ ...slotPoint(u.slot), t: 0.7, kind: "plant-death" });
        tone(100, 0.15);
      }
    units = units.filter((u) => u.hp > 0);
    if (drag?.unit && !units.includes(drag.unit)) drag = null;
    if (hp <= 0) {
      finish(false);
      return;
    }
    if (spawned >= total && enemies.length === 0) {
      if (wave === chapterWaves()) {
        finish(true);
        return;
      }
      wave++;
      countdown = 0;
      waveBanner = 1.4;
      spawned = 0;
      killed = 0;
      elapsed = 0;
      spawnClock = 0;
      announce("Wave " + wave);
    }
  }
  const troopStats = rules.troops;
  function shopCards() {
    const ids = saved.unlocks
      .map((yes, i) => (yes ? i : -1))
      .filter((i) => i >= 0);
    return ids.map((type, i) => ({
      type,
      x: 444 + (i - (ids.length - 1) / 2) * 67,
      cost: troopStats[type].cost,
    }));
  }
  function plantName(u) {
    return u.type === 1
      ? u.level
        ? "cabbage-" + Math.min(3, u.level + 1)
        : "cabbage"
      : u.type === 2
        ? "cactus-" + Math.min(3, u.level + 1)
        : u.level >= 2
          ? "pea-level-" + Math.min(6, u.level + 1)
          : u.level
            ? "double-pea"
            : "pea";
  }
  function healthbar(x, y, p, w = 22) {
    rect(x - w / 2, y, w, 5, "#1d1b17");
    rect(x - w / 2 + 1, y + 1, Math.max(0, (w - 2) * p), 3, "#eb3232");
  }
  function terrain() {
    const desert = saved.chapter > 0,
      tile =
        art[
          saved.chapter > 1
            ? "noon-terrain"
            : desert
              ? "desert-terrain"
              : "terrain"
        ],
      pattern =
        tile.complete && tile.naturalWidth
          ? g.createPattern(tile, "repeat")
          : null;
    g.fillStyle = pattern || (desert ? "#ddbe85" : "#898b54");
    g.fillRect(-ox / scale, -oy / scale, screenW / scale, screenH / scale);
    if (desert) {
      image(
        "desert-cactus",
        scene === "home" ? (saved.chapter > 1 ? 250 : 145) : 307,
        scene === "home" ? (saved.chapter > 1 ? 68 : 99) : 101,
        45,
        68,
      );
      image(
        "desert-ribs",
        scene === "home" ? (saved.chapter > 1 ? 526 : 512) : 554,
        scene === "home" ? (saved.chapter > 1 ? 286 : 188) : 159,
        55,
        40,
      );
      if (saved.chapter === 1 || scene !== "home")
        image(
          "desert-horns",
          scene === "home" ? 230 : 367,
          scene === "home" ? 361 : 290,
          50,
          35,
        );
      if (saved.chapter === 1) {
        image(
          "desert-skull",
          scene === "home" ? 299 : 418,
          scene === "home" ? 18 : 44,
          48,
          37,
        );
        if (scene !== "home") image("dead-tree", 530, 51, 27, 42);
      }
    } else {
      image(
        "tree",
        scene === "home" ? 137 : 300,
        scene === "home" ? 41 : 59,
        scene === "home" ? 100 : 55,
        scene === "home" ? 100 : 75,
      );
      image(
        "log",
        scene === "home" ? 511 : 554,
        scene === "home" ? 190 : 168,
        56,
        42,
      );
      image(
        "stump",
        scene === "home" ? 237 : 367,
        scene === "home" ? 363 : 290,
        42,
        36,
      );
    }
  }
  function grid(cx, cy, unitScale = 1) {
    g.save();
    g.translate(cx, cy);
    g.scale(unitScale, unitScale);
    for (const [dx, dy] of [...slots, [0, 0]]) {
      g.save();
      g.translate(dx, dy);
      g.rotate(Math.PI / 4);
      g.fillStyle = saved.chapter > 0 ? "#b69b68" : "#7f8050";
      g.beginPath();
      g.roundRect(-17.5, -17.5, 35, 35, 5);
      g.fill();
      g.restore();
    }
    image(
      scene === "home"
        ? "greenhouse"
        : hp <= 0
          ? "greenhouse-destroyed"
          : hp < saved.health * 0.5
            ? "greenhouse-damaged"
            : "greenhouse",
      0,
      -3,
      49,
      54,
    );
    g.restore();
  }
  function tabsBackground() {
    rect(0, 418, 824, 100, "#636363");
  }
  function drawHome() {
    homePalette ||= ["health", "rate", "income"].map(
      (key) => saved.coins >= upgradeCost(key),
    );
    world(() => {
      terrain();
      grid(292, 215, 1.45);
    });
    image(chapterFor(saved).ribbon, 413, 46, 246, 64);
    rect(
      510,
      saved.played ? 156 : 220,
      144,
      27,
      saved.chapter > 1 ? "#514a3a" : saved.chapter > 0 ? "#786444" : "#484b35",
    );
    text("Dusty Desert", 582, saved.played ? 169 : 232, 18);
    if (saved.played)
      ["health", "rate", "income"].forEach((key, i) => {
        const x = 478 + i * 102;
        g.save();
        const used = saved.coins < upgradeCost(key) && saved.freeUsed?.[key];
        if (used) g.filter = "grayscale(1)";
        image(used || !homePalette[i] ? "upgrade-frame" : "upgrade-cyan", x, 266, 92, 128);
        text(["Castle Health", "Sun Rate", "Income"][i], x, 216, 13);
        image(["swords", "sun", "coin"][i], x, 247, 34);
        const t =
          key === "health"
            ? `${saved.health} → ${saved.health + 10}`
            : key === "rate"
              ? `${saved.rate} → ${+(saved.rate + 0.02).toFixed(2)}`
              : `${saved.income} → ${saved.income + 1}`;
        text(t, x, 279, 16);
        g.restore();
      });
    tabsBackground();
  }
  function drawTroops() {
    const pat =
      art["troops-terrain"].complete && art["troops-terrain"].naturalWidth
        ? g.createPattern(art["troops-terrain"], "repeat")
        : null;
    g.save();
    g.translate(-ox / scale, -oy / scale);
    g.scale(screenW / 824 / scale, screenH / 419 / scale);
    if (pat) pat.setTransform(new DOMMatrix().translate(0, 40));
    g.fillStyle = pat || "#2e447b";
    g.fillRect(0, 0, 824, 419);
    g.restore();
    rect(152, -21, 518, 60, "#3c609688");
    text("Troops", 411, 8, 24, "#fff", 3);
    [0, 1, 2].forEach((n) => {
      const x = 285 + n * 127,
        unlocked = saved.unlocks[n];
      g.save();
      if (!unlocked && saved.coins < (n === 1 ? 200 : 400))
        g.filter = "grayscale(1)";
      image("purchase-card", x, 141, 102, 128);
      image(["pea", "cabbage", "cactus-1"][n], x, 142, 74, 88);
      g.restore();
      if (!unlocked) {
        g.save();
        g.filter = "grayscale(1)";
        image("lock", x + 38, 96, 29, 38);
        g.restore();
      } else {
        rect(x - 51, 194, 102, 52, "#1b2643");
        image("swords", x - 29, 204, 22);
        text(String(Math.floor(troopStats[n].attack)), x + 7, 204, 22);
        image("heart", x - 28, 233, 21);
        text(String(troopStats[n].hp), x + 13, 233, 23);
      }
    });
  }
  function drawBattle() {
    world(() => {
      terrain();
      grid(411, 178);
      if (drag) {
        const r = troopStats[drag.type].range;
        g.save();
        const halo = g.createRadialGradient(
            drag.x,
            drag.y,
            0,
            drag.x,
            drag.y,
            r + 30,
          ),
          edge = r / (r + 30);
        halo.addColorStop(0, "rgba(25,35,0,.1)");
        halo.addColorStop(edge - 0.002, "rgba(25,35,0,.1)");
        halo.addColorStop(edge, "rgba(255,255,220,.4)");
        halo.addColorStop(1, "rgba(255,255,205,0)");
        g.globalAlpha = Math.min(1, drag.age / 0.08);
        g.fillStyle = halo;
        g.beginPath();
        g.arc(drag.x, drag.y, r + 30, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      for (const e of effects)
        if (e.kind === "merge")
          image("fx-merge", e.x, e.y - 22, 80, 90, Math.min(0.8, e.t));
      for (const u of units) {
        if (drag?.unit === u) continue;
        const p = {
            x: u.drawX ?? slotPoint(u.slot).x,
            y: u.drawY ?? slotPoint(u.slot).y,
          },
          bounce = Math.sin(Math.min(1, (u.placeT || 0) / 0.22) * Math.PI);
        g.save();
        g.translate(p.x, p.y);
        g.scale((u.facing || 1) * (1 + 0.08 * bounce), 1 - 0.06 * bounce);
        g.translate(-Math.sin(((u.recoil || 0) / 0.14) * Math.PI) * 2, 0);
        image(plantName(u), 0, 0, 30 + Math.min(u.level, 3) * 3, 36);
        g.restore();
        if (u.hp < u.maxHp) {
          g.fillStyle = "#ffa329";
          g.beginPath();
          g.roundRect(p.x - 14, p.y - 27, 8, 10, 2);
          g.fill();
          text(String(u.level + 1), p.x - 10, p.y - 22, 8, "#fff");
          healthbar(p.x, p.y - 28, u.hp / u.maxHp);
        }
      }
      for (const e of enemies) {
        g.save();
        g.translate(e.x, e.y + Math.sin(time * 9 + e.x) * 0.7);
        g.scale(e.x < 411 ? 1 : -1, 1);
        image(
          e.kind === 3
            ? "reaper-zombie"
            : saved.chapter > 0
              ? e.kind === 4
                ? "mummy-shortbow"
                : e.kind === 2
                  ? "mummy-archer"
                  : e.kind === 1
                    ? "mummy-armor"
                    : "mummy"
              : e.kind === 2
                ? "archer-zombie"
                : e.kind
                  ? "bucket-zombie"
                  : "zombie",
          0,
          0,
          e.kind === 3
            ? 58
            : e.kind === 4
              ? 38
              : e.kind === 1
                ? 34
                : e.kind === 2
                  ? 32
                  : 26,
          e.kind === 3
            ? 68
            : e.kind === 4
              ? 46
              : e.kind === 1
                ? 46
                : e.kind === 2
                  ? 40
                  : 34,
        );
        g.restore();
        if (e.hp < e.maxHp)
          healthbar(
            e.x,
            e.y -
              (e.kind === 3
                ? 40
                : e.kind === 4
                  ? 29
                  : e.kind === 1
                    ? 30
                    : e.kind === 2
                      ? 27
                      : 23),
            e.hp / e.maxHp,
            e.kind === 3 ? 48 : e.kind === 1 ? 28 : 22,
          );
      }
      for (const b of enemyShots) {
        g.save();
        g.translate(b.x, b.y);
        g.rotate(b.angle);
        const a = art["enemy-arrow"];
        if (a.complete && a.naturalWidth) g.drawImage(a, -7, -2, 14, 4);
        g.restore();
      }
      for (const s of shots) {
        if (s.type === 2) {
          const angle = Math.atan2(s.target.y - s.y, s.target.x - s.x);
          g.save();
          g.translate(s.x, s.y);
          g.rotate(angle);
          rect(-5, -1, 10, 2, "#ecf8b7");
          g.restore();
        } else {
          g.beginPath();
          g.arc(s.x, s.y, 3, 0, 7);
          g.fillStyle = s.type === 1 ? "#8ed550" : "#b6e851";
          g.fill();
        }
      }
      if (hp < saved.health) {
        rect(397, 147, 30, 10, "#211c1d");
        rect(398, 148, 28 * Math.max(0, hp / saved.health), 8, "#dc3232");
        text(String(Math.max(0, hp)), 411, 152, 9);
      }
    });
    g.save();
    g.translate(0, -oy / scale);
    rect(355, 20, 108, 17, "#64434e");
    rect(356, 21, 106 * Math.min(1, killed / waveCount()), 15, "#ff9500");
    g.lineWidth = 1;
    g.strokeStyle = "#151515";
    g.strokeRect(355, 20, 108, 17);
    const mark = 356 + 106 * Math.min(1, killed / waveCount());
    g.beginPath();
    g.moveTo(mark, 42);
    g.lineTo(mark - 4, 48);
    g.lineTo(mark + 4, 48);
    g.closePath();
    g.fillStyle = "#fff";
    g.fill();
    g.stroke();
    text("Wave: " + wave + "/" + chapterWaves(), 409, 28, 11);
    if (countdown > 0 && modal !== "tutorial")
      text("Wave starts in " + Math.ceil(countdown), 411, 70, 16);
    else if (waveBanner > 0) text("Wave " + wave, 411, 70, 18);
    g.restore();
    g.save();
    g.translate(0, oy / scale);
    rect(-1000, 358, 3000, 1000, "#606060");
    rect(-1000, 357, 3000, 3, "#a4a482");
    g.fillStyle = "#525252";
    g.beginPath();
    g.ellipse(166, 405, 30, 9, 0, 0, 7);
    g.fill();
    image("resource-frame", 291, 388, 77, 30);
    g.save();
    g.beginPath();
    g.moveTo(260, 376);
    g.lineTo(322, 376);
    g.lineTo(325, 380);
    g.lineTo(321, 398);
    g.lineTo(260, 398);
    g.lineTo(256, 392);
    g.lineTo(256, 381);
    g.closePath();
    g.clip();
    rect(256, 376, 70, 23, "#626262");
    rect(256, 376, 70 * (meat % 1), 23, "#ffe100");
    g.restore();
    image("sun", 299, 388, 25);
    text(String(Math.floor(meat)), 275, 388, 19);
    for (const c of shopCards()) {
      if (drag?.shop && drag.type === c.type) continue;
      g.save();
      if (meat < c.cost) g.filter = "grayscale(1)";
      image("purchase-card", c.x, 357, 56, 71);
      g.restore();
      image(["pea", "cabbage", "cactus-1"][c.type], c.x, 357, 38, 48);
      text(String(c.cost), c.x - 15, 409, 21);
      image("sun", c.x + 7, 409, 25);
    }
    if (scene === "battle" && units.length === 0 && meat >= 3 && !drag) {
      const c = shopCards()[0],
        phase = (time % 3) / 3,
        t = Math.max(0, Math.min(1, (phase - 0.2) / 0.55)),
        ex = (screenW / 2 - 54 * (screenH / 419) - ox) / scale,
        ey = (178 * (screenH / 419) - 2 * oy) / scale,
        hx = c.x + (ex - c.x) * t,
        hy = 355 + (ey - 355) * t;
      g.save();
      g.translate(hx + 15, hy + 18);
      g.rotate(-0.6);
      image("guide-hand", 0, 0, 42, 49, phase > 0.9 ? 0 : 1);
      g.restore();
    }
    g.restore();
    world(() => {
      for (const e of effects) {
        if (e.kind === "trace") {
          g.strokeStyle = "rgba(66,75,22," + Math.min(1, e.t * 10) + ")";
          g.lineWidth = 0.8;
          g.beginPath();
          g.moveTo(e.x, e.y);
          g.lineTo(e.tx, e.ty);
          g.stroke();
          continue;
        }
        if (e.kind === "plant-death") {
          image(
            "fx-ghost",
            e.x,
            e.y - (0.7 - e.t) * 20,
            23,
            31,
            Math.min(1, e.t * 2),
          );
          continue;
        }
        if (e.kind === "death") {
          image(
            "fx-ghost",
            e.x,
            e.y - (1.1 - e.t) * 26,
            30,
            42,
            Math.min(1, e.t),
          );
          continue;
        }
        if (e.kind === "impact") {
          image("fx-impact", e.x, e.y, 22, 22, Math.min(1, e.t * 6));
          continue;
        }
        if (!e.damage && e.kind !== "merge")
          image("fx-coin", e.x, e.y - 15, 23, 23, Math.min(1, e.t));
        text(
          e.label,
          e.x,
          e.y - 35 - (e.damage ? (0.45 - e.t) * 15 : 0),
          12,
          e.damage ? "#fff" : "#ffdf31",
        );
      }
      if (drag) {
        const i = tileAt(drag);
        if (i >= 0) {
          const p = slotPoint(i);
          g.save();
          g.translate(p.x, p.y);
          g.rotate(Math.PI / 4);
          const occupied = units.find((u) => u.slot === i && u !== drag.unit);
          g.fillStyle =
            !occupied ||
            (occupied.type === drag.type && occupied.level === drag.level)
              ? "rgba(125,211,0,.7)"
              : "rgba(224,69,49,.6)";
          g.beginPath();
          g.roundRect(-17.5, -17.5, 35, 35, 5);
          g.fill();
          g.restore();
        }
        image(plantName(drag), drag.x, drag.y, 36, 42);
      }
    });
  }
  function drawSettingsBase() {
    image(saved.sound ? "settings-on" : "settings-off", 411, 199, 152, 190);
    image("close-button", 481, 109, 18, 20);
    if (scene === "battle") image("end-button", 412, 265.5, 68, 31);
  }
  function drawVictory() {
    image("win-trophy", 412, 53, 90, 60);
    image("win-ribbon", 419.5, 105, 209, 54);
    image("chapter-check", 359, 178.5, 32, 31);
    text("CHAPTER FINISHED", 425, 181, 13);
    image("chapter-badge", 415.5, 228, 39, 38);
    g.fillStyle = "#0878ce";
    g.strokeStyle = "#b7f5ff";
    g.lineWidth = 1;
    g.beginPath();
    g.roundRect(397, 259, 30, 31, 3);
    g.fill();
    g.stroke();
    image("coin", 412, 263, 20);
    text(String(earned), 412, 281, 11);
    if (winAge < 3) {
      for (let i = 0; i < 50; i++) {
        const x =
            ((((i * 137.3 + winAge * (i % 2 ? 20 : -25)) % 900) + 900) % 900) -
            40,
          y = ((i * 53 + winAge * (60 + (i % 30))) % 500) - 50;
        g.save();
        g.translate(x, y);
        g.rotate(i + winAge * 3);
        g.fillStyle = ["#fff300", "#ff39ba", "#27e139", "#28bcff"][i % 4];
        g.fillRect(-3, -2, 7, 4);
        g.restore();
      }
    }
  }
  function drawRewardShower() {
    const t = 3.2 - celebrate;
    for (let i = 0; i < 32; i++) {
      const x = (i * 127.7 + Math.sin(i) * t * 20) % 824,
        y = -70 + ((i * 71) % 430) + t * (90 + (i % 60));
      if (y > 440) continue;
      if (i % 2) image("coin", x, y, 22 + (i % 16));
      else {
        g.save();
        g.translate(x, y);
        g.rotate(Math.PI / 4);
        g.fillStyle = "#7df52a";
        g.strokeStyle = "#226b1c";
        g.lineWidth = 2;
        g.fillRect(-9, -9, 18, 18);
        g.strokeRect(-9, -9, 18, 18);
        g.restore();
      }
    }
  }
  function drawModal() {
    if (!modal) return;
    if (modal === "reward") {
      rect(-1000, -1000, 3000, 3000, "#10111c");
      text("Advertisement", 411, 43, 24);
      image("pea", 365, 188, 120, 140);
      image("zombie", 472, 188, 100, 140);
      text("Garden Defence", 411, 285, 25);
      return;
    }
    rect(-1000, -1000, 3000, 3000, "#0009");
    if (modal === "tutorial") {
      image("tutorial-frame", 409.5, 182, 155, 220);
      rect(365, 256, 94, 26, "#dee6cc");
      const rows = [
        ["DRAG and DROP to place", "the PLANT"],
        ["Merge two PLANTS to", "create a powerful ONE."],
        ["Once you have enough", "SUN, you can purchase", "PLANTS"],
      ];
      for (let i = 0; i < 3; i++) {
        const y = 101 + i * 54;
        g.fillStyle = "#fff6e7";
        g.strokeStyle = "#674c48";
        g.lineWidth = 1;
        g.beginPath();
        g.roundRect(349, y + 1, 130, 45, 2);
        g.fill();
        g.stroke();
        image("scroll-curl", 348.5, y + 23.5, 15, 47);
        g.font = "bold 7px Arial";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = "#34342e";
        rows[i].forEach((t, j) =>
          g.fillText(t, 397, y + (rows[i].length === 3 ? 15 : 20) + j * 8),
        );
        image(
          ["mini-place", "mini-merge", "mini-shop"][i],
          460,
          y + 24,
          30,
          38,
        );
        g.strokeStyle = "#d18c6c";
        g.lineWidth = 1;
        g.strokeRect(443, y + 5, 33, 36);
      }
    } else if (modal === "settings") {
      drawSettingsBase();
    } else if (modal === "confirm-end") {
      drawSettingsBase();
      rect(-1000, -1000, 3000, 3000, "#0008");
      image("confirm-panel", 412.5, 207, 169, 108);
    } else if (modal === "reward") {
      image("dialog", 411, 205, 220, 185);
      text("Reward", 411, 134, 20);
      text("Free upgrade / x2 coins", 411, 188, 17);
      text("Continue to collect", 411, 215, 16);
    }
  }
  function render() {
    g.save();
    g.translate(ox, oy);
    g.scale(scale, scale);
    if (scene === "home") drawHome();
    else if (scene === "troops") drawTroops();
    else {
      drawBattle();
      if (scene === "result") {
        rect(-1000, -1000, 3000, 3000, resultWin ? "#000c" : "#000a");
        rect(200, 45, 424, 44, "#151c191a");
        if (resultWin) {
          drawVictory();
        } else {
          text("Coins collected", 411, 70, 22);
          image("coin", 375, 176, 34);
          text(coinLabel(earned), 412, 178, 27);
        }
      }
    }
    if (scene === "home") {
      g.save();
      g.translate(ox / scale, -oy / scale);
      rect(714, 28, 55, 25, "#303328");
      image("coin", 709, 38, 34);
      text(coinLabel(saved.coins), 748, 39, 21);
      g.restore();
    } else if (scene !== "troops") {
      g.save();
      g.translate(ox / scale, -oy / scale);
      g.fillStyle = "#d5d5d5";
      g.strokeStyle = "#151515";
      g.lineWidth = 1;
      g.beginPath();
      g.roundRect(779, 29, 33, 15, 2);
      g.fill();
      g.stroke();
      image("coin", 768, 35, 22);
      text(coinLabel(earned), 796, 36, 15, "#151515", 0);
      g.restore();
    }
    drawModal();
    if (celebrate > 0 && scene === "home") drawRewardShower();
    g.restore();
  }
  function loop(now) {
    if (loaded < names.length || !fontsReady) {
      controls.style.visibility = "hidden";
      g.fillStyle = "#11131e";
      g.fillRect(0, 0, screenW, screenH);
      image("pea", screenW / 2, screenH / 2, 60, 60);
      rect(screenW / 2 - 50, screenH / 2 + 45, 100, 4, "#30373d");
      rect(
        screenW / 2 - 50,
        screenH / 2 + 45,
        (100 * loaded) / names.length,
        4,
        "#7de532",
      );
      last = now;
      requestAnimationFrame(loop);
      return;
    }
    controls.style.visibility = "";
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    g.clearRect(0, 0, screenW, screenH);
    render();
    requestAnimationFrame(loop);
  }
  window.addEventListener("resize", fit);
  fit();
  document.fonts.ready.then(() => {
    fontsReady = true;
    ui();
  });
  requestAnimationFrame(loop);
})();
