/* Tempo modular scene renderer (Cozy Room). Ported from the approved V2 prototype.
   Pure canvas drawing: it never saves anything; positions live only in memory.
   Layers, in order: background → ground → wall → objects + characters (depth-sorted by feet) → front → indicators.
   Every object has a position (box), anchor (bottom-centre), collision footprint and optional tap action.
   Nearest-neighbour scaling everywhere. Movement: arrow keys / WASD, or tap the floor. */

import { ACCESSORY_FIT, DOG_FIT } from "./accessories.js";

  const FOLDER = { you: "player", westie: "westie", cream: "bernedoodle_cream", bernie: "bernedoodle_black_white", charcoal: "bernedoodle_charcoal" };
  const FOLLOW = ["westie", "cream", "bernie", "charcoal"];
  const FOLLOW_CHANCE = { awake: 0.65, asleep: 0.25 }; // chance a dog follows when you start walking
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });

  async function loadPack(base = "/game/", { cafe = false } = {}) {
    const m = await (await fetch(base + "pack/manifest.json")).json();
    const sprites = {};
    await Promise.all(m.sprites.map(async sp => {
      const key = Object.keys(FOLDER).find(k => FOLDER[k] === sp.character);
      const img = await loadImg(base + "pack/" + sp.file);
      (sprites[key] = sprites[key] || {})[sp.pose] = { img, ax: sp.anchor[0], ay: sp.anchor[1] };
    }));
    // walk cycles: walk/<character>/<dir>/walk_<dir>_NN.png, anchor (160, 296), drawn at the size of the standing sprite
    try {
      const w = await (await fetch(base + "walk/manifest.json")).json();
      const IDLE_H = { avatar: 260, westie: 175 }; // README: normalised standing heights in the walk frames
      const WALK_KEY = { avatar: "you", westie: "westie", bernedoodle_cream: "cream", bernedoodle_black_white: "bernie", bernedoodle_charcoal: "charcoal" };
      await Promise.all(Object.entries(w.characters).map(async ([name, c]) => {
        const key = WALK_KEY[name]; if (!sprites[key]) return;
        const anim = {};
        for (const [dir, files] of Object.entries(c.animations)) {
          const imgs = await Promise.all(files.map(f => loadImg(base + "walk/" + f).catch(() => null)));
          anim[dir] = imgs.filter(Boolean);
        }
        const standH = sprites[key].front ? sprites[key].front.img.height : 150;
        sprites[key].walk = { anim, ax: w.anchor[0], ay: w.anchor[1], scale: standH / (IDLE_H[name] || 210) };
      }));
    } catch (e) { /* no walk cycles: characters glide in their standing pose */ }
    // idle / sleep & stretch / dog play animations: <pack>/<character>/<anim>/<anim>_NN.png on the same 320px canvas,
    // anchor (160, 296) and already sized to match the walk frames, so they share the walk frames' scale.
    // The avatar's bed sleep/wake frames are a 480px composite that replaces the bed while playing.
    const KEY = { avatar: "you", westie: "westie", bernedoodle_cream: "cream", bernedoodle_black_white: "bernie", bernedoodle_charcoal: "charcoal" };
    const IDLE_H = { avatar: 260, westie: 175 };
    const SKIP = { you: ["stretching", "yawning"] }; // the avatar uses the combined stretch_yawn sequence
    // Size match: some packs draw the dogs chunkier at the same height. Measured body area (opaque pixels)
    // against each dog's own walk cycle; these factors bring every animation back to the walking size.
    // (carrying_toy allows ~5% for the toy itself.)
    const SIZE_FIX = {
      westie:   { stretching: 0.87, yawning: 0.87, carrying_toy: 0.97 },
      cream:    { barking: 0.90, stretching: 0.88, yawning: 0.88, carrying_toy: 0.93, happy_bounce: 0.95 },
      bernie:   { barking: 0.83, stretching: 0.83, yawning: 0.84, carrying_toy: 0.92 },
      charcoal: { barking: 0.87, stretching: 0.89, yawning: 0.90, carrying_toy: 0.90, happy_bounce: 0.94 },
    };
    await Promise.all(["idle", "sleep", "play", "celebrate"].map(async dir => {
      let m; try { m = await (await fetch(base + dir + "/manifest.json")).json(); } catch (e) { return; }
      await Promise.all(Object.entries(m.animations).flatMap(([anim, chars]) => Object.entries(chars).map(async ([name, a]) => {
        const key = KEY[name]; if (!sprites[key] || (SKIP[key] || []).includes(anim)) return;
        const imgs = (await Promise.all(a.frames.map(f => loadImg(base + dir + "/" + f).catch(() => null)))).filter(Boolean);
        if (!imgs.length) return;
        const clip = { imgs, durs: a.frame_duration_ms || imgs.map(() => 300), loop: a.loop !== false, fix: (SIZE_FIX[key] || {})[anim] || 1 };
        if (a.composite_bed) {
          const bed = sprites[key].bed = sprites[key].bed || { ax: a.ground_anchor[0], ay: a.ground_anchor[1], anims: {} };
          bed.anims[anim] = clip; return;
        }
        const standH = sprites[key].front ? sprites[key].front.img.height : 150;
        const idle = sprites[key].idle = sprites[key].idle || { ax: m.ground_anchor[0], ay: m.ground_anchor[1], scale: standH / (IDLE_H[name] || 210), anims: {} };
        idle.anims[anim] = clip;
      })));
    }));
    // Café: you sitting at the laptop (table and chair are part of each frame). Only loaded for the café.
    // The seated (short-legs) frames draw the hood ~5% wider than the standing ones, so they're scaled to match (hood 187 → 178 px).
    // Every café pose loops while you work, except the one-off happy pose when a session ends.
    if (cafe && sprites.you) {
      try {
        const m = await (await fetch(base + "cafe/manifest.json")).json();
        const anims = {};
        await Promise.all(Object.entries(m.animations || {}).map(async ([name, a]) => {
          const imgs = (await Promise.all(a.frames.map(f => loadImg(base + "cafe/" + f).catch(() => null)))).filter(Boolean);
          if (imgs.length) anims[name] = { imgs, durs: imgs.map(() => 1000 / (a.fps || 8)), loop: name !== "happy" };
        }));
        const standH = sprites.you.front ? sprites.you.front.img.height : 150;
        sprites.you.cafe = { ax: m.ground_anchor[0], ay: m.ground_anchor[1], scale: (standH / 260) * (178 / 187), anims };
      } catch (e) { /* no café pack: you'll be drawn standing */ }
    }
    return sprites;
  }

  function place(o, img) {
    const [bx, by, bw, bh] = o.box;
    if (!img) return { x: bx, y: by, w: bw, h: bh, ax: bx + bw / 2, ay: by + bh };
    const s = Math.min(bw / img.width, bh / img.height);
    const w = Math.round(img.width * s), h = Math.round(img.height * s);
    const ax = Math.round(bx + bw / 2), ay = by + bh;
    return { x: ax - Math.round(w / 2), y: ay - h, w, h, ax, ay };
  }

  async function createScene(canvas, layout, opts = {}) {
    const g = canvas.getContext("2d");
    const [W, H] = layout.size;
    canvas.width = W; canvas.height = H;
    const bg = await loadImg((layout.assetBase || "") + layout.background);
    const saved = opts.savedBoxes || {};
    function relayout(o) {
      const p = place(o, o.img);
      const solid = o.solid ? { x: p.ax + o.solid[0], y: p.ay + o.solid[1], w: o.solid[2], h: o.solid[3] }
        : (o.layer === "object" && o.img ? { x: p.ax - p.w * 0.35, y: p.ay - Math.min(40, p.h * 0.2), w: p.w * 0.7, h: Math.min(40, p.h * 0.2) } : null);
      Object.assign(o, p, { solidRect: solid });
      return o;
    }
    const objs = await Promise.all(layout.objects.map(async o => {
      const img = o.src ? await loadImg((layout.assetBase || "") + o.src) : null;
      const box = saved[o.id] ? saved[o.id].slice() : o.box.slice();
      return relayout({ ...o, box, img, hidden: saved[o.id] === null });
    }));
    const sprites = opts.sprites || await loadPack(opts.base, { cafe: Boolean(layout.seated) });
    const cs = layout.castScale || 1;
    const chars = Object.entries(layout.cast).map(([k, [x, y, pose]]) => ({ key: k, x, y, pose, rest: pose, trail: [] }));
    const you = chars.find(c => c.key === "you");
    const state = { edit: false, drag: null, night: false, hover: null, picked: null, showBoxes: false, target: null, keys: new Set(), bob: 0 };

    const live = () => objs.filter(o => !o.hidden);
    function blocked(x, y) {
      const [x0, y0, x1, y1] = layout.walk;
      if (x < x0 || x > x1 || y < y0 || y > y1) return true;
      return live().some(o => o.solidRect && x > o.solidRect.x && x < o.solidRect.x + o.solidRect.w && y > o.solidRect.y && y < o.solidRect.y + o.solidRect.h);
    }

    const DIR = { front: "down", back: "up", left: "left", right: "right" };
    // Idle behaviour. Everyone breathes. Now and then a dog tilts its head, wags, yawns, stretches, barks or
    // trots on the spot with a toy; you stretch and yawn. In the room a dog may curl up for a nap and later wake.
    // Dogs placed asleep stay asleep for a while, then wake up.
    const breathe = now => ({ name: "idle_breathing", start: now, until: now + 4000 + Math.random() * 6000 });
    const flip = () => Math.random() < 0.5;
    function pickAct(c, A, now) {
      const r = Math.random();
      if (c.key === "you") return r < 0.25 && A.stretch_yawn ? { name: "stretch_yawn", start: now } : breathe(now);
      const menu = [["head_tilt", 0.16], ["tail_wag", 0.16, 2600], ["yawning", 0.1], ["stretching", 0.1], ["barking", 0.1], ["carrying_toy", 0.1, 3000]];
      if (layout.naps && A.falling_asleep) menu.push(["falling_asleep", 0.06]);
      let acc = 0;
      for (const [name, p, dur] of menu) {
        acc += p;
        if (r < acc && A[name] && name === "carrying_toy") {
          // the toy is a trot: carry it over to a new spot instead of trotting on the spot
          const spot = !state.edit && pickSpot(c);
          if (!spot) return breathe(now);
          c.goal = spot; c.toy = true; c.moving = true;
          return null;
        }
        if (r < acc && A[name]) return { name, start: now, until: dur ? now + dur : 0, flip: flip() };
      }
      return breathe(now);
    }
    const nap = now => ({ name: "sleeping", start: now, until: now + 20000 + Math.random() * 30000, held: true });
    function idleFrame(c, set, now) {
      const idle = set.idle;
      if (c.moving) { c.act = null; return null; }
      if (!idle || opts.reduceMotion) return null;
      const A = idle.anims;
      if (c.pose === "sleep" && (!c.act || !["sleeping", "waking_up", "falling_asleep"].includes(c.act.name))) c.act = A.sleeping ? nap(now) : null;
      if (c.pose === "sleep" && !c.act) return null;
      if (!c.act) c.act = breathe(now);
      if (c.act.until && now > c.act.until) {
        if (c.act.name === "sleeping") c.act = A.waking_up ? { name: "waking_up", start: now, flip: c.act.flip } : (c.pose = "sit", breathe(now));
        else c.act = c.act.name === "idle_breathing" ? pickAct(c, A, now) : breathe(now);
        if (!c.act) return null; // set off trotting with the toy
      }
      const a = A[c.act.name]; if (!a) { c.act = breathe(now); return A.idle_breathing ? idleFrame(c, set, now) : null; }
      const total = a.durs.reduce((x, y) => x + y, 0);
      let t = Math.max(0, now - c.act.start);
      if (!a.loop && t >= total) {
        const was = c.act.name;
        if (was === "falling_asleep") { c.pose = "sleep"; c.act = { ...nap(now), flip: c.act.flip }; }
        else if (was === "waking_up") { c.pose = "sit"; c.act = breathe(now); }
        else if (c.act.repeat > 0) c.act = { ...c.act, start: now, repeat: c.act.repeat - 1 };
        else if (c.act.then && A[c.act.then]) c.act = { name: c.act.then, start: now, until: now + 2600, flip: c.act.flip };
        else c.act = breathe(now);
        return idleFrame(c, set, now);
      }
      t = ((t % total) + total) % total;
      let i = 0; while (i < a.durs.length - 1 && t >= a.durs[i]) { t -= a.durs[i]; i++; }
      return { img: a.imgs[Math.min(i, a.imgs.length - 1)], flip: !!c.act.flip, idle, fix: a.fix || 1 };
    }
    // Night in the room: you go to bed (the bed picture is swapped for the bed-with-you frames). Walking wakes you.
    const bedObj = objs.find(o => o.id === "bed");
    function bedFrame(now) {
      const B = sprites.you && sprites.you.bed, s = state.bed; if (!B || !s || !bedObj || bedObj.hidden) return null;
      const a = B.anims[s.phase]; if (!a) return null;
      const total = a.durs.reduce((x, y) => x + y, 0);
      let t = opts.reduceMotion ? (s.phase === "waking_up" ? total : 0) : now - s.start;
      if (!a.loop && t >= total) { state.bed = null; you.x = bedObj.ax + bedObj.w * 0.62; you.y = Math.min(layout.walk[3] - 10, bedObj.ay + 30); return null; }
      t %= total; let i = 0; while (i < a.durs.length - 1 && t >= a.durs[i]) { t -= a.durs[i]; i++; }
      return { img: a.imgs[i], B };
    }
    function drawBed(o) {
      const fr = bedFrame(performance.now());
      if (!fr) { g.drawImage(o.img, o.x, o.y, o.w, o.h); return; }
      // the bed in these frames is 314px wide (of a 480px canvas); match the bed picture's width on screen
      const k = (o.w * 930 / 938) / 314, w = Math.round(fr.img.width * k), h = Math.round(fr.img.height * k);
      g.drawImage(fr.img, Math.round(o.ax - fr.B.ax * k), Math.round(o.ay - fr.B.ay * k), w, h);
    }
    const sizeOf = c => cs * (c.key === "you" ? (layout.youScale || 1) : (layout.dogScale || 1));
    // ── Dog accessories (Pet Shop / pet bowl) ───────────────────────────────
    // Each dog frame has a precomputed head anchor (public/game/accessories/anchors.json): where the
    // accessory's bottom-centre goes, which way the dog faces, and the head width. Front view for
    // front/back frames, side view (drawn facing right, mirrored for left) for side frames.
    const acc = { anchors: null, imgs: {}, worn: {} };
    const DOG_FOLDER = { westie: "westie", cream: "bernedoodle_cream", bernie: "bernedoodle_black_white", charcoal: "bernedoodle_charcoal" };
    const ACC_FIT = 0.82 / 130; // accessory size per pixel of the dog's head width (tuned on a contact sheet)
    const frameKey = img => { try { const p = new URL(img.src, location.href).pathname, i = p.indexOf("/game/"); return i >= 0 ? decodeURIComponent(p.slice(i + 6)) : null; } catch { return null; } };
    // phase: "behind" is drawn before the dog (only for back views, seen from behind), "front" after it
    function wear(c, img, x, y, k, flipped, kAcc, phase = "front") {
      const id = acc.worn[c.key]; if (!id || !acc.anchors) return;
      const a = acc.anchors[frameKey(img)]; if (!a) return;
      if ((a[2] === "back") !== (phase === "behind")) return;
      const [ax, ay, facing] = a, side = facing === "left" || facing === "right";
      const pic = acc.imgs[`${id}/${side ? "side" : "front"}`]; if (!pic) return;
      const ref = acc.anchors[`idle/${DOG_FOLDER[c.key]}/idle_breathing/idle_breathing_01.png`];
      // which way the dog looks on screen (a flipped side frame faces the other way)
      const view = side && flipped ? (facing === "left" ? "right" : "left") : facing;
      const f = { x: 0, y: 0, size: 1, ...(ACCESSORY_FIT[id] || {}) }, d = { x: 0, y: 0, size: 1, ...((DOG_FIT[c.key] || {})[view] || {}) };
      const s = (ref ? ref[3] : 130) * ACC_FIT * kAcc * f.size * d.size, size = Math.round(192 * s);
      const sx = (flipped ? 2 * Math.round(c.x) - (x + ax * k) : x + ax * k) + ((view === "left" ? -f.x : f.x) + d.x) * s;
      const sy = y + ay * k + (f.y + d.y) * s;
      const left = Math.round(sx - 96 * s), top = Math.round(sy - 176 * s);
      if ((facing === "left") !== Boolean(flipped) && side) { g.save(); g.translate(2 * Math.round(sx), 0); g.scale(-1, 1); g.drawImage(pic, left, top, size, size); g.restore(); }
      else g.drawImage(pic, left, top, size, size);
    }
    async function setAccessories(worn) {
      acc.worn = { ...(worn || {}) };
      const base = opts.base || "/game/";
      const ids = [...new Set(Object.values(acc.worn).filter(Boolean))];
      if (!ids.length) { render(); return; }
      if (!acc.anchors) { try { acc.anchors = await (await fetch(base + "accessories/anchors.json")).json(); } catch { return; } }
      await Promise.all(ids.flatMap(id => ["front", "side"].map(async v => {
        const key = `${id}/${v}`;
        if (!acc.imgs[key]) acc.imgs[key] = await loadImg(`${base}accessories/${key}.png`).catch(() => null);
      })));
      render();
    }

    function drawChar(c) {
      const set = sprites[c.key]; if (!set) return;
      // café: you stay seated at the laptop, playing whichever café animation the timer asks for
      if (c.key === "you" && layout.seated && set.cafe) {
        const A = set.cafe.anims, a = A[state.cafeAnim] || A.typing || Object.values(A)[0]; if (!a) return;
        const total = a.durs.reduce((x, y) => x + y, 0), t0 = opts.reduceMotion ? 0 : performance.now() - (state.cafeStart || 0);
        let t = a.loop ? t0 % total : Math.min(t0, total - 1), i = 0;
        while (i < a.durs.length - 1 && t >= a.durs[i]) { t -= a.durs[i]; i++; }
        const k = set.cafe.scale * sizeOf(c), img = a.imgs[i];
        g.drawImage(img, Math.round(c.x - set.cafe.ax * k), Math.round(c.y - set.cafe.ay * k), Math.round(img.width * k), Math.round(img.height * k));
        return;
      }
      if (c.key === "you" && state.bed && bedFrame(performance.now())) return; // you are in bed
      const cs = sizeOf(c), now = performance.now();
      // celebration hop: three little jumps over 0.9 s
      const ht = c.hop ? now - c.hop : 1e9, hop = !opts.reduceMotion && ht < 900 ? Math.round(Math.abs(Math.sin(ht / 300 * Math.PI)) * 34 * cs) : 0;
      const fr = idleFrame(c, set, now);
      if (fr) {
        const k = fr.idle.scale * cs * fr.fix, w = Math.round(fr.img.width * k), h = Math.round(fr.img.height * k);
        const x = Math.round(c.x - fr.idle.ax * k), y = Math.round(c.y - fr.idle.ay * k) - hop;
        g.fillStyle = "rgba(60,30,50,0.2)"; g.beginPath(); g.ellipse(c.x, c.y - 3, w * 0.22, 9 * cs, 0, 0, Math.PI * 2); g.fill();
        wear(c, fr.img, x, y, k, fr.flip, fr.idle.scale * cs, "behind");
        if (fr.flip) { g.save(); g.translate(Math.round(c.x) * 2, 0); g.scale(-1, 1); g.drawImage(fr.img, x, y, w, h); g.restore(); }
        else g.drawImage(fr.img, x, y, w, h);
        wear(c, fr.img, x, y, k, fr.flip, fr.idle.scale * cs); // accessory at the dog's normal head size
        return;
      }
      // trotting along with a toy in its mouth (the toy frames face right; mirror when heading left)
      const toy = c.moving && c.toy && c.goal && set.idle && set.idle.anims.carrying_toy;
      if (toy && !opts.reduceMotion) {
        const img = toy.imgs[Math.floor(now / 125) % toy.imgs.length], k = set.idle.scale * cs * (toy.fix || 1);
        const w = Math.round(img.width * k), h = Math.round(img.height * k), x = Math.round(c.x - set.idle.ax * k), y = Math.round(c.y - set.idle.ay * k);
        g.fillStyle = "rgba(60,30,50,0.2)"; g.beginPath(); g.ellipse(c.x, c.y - 3, w * 0.22, 9 * cs, 0, 0, Math.PI * 2); g.fill();
        wear(c, img, x, y, k, c.faceLeft, set.idle.scale * cs, "behind");
        if (c.faceLeft) { g.save(); g.translate(Math.round(c.x) * 2, 0); g.scale(-1, 1); g.drawImage(img, x, y, w, h); g.restore(); }
        else g.drawImage(img, x, y, w, h);
        wear(c, img, x, y, k, c.faceLeft, set.idle.scale * cs);
        return;
      }
      const walk = set.walk, frames = c.moving && walk && walk.anim[DIR[c.pose]];
      if (frames && frames.length) {
        const img = frames[Math.floor(performance.now() / 125) % frames.length], k = walk.scale * cs;
        g.fillStyle = "rgba(60,30,50,0.2)"; g.beginPath(); g.ellipse(c.x, c.y - 3, img.width * k * 0.22, 9 * cs, 0, 0, Math.PI * 2); g.fill();
        wear(c, img, Math.round(c.x - walk.ax * k), Math.round(c.y - walk.ay * k), k, false, k, "behind");
        g.drawImage(img, Math.round(c.x - walk.ax * k), Math.round(c.y - walk.ay * k), Math.round(img.width * k), Math.round(img.height * k));
        wear(c, img, Math.round(c.x - walk.ax * k), Math.round(c.y - walk.ay * k), k, false, k);
        return;
      }
      const sp = set[c.pose] || set.front; if (!sp) return;
      const w = Math.round(sp.img.width * cs), h = Math.round(sp.img.height * cs);
      const lift = (c.key === "you" && !opts.reduceMotion ? state.bob : 0) + hop;
      g.fillStyle = "rgba(60,30,50,0.2)"; g.beginPath(); g.ellipse(c.x, c.y - 3, w * 0.34, 9 * cs, 0, 0, Math.PI * 2); g.fill();
      wear(c, sp.img, Math.round(c.x - sp.ax * cs), Math.round(c.y - sp.ay * cs) - lift, cs, false, set.idle ? set.idle.scale * cs : cs, "behind");
      g.drawImage(sp.img, Math.round(c.x - sp.ax * cs), Math.round(c.y - sp.ay * cs) - lift, w, h);
      // still poses are drawn from smaller source pictures, so the accessory keeps the walking-frame size
      wear(c, sp.img, Math.round(c.x - sp.ax * cs), Math.round(c.y - sp.ay * cs) - lift, cs, false, set.idle ? set.idle.scale * cs : cs);
    }

    function render() {
      g.imageSmoothingEnabled = false;
      g.drawImage(bg, 0, 0, W, H);
      const by = layer => live().filter(o => o.layer === layer && o.img);
      by("ground").forEach(o => g.drawImage(o.img, o.x, o.y, o.w, o.h));
      by("wall").forEach(o => g.drawImage(o.img, o.x, o.y, o.w, o.h));
      const sorted = [...by("object").map(o => ({ y: o.ay, draw: () => o === bedObj ? drawBed(o) : g.drawImage(o.img, o.x, o.y, o.w, o.h) })),
        ...chars.map(c => ({ y: c.y, draw: () => drawChar(c) }))].sort((a, b) => a.y - b.y);
      sorted.forEach(d => d.draw());
      by("front").forEach(o => g.drawImage(o.img, o.x, o.y, o.w, o.h));
      if (state.night) {
        g.globalCompositeOperation = "multiply"; g.fillStyle = "#A897CF"; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = "screen"; g.fillStyle = "rgba(255,190,120,0.10)"; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = "source-over";
      }
      // indicators
      const mark = (o, col, dash) => { g.strokeStyle = col; g.lineWidth = 4; g.setLineDash(dash); g.strokeRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4); g.setLineDash([]); };
      if (state.hover && state.hover !== state.picked) mark(state.hover, "rgba(217,70,127,0.55)", [10, 8]);
      if (state.picked) mark(state.picked, "#D9467F", [14, 8]);
      if (state.edit) {
        live().forEach(o => { g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 2; g.setLineDash([6, 6]); g.strokeRect(o.x, o.y, o.w, o.h); g.setLineDash([]); });
        if (state.sel) { g.strokeStyle = "#D9467F"; g.lineWidth = 5; g.strokeRect(state.sel.x, state.sel.y, state.sel.w, state.sel.h);
          g.fillStyle = "#D9467F"; g.fillRect(state.sel.x + state.sel.w - 14, state.sel.y + state.sel.h - 14, 28, 28); }
      }
      if (state.showBoxes) {
        live().forEach(o => {
          g.strokeStyle = "rgba(60,120,255,0.7)"; g.lineWidth = 2; g.strokeRect(o.x, o.y, o.w, o.h);
          if (o.solidRect) { g.fillStyle = "rgba(255,60,60,0.28)"; g.fillRect(o.solidRect.x, o.solidRect.y, o.solidRect.w, o.solidRect.h); }
          g.fillStyle = "#1d4ed8"; g.beginPath(); g.arc(o.ax, o.ay, 5, 0, 7); g.fill();
        });
        const [x0, y0, x1, y1] = layout.walk; g.strokeStyle = "rgba(0,160,80,0.8)"; g.setLineDash([12, 8]); g.strokeRect(x0, y0, x1 - x0, y1 - y0); g.setLineDash([]);
      }
    }

    // movement: you walk, the dogs follow your trail
    let last = performance.now(), raf = 0;
    function step(t) {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      let dx = 0, dy = 0;
      const k = state.keys;
      if (k.has("ArrowLeft") || k.has("a")) dx -= 1; if (k.has("ArrowRight") || k.has("d")) dx += 1;
      if (k.has("ArrowUp") || k.has("w")) dy -= 1; if (k.has("ArrowDown") || k.has("s")) dy += 1;
      if (!dx && !dy && state.target) {
        const tx = state.target[0] - you.x, ty = state.target[1] - you.y, d = Math.hypot(tx, ty);
        if (d < 8) state.target = null; else { dx = tx / d; dy = ty / d; }
      }
      let moving = false;
      if (layout.seated) { dx = dy = 0; state.target = null; } // seated in the café: you stay at your table
      if ((dx || dy) && state.bed) {
        // in bed: wanting to move gets you up first
        if (state.bed.phase === "sleeping") state.bed = { phase: "waking_up", start: performance.now() };
        dx = dy = 0; state.target = null;
      }
      const now = performance.now();
      if (dx || dy) { state.lastInput = now; chars.forEach(c => { c.goal = null; }); }
      else maybeWander(now);
      if (dx || dy) {
        const len = Math.hypot(dx, dy), sp = 260 * cs * dt;
        const nx = you.x + (dx / len) * sp, ny = you.y + (dy / len) * sp;
        if (!blocked(nx, you.y)) you.x = nx; else state.target = null;
        if (!blocked(you.x, ny)) you.y = ny; else state.target = null;
        you.pose = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "back" : "front");
        you.trail.unshift([you.x, you.y]); if (you.trail.length > 400) you.trail.pop();
        moving = true; you.moving = true;
        // exits: walking (yourself, not wandering) into an exit area leads somewhere else, e.g. the room's door → town
        const exit = !state.exited && (layout.exits || []).find(e => you.x >= e.area[0] && you.x <= e.area[2] && you.y >= e.area[1] && you.y <= e.area[3]);
        if (exit) { state.exited = true; state.keys.clear(); state.target = null; opts.onExit && opts.onExit(exit.action); }
        state.bob = sprites.you && sprites.you.walk ? 0 : (Math.floor(t / 140) % 2 ? 3 : 0);
      } else if (you.goal) { stroll(you, 110 * cs * dt, now); state.bob = 0; }
      else { you.pose = "front"; state.bob = 0; you.moving = false; }
      // Each time you set off, every dog rolls the dice: it may tag along or carry on with its own thing.
      // Sleeping dogs are less keen to get up. (Chances live in FOLLOW_CHANCE.)
      if (moving && !state.wasMoving) {
        FOLLOW.forEach(key => {
          const c = chars.find(ch => ch.key === key); if (!c) return;
          c.following = Math.random() < (c.pose === "sleep" ? FOLLOW_CHANCE.asleep : FOLLOW_CHANCE.awake);
        });
      }
      // followers trot to a point further back on your trail
      FOLLOW.forEach((key, i) => {
        const c = chars.find(ch => ch.key === key); if (!c) return;
        const p = you.trail[(i + 1) * 14];
        if (moving && !c.following) return; // staying put this time: keeps idling where it is
        if (moving && p) {
          const ddx = p[0] - c.x, ddy = p[1] - c.y, d = Math.hypot(ddx, ddy);
          c.moving = d > 4;
          if (d > 4) {
            const s = Math.min(d, 270 * cs * dt);
            c.x += (ddx / d) * s; c.y += (ddy / d) * s;
            c.pose = Math.abs(ddx) > Math.abs(ddy) ? (ddx < 0 ? "left" : "right") : (ddy < 0 ? "back" : "front");
          }
        } else if (!moving && c.goal) stroll(c, 125 * cs * dt, now);
        else if (!moving) { c.moving = false; c.pose = state.wasMoving && c.following ? "sit" : c.pose; }
      });
      state.wasMoving = moving;
      render();
      raf = moving || state.keys.size || state.target || chars.some(c => c.goal) ? requestAnimationFrame(step) : 0;
    }

    // Free time: a few seconds after you stop steering, you and the dogs stroll about on your own,
    // pausing between walks to breathe, wag, yawn and so on. Any key or tap takes control back at once.
    // Dogs keep to spots near you; sleeping dogs stay put. Nothing here is saved anywhere.
    state.lastInput = performance.now();
    const BUSY = ["head_tilt", "yawning", "stretching", "barking", "falling_asleep", "waking_up", "stretch_yawn", "sleeping"];
    function clearPath(x0, y0, x1, y1) {
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 10));
      for (let i = 1; i <= n; i++) if (blocked(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)) return false;
      return true;
    }
    function pickSpot(c) {
      const dog = c.key !== "you", r = (dog ? 220 : 300) * cs;
      const cx = dog ? (c.x + you.x) / 2 : c.x, cy = dog ? (c.y + you.y) / 2 : c.y;
      for (let n = 0; n < 14; n++) {
        const a = Math.random() * Math.PI * 2, d = (0.35 + Math.random() * 0.65) * r;
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.6;
        // keep a little personal space from everyone else (where they are and where they're heading)
        const crowded = chars.some(o => o !== c && [[o.x, o.y], o.goal].some(p => p && Math.hypot(p[0] - x, (p[1] - y) * 1.6) < 95 * cs));
        if (!crowded && Math.hypot(x - c.x, y - c.y) > 40 * cs && clearPath(c.x, c.y, x, y)) return [x, y];
      }
      return null;
    }
    const rest = () => 3000 + Math.random() * 7000;
    function maybeWander(now) {
      if (state.edit || state.bed || opts.reduceMotion || state.keys.size || state.target || now - state.lastInput < 3000) return false;
      let started = false;
      chars.forEach(c => {
        if (c.goal || c.moving || c.pose === "sleep" || (c.act && BUSY.includes(c.act.name))) return;
        if (c.key === "you" && layout.seated) return;
        if (!c.nextWander) { c.nextWander = now + rest(); return; }
        if (now < c.nextWander) return;
        c.nextWander = now + rest();
        const spot = pickSpot(c); if (!spot) return;
        c.goal = spot; c.act = null; c.toy = false; started = true;
      });
      return started;
    }
    function stroll(c, sp, now) {
      const dx = c.goal[0] - c.x, dy = c.goal[1] - c.y, d = Math.hypot(dx, dy);
      if (d < 6 || blocked(c.x + (dx / d) * sp, c.y + (dy / d) * sp)) {
        c.goal = null; c.moving = false; c.toy = false; c.nextWander = now + rest();
        if (c.key === "you") c.pose = "front";
        return;
      }
      const s = Math.min(d, sp);
      c.x += (dx / d) * s; c.y += (dy / d) * s; c.moving = true;
      if (Math.abs(dx) > 2) c.faceLeft = dx < 0;
      c.pose = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "back" : "front");
      if (c.key === "you") { you.trail.unshift([you.x, you.y]); if (you.trail.length > 400) you.trail.pop(); }
    }
    const kick = () => { if (state.destroyed) return; if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };

    function toScene(e) {
      const r = canvas.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
    }
    function hit(x, y) {
      const L = live(), order = [...L.filter(o => o.layer === "front"), ...L.filter(o => o.layer === "object").sort((a, b) => b.ay - a.ay), ...L.filter(o => o.layer === "wall"), ...L.filter(o => o.layer === "ground")];
      return order.find(o => o.tap && x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) || null;
    }
    function hitAny(x, y) {
      const L = live(), order = [...L.filter(o => o.layer === "front"), ...L.filter(o => o.layer === "object").sort((a, b) => b.ay - a.ay), ...L.filter(o => o.layer === "wall"), ...L.filter(o => o.layer === "ground")];
      return order.find(o => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) || null;
    }
    function changed() { opts.onChange && opts.onChange(api.exportBoxes()); }
    const listeners = new AbortController(); // destroy() detaches every canvas listener at once
    const on = { signal: listeners.signal };
    canvas.addEventListener("pointerdown", e => {
      if (!state.edit) return;
      const [x, y] = toScene(e), sel = state.sel;
      const onHandle = sel && x > sel.x + sel.w - 24 && x < sel.x + sel.w + 14 && y > sel.y + sel.h - 24 && y < sel.y + sel.h + 14;
      const o = onHandle ? sel : hitAny(x, y);
      state.sel = o; opts.onSelect && opts.onSelect(o);
      if (o) { state.drag = { o, x, y, box: o.box.slice(), resize: onHandle }; canvas.setPointerCapture(e.pointerId); }
      render(); e.preventDefault();
    }, on);
    canvas.addEventListener("pointermove", e => {
      const [x, y] = toScene(e);
      if (state.edit && state.drag) {
        const d = state.drag, dx = Math.round(x - d.x), dy = Math.round(y - d.y);
        if (d.resize) {
          // keep the bottom-centre (feet) where it is, grow/shrink evenly
          const f = Math.max(0.2, (d.box[2] + dx * 2) / d.box[2]);
          const nw = Math.round(d.box[2] * f), nh = Math.round(d.box[3] * f);
          d.o.box = [Math.round(d.box[0] + d.box[2] / 2 - nw / 2), d.box[1] + d.box[3] - nh, nw, nh];
        } else d.o.box = [d.box[0] + dx, d.box[1] + dy, d.box[2], d.box[3]];
        relayout(d.o); render(); return;
      }
      if (state.edit) { const h = hitAny(x, y); canvas.style.cursor = h ? "move" : "default"; return; }
      const h = hit(x, y); if (h !== state.hover) { state.hover = h; canvas.style.cursor = h ? "pointer" : "default"; render(); }
    }, on);
    canvas.addEventListener("pointerup", () => { if (state.drag) { state.drag = null; changed(); } }, on);
    canvas.addEventListener("click", e => {
      if (state.edit) return;
      const [x, y] = toScene(e); const h = hit(x, y);
      state.picked = h;
      if (h) opts.onTap && opts.onTap(h.tap, h);
      else if (!blocked(x, y) && !layout.seated) { state.target = [x, y]; state.lastInput = performance.now(); chars.forEach(c => { c.goal = null; }); kick(); }
      render();
    }, on);

    let idleTimer = 0;
    function idleLoop(on) {
      clearInterval(idleTimer);
      if (on && !opts.reduceMotion) idleTimer = setInterval(() => { if (document.hidden || raf || !canvas.isConnected) return; if (maybeWander(performance.now())) kick(); else { render(); if (chars.some(c => c.goal)) kick(); } }, 100);
    }
    idleLoop(true);
    const api = {
      render,
      setActive(v) { idleLoop(v); },
      // stop every timer and frame loop (call when the room is closed)
      destroy() { state.destroyed = true; listeners.abort(); idleLoop(false); if (raf) cancelAnimationFrame(raf); raf = 0; },
      setNight(v) {
        if (v !== state.night && bedObj && sprites.you && sprites.you.bed) {
          if (v) state.bed = { phase: "sleeping", start: performance.now() };
          else if (state.bed) state.bed = { phase: "waking_up", start: performance.now() };
        }
        state.night = v; render();
      },
      // Task completed: everyone celebrates. Dogs wake if napping, bark, then wag at you; you hop for joy.
      celebrate() {
        const now = performance.now();
        chars.forEach(c => { c.goal = null; c.moving = false; }); state.lastInput = now;
        if (state.bed && state.bed.phase === "sleeping") state.bed = { phase: "waking_up", start: now };
        // Task done: you cheer twice; each dog does a happy bounce twice (one after another), then wags.
        // Uses the celebration pack when it's there; otherwise falls back to a hop and barking.
        chars.forEach((c, i) => {
          const A = sprites[c.key] && sprites[c.key].idle && sprites[c.key].idle.anims;
          if (c.key === "you") { if (A && A.celebrate && !opts.reduceMotion) c.act = { name: "celebrate", start: now, repeat: 1 }; else c.hop = now; return; }
          if (!A) return;
          if (c.pose === "sleep") c.pose = "sit";
          c.act = A.happy_bounce ? { name: "happy_bounce", start: now + i * 90, repeat: 1, then: "tail_wag", flip: c.x > you.x }
            : A.barking ? { name: "barking", start: now + i * 120, flip: c.x > you.x, then: "tail_wag" }
            : { name: "tail_wag", start: now, until: now + 2600, flip: c.x > you.x };
        });
        // smooth frames while everyone celebrates (the idle loop only redraws 10 times a second)
        const tick = () => { if (!raf) render(); if (performance.now() - now < 1900) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      },
      setShowBoxes(v) { state.showBoxes = v; render(); },
      setEdit(v) { state.edit = v; state.sel = null; state.keys.clear(); state.target = null; canvas.style.cursor = "default"; canvas.style.touchAction = v ? "none" : "manipulation"; chars.forEach(c => { c.goal = null; c.moving = false; }); render(); },
      // Edit room: add a piece (e.g. from storage) and select it so it can be dragged into place.
      async addObject(o) {
        const img = o.src ? await loadImg((layout.assetBase || "") + o.src) : null;
        const obj = relayout({ ...o, box: o.box.slice(), img, hidden: false });
        objs.push(obj); state.sel = obj; opts.onSelect && opts.onSelect(obj); render(); changed(); return obj.id;
      },
      // every piece still in the room, as saved by the game (removed pieces are left out)
      // café: choose what you're doing at the laptop (typing, thinking, sip_drink, dozing, happy)
      // dress the dogs: { westie: "bunny_ears", cream: null, ... }
      setAccessories,
      setCafeAnim(name) { if (state.cafeAnim === name) return; state.cafeAnim = name; state.cafeStart = performance.now(); render(); },
      exportPlaced() { return objs.filter(o => !o.hidden && o.item).map(o => ({ uid: o.id, item: o.item, box: o.box.map(Math.round) })); },
      exportBoxes() { const out = {}; objs.forEach(o => { out[o.id] = o.hidden ? null : o.box.map(Math.round); }); return out; },
      resetBoxes() { objs.forEach(o => { const orig = layout.objects.find(x => x.id === o.id); o.box = orig.box.slice(); o.hidden = false; relayout(o); }); state.sel = null; render(); },
      restoreRemoved() { const back = objs.filter(o => o.hidden); back.forEach(o => { o.hidden = false; }); render(); if (back.length) changed(); return back.map(o => o.id); },
      removeSelected() { const o = state.sel; if (!o) return null; o.hidden = true; state.sel = null; opts.onSelect && opts.onSelect(null); render(); changed(); return o.id; },
      key(e, down) {
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (state.edit) {
          const o = state.sel; if (!o || !down) return false;
          if (k === "Delete" || k === "Backspace") { api.removeSelected(); return true; }
          const step = e.shiftKey ? 10 : 2, b = o.box;
          if (k === "ArrowLeft") b[0] -= step; else if (k === "ArrowRight") b[0] += step;
          else if (k === "ArrowUp") b[1] -= step; else if (k === "ArrowDown") b[1] += step;
          else if (k === "+" || k === "=" || k === "-" || k === "_") {
            const f = (k === "+" || k === "=") ? 1.05 : 1 / 1.05, nw = Math.round(b[2] * f), nh = Math.round(b[3] * f);
            o.box = [Math.round(b[0] + b[2] / 2 - nw / 2), b[1] + b[3] - nh, nw, nh];
          } else return false;
          relayout(o); render(); changed(); return true;
        }
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d"].includes(k)) return false;
        if (down) { state.keys.add(k); state.lastInput = performance.now(); } else state.keys.delete(k);
        kick(); return true;
      },
      objects: objs, size: [W, H], cast: chars,
    };
    render();
    return api;
  }

export { createScene, loadPack };
