// A pasture: every agent is a drawn cow on a hill. Awake cows wander on slanted paths, face
// the way they walk, and stop now and then.
//   needs you  -> hops on the spot, red "! Name" bubble, tail going fast
//   done       -> gentle happy bounce, green "Done" bubble
//   working    -> walks with its head up, or stops to graze: head down, chewing
//   idle       -> lies down (eyes shut, ears down), breathes slowly with drifting zzz, never moves
// Animation is native (frames / loop / transition); one timer every 6s steps the awake cows.
import { View, div, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { agents, spaces, theme, run } from "herdr";

const GRASS = "#3fae4a";
const H = 280;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (l) => l[Math.floor(rnd(0, l.length))];
const TAU = Math.PI * 2;
// Push an angle off the straight axes (0, 90, 180, 270 degrees) so walks are always slanted.
const askew = (h) => {
  for (let i = 0; i < 8; i++) {
    const q = ((h % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
    if (Math.min(q, Math.PI / 2 - q) > 0.3) break;
    h += 0.45;
  }
  return h;
};
const STEP = 6000;
const kind = (s) => (s === "working" ? "eat" : s === "blocked" ? "need" : s === "done" ? "done" : "sleep");

const SKY_BANDS = ["#4fb0ec", "#62bdf0", "#76c8f2", "#8bd3f4", "#a0dcf6", "#b4e5f8", "#c8edf9", "#d9f3fa"];
const TUFTS = Array.from({ length: 60 }, () => ({ x: rnd(0, 99), y: rnd(120, H - 12), c: pick(["#4f9a2c", "#3f8a25", "#6fb03a", "#2f7a20"]), g: pick(["ʷ", "ʷʷ", "ψ", "ᴡ"]) }));
const FLOWERS = Array.from({ length: 12 }, () => ({ x: rnd(2, 98), y: rnd(130, H - 14), c: Math.random() < 0.5 ? "#ffffff" : "#e5383b" }));

export default class Field extends View {
  init(_p, cx) {
    this.pos = {};
    // Each tick an awake cow either walks to a nearby spot (the walk itself is a native
    // transition) or stops where it is for a while.
    cx.timer.every(STEP, (cx) => { this.roam(); cx.notify(); });
  }

  // Each walking cow keeps a heading that turns a little every tick, so its path curves
  // across the field in both directions at once. Headings are nudged away from straight
  // left/right/up/down, so a cow never walks along a perfect axis. Sleeping cows stay put.
  roam() {
    for (const a of agents()) {
      const p = this.pos[a.address];
      const k = p && kind(a.status);
      if (!p || k === "sleep") continue;
      p.moving = Math.random() < 0.7;
      if (!p.moving) continue;
      const f = k === "eat" ? 1 : 0.6;
      p.h = askew((p.h ?? rnd(0, TAU)) + rnd(-0.6, 0.6));
      let x = p.x + Math.cos(p.h) * 5.5 * f;
      let y = p.y + Math.sin(p.h) * 0.45 * f;
      // At an edge, turn back into the field at a fresh, slanted angle.
      if (x < 10 || x > 88) { p.h = askew(Math.PI - p.h + rnd(-0.4, 0.4)); x = Math.min(88, Math.max(10, x)); }
      if (y < 0 || y > 1) { p.h = askew(-p.h + rnd(-0.4, 0.4)); y = Math.min(1, Math.max(0, y)); }
      p.from = { x: p.x, y: p.y, at: Date.now() };
      p.x = x;
      p.y = y;
      p.face = Math.cos(p.h) < 0 ? -1 : 1;
    }
  }

  // Every cow gets a starting spot and a size (nearer cows are bigger) when it first appears.
  // The size never changes, so it doesn't pop as the cow walks. A spot is freed when its cow leaves.
  place(a) {
    const k = kind(a.status);
    if (!this.pos[a.address]) {
      const live = new Set(agents().map((x) => x.address));
      for (const addr of Object.keys(this.pos)) if (!live.has(addr)) delete this.pos[addr];
      const used = new Set(Object.values(this.pos).map((q) => q.slot));
      let slot = 0;
      while (used.has(slot)) slot++;
      // Golden-ratio spread: neighbours land far apart in both x and depth, never on one line.
      const y = Math.min(1, Math.max(0, ((slot * 0.382 + 0.15) % 1) + rnd(-0.06, 0.06)));
      this.pos[a.address] = {
        slot,
        x: 12 + ((slot * 0.618 + 0.1) % 1) * 76 + rnd(-3, 3),
        y,
        s: 1.0 + 0.45 * y,
        face: Math.random() < 0.5 ? -1 : 1,
        moving: false,
        kind: k,
      };
    }
    const p = this.pos[a.address];
    // Falling asleep mid-walk: stop here instead of sliding on to where it was heading.
    if (k === "sleep" && p.kind !== "sleep") {
      p.moving = false;
      if (p.from) {
        const done = Math.min(1, (Date.now() - p.from.at) / STEP);
        p.x = p.from.x + (p.x - p.from.x) * done;
        p.y = p.from.y + (p.y - p.from.y) * done;
      }
    }
    p.kind = k;
    return p;
  }

  // A cow drawn from shapes, mirrored to face the way it walks. Everything alive about it is a
  // native loop: stride, bounce, head, chewing, ears, tail, blinking, breathing.
  draw(a, k, pos) {
    const s = pos.s;
    const hide = k === "sleep" ? "#d6d3c8" : "#fbfaf4";
    const dark = "#2a2a2a";
    const sleepy = k === "sleep";
    const walking = !sleepy && pos.moving;
    const grazing = k === "eat" && !walking;
    const u = (n) => Math.round(n * s);
    // Mirrors a left edge within a parent `W` wide when the cow faces left.
    const mx = (l, w, W) => u(pos.face < 0 ? W - l - w : l);
    const box = (W, l, t, w, h, r, c) => div().absolute().left(mx(l, w, W)).top(u(t)).w(u(w)).h(u(h)).rounded(u(r)).bg(c);
    // Each cow keeps its own rhythm, so the herd doesn't move in step.
    const beat = (ms) => Math.round(ms * (1 + ((pos.slot * 0.37) % 1) * 0.3));

    // Blinks: a lid the colour of the face shows for one frame in twenty.
    const blink = Array.from({ length: 20 }, (_, i) => (i === (pos.slot * 7) % 20 ? "\u2588" : " "));
    const eye = (l) => sleepy
      ? box(30, l, 12, 7, 1.8, 1, dark)
      : box(30, l, 6, 9, 9, 5, "#ffffff").overflow_hidden()
          .child(box(9, 2.2, grazing ? 4 : 2.4, 4.8, 4.8, 3, "#000000")
            .child(box(4.8, 0.7, 0.7, 1.6, 1.6, 1, "#ffffff")))
          .child(div().absolute().left(u(-2)).top(u(-5)).text_size(u(18)).text_color(hide).frames(blink, 170));
    // Ears: drooping when asleep; otherwise they twitch.
    const ear = (l) => sleepy
      ? box(30, l, 11, 10, 6, 3, dark)
      : box(30, l, 5, 10, 6, 3, dark).loop("top", { from: u(5), to: u(3), period: beat(walking ? 900 : 1700) });
    const muzzle = box(30, 5, 19, 20, 13, 7, "#f4a6b4");
    const face = box(94, 60, sleepy ? 22 : 12, 30, 32, 14, hide)
      .child(box(30, 4, -6, 6, 8, 3, "#e8d9b0")).child(box(30, 20, -6, 6, 8, 3, "#e8d9b0"))
      .child(ear(-8)).child(ear(28))
      .child(box(30, 17, 0, 11, 9, 5, dark))
      .child(eye(3)).child(eye(17))
      .child(box(30, 1, 17, 5, 4, 2, "#ffb3c1").opacity(0.8)).child(box(30, 24, 17, 5, 4, 2, "#ffb3c1").opacity(0.8))
      // grazing cows chew
      .child(grazing ? muzzle.loop("height", { from: u(13), to: u(10), period: 340 }) : muzzle)
      .child(box(30, 10, 25, 3, 3.5, 2, "#a8566a")).child(box(30, 17, 25, 3, 3.5, 2, "#a8566a"));
    const head = grazing ? face.loop("top", { from: u(20), to: u(27), period: beat(1500) })
      : walking ? face.loop("top", { from: u(11), to: u(14), period: beat(800) })
      : k === "need" ? face.loop("top", { from: u(8), to: u(13), period: 420 })
      : sleepy ? face.loop("top", { from: u(22), to: u(23.5), period: 3200 })
      : face.loop("top", { from: u(11), to: u(13), period: beat(1400) });

    // A short tail sticking out behind, with a fluffy tip that flicks up and down.
    const wag = sleepy ? 3200 : k === "need" ? 260 : k === "done" ? 380 : walking ? 650 : 520;
    const flick = sleepy ? 1 : 3.5;
    const tail = [
      box(94, -4, 17, 9, 3, 2, dark),
      box(94, -6, 18, 3, 8, 2, dark),
      box(94, -10, 24, 8, 8, 4, dark).loop("top", { from: u(24 - flick), to: u(24 + flick), period: beat(wag) }),
    ];

    // Four short stubby legs. Walking is a simple little tap: diagonal pairs lift in turn.
    const leg = (l, phase) => {
      const el = box(94, l, 46, 8, 14, 3, hide).child(box(8, 0, 10, 8, 4, 2, dark));
      if (!walking) return el;
      return el.loop("top", { from: u(phase ? 43 : 46), to: u(phase ? 46 : 43), period: beat(520) });
    };

    const body = box(94, 3, 8, 68, 46, 23, hide);
    const p = a.program;
    const badge = box(94, 28, 24, 18, 18, 5, p?.tile ?? "#444444").flex().items_center().justify_center()
      .when(Boolean(p?.icon), (el) => el.child(image(p.icon).w(u(12)).h(u(12))));
    const cow = div().absolute().left(0).w(u(94)).h(u(62))
      .children(tail)
      // lying down: the legs are tucked away
      .when(!sleepy, (el) => el.child(leg(26, 1)).child(leg(58, 0)).child(leg(12, 0)).child(leg(46, 1)))
      .child(sleepy ? body.loop("height", { from: u(44), to: u(47), period: 3200 }) : body)
      .child(box(94, 11, 12, 18, 14, 7, dark)).child(box(94, 46, 28, 18, 16, 8, dark))
      .child(box(94, 24, 40, 11, 9, 4, dark))
      .child(badge).child(head);
    const bounce = k === "need" ? -7 : walking ? -1.5 : k === "done" ? -3 : 0;
    const period = k === "need" ? 420 : walking ? beat(520) : 900;
    const moved = bounce ? cow.loop("top", { from: 0, to: u(bounce), period }) : cow.top(sleepy ? u(6) : 0);
    return div().relative().w(u(94)).h(u(62)).child(moved);
  }

  cow(a, p, i) {
    const t = theme();
    const k = p.kind;
    const top = 96 + p.y * (H - 96 - 62 * p.s - 22);
    const label = a.space_name || a.program?.name || "";
    const bubble = k === "need"
      ? div().px(7).h(18).rounded(9).bg("#fff1f1").border(1.5).border_color(t.blocked).text_size(10).font_semibold().text_color(t.blocked).flex().items_center().whitespace_nowrap()
          .loop("opacity", { from: 0.5, to: 1, period: 600 }).child(`! ${a.program?.name ?? "Needs you"}`)
      : k === "done"
        ? div().px(7).h(18).rounded(9).bg("#effaf0").border(1.5).border_color(GRASS).text_size(10).font_semibold().text_color("#1f7a2e").flex().items_center().whitespace_nowrap().child("✓ Done")
        : k === "eat"
          ? div().text_size(11).frames(["\u{1F331}", "\u{1F33F}", "\u{1F331}", "\u{1F33E}"], 450)
          : div().text_size(11).font_bold().text_color("#33507a").frames(["z", "zz", "zzz", "zZz", "ZZZ", " "], 650);
    return div()
      .id(`cow-${a.address}`)
      // Pixels, not %: native transitions only glide between pixel values.
      .absolute().left(this.width ? Math.round((p.x / 100) * this.width) : `${p.x}%`).top(top)
      .transition("left", { duration: STEP, easing: "linear" })
      .transition("top", { duration: STEP, easing: "linear" })
      .flex().flex_col().items_center()
      .cursor_pointer()
      .on_click(() => run("pane.focus", { pane: a.pane }))
      .tooltip(`${label}: ${a.status}`)
      .child(div().h(20).flex().items_center().child(bubble))
      .child(this.draw(a, k, p))
      // The focused agent's label is a white chip: red text on green grass is hard to read.
      .child(div().max_w(96).truncate().text_size(10).text_color("#14210f").when(a.focused, (el) => el.px(5).rounded(4).font_semibold().bg("#ffffffd9")).child(label));
  }

  render() {
    const t = theme();
    const list = agents();
    list.forEach((a) => this.place(a));
    const ordered = [...list].sort((a, b) => this.pos[a.address].y - this.pos[b.address].y);
    const n = (k) => list.filter((a) => this.pos[a.address].kind === k).length;
    // A dot for the state, and dark text on a white chip: readable on any sky, in both themes.
    const stat = (count, word, color) => h_flex().gap(5).items_center().text_size(11).text_color(count ? "#16222b" : "#5a6772")
      .child(div().size(7).rounded(4).bg(count ? color : "#b4bcc2"))
      .child(`${count} ${word}`);
    const here = spaces().find((s) => s.active)?.name ?? "";
    const cloud = (l, tp, w) => div().absolute().left(l).top(tp).w(w).h(Math.round(w * 0.26)).rounded(40).bg("#ffffff").opacity(0.96)
      .child(div().absolute().left(Math.round(w * 0.18)).top(-Math.round(w * 0.14)).size(Math.round(w * 0.36)).rounded(60).bg("#ffffff"))
      .child(div().absolute().left(Math.round(w * 0.45)).top(-Math.round(w * 0.2)).size(Math.round(w * 0.42)).rounded(60).bg("#ffffff"));
    return div().id("field").size_full().relative().overflow_hidden().bg("#d9f3fa")
      .on_size_change((size, cx) => { this.width = size.width; cx.notify(); })
      .children(SKY_BANDS.map((c, i) => div().absolute().left(0).right(0).top(i * 14).h(15).bg(c)))
      // sun with a halo
      .child(div().absolute().top(24).right(90).size(78).rounded(40).bg("#fff3b0").opacity(0.45))
      .child(div().absolute().top(38).right(104).size(50).rounded(26).bg("#ffd84d"))
      .child(cloud("30%", 40, 130)).child(cloud("58%", 22, 110)).child(cloud("78%", 64, 90)).child(cloud("12%", 78, 70))
      // rolling hills
      .child(div().absolute().left("-12%").top(104).w("70%").h(520).rounded(400).bg("#a7d46a"))
      .child(div().absolute().left("35%").top(92).w("85%").h(520).rounded(400).bg("#93c957"))
      .child(div().absolute().left("-20%").top(158).w("140%").h(520).rounded(500).bg("#7fbd4a"))
      .children(TUFTS.map((u) => div().absolute().left(`${u.x}%`).top(u.y).text_size(11).text_color(u.c).opacity(0.7).child(u.g)))
      .children(FLOWERS.map((f) => div().absolute().left(`${f.x}%`).top(f.y).text_size(9).text_color(f.c).child("✿")))
      // title and counts
      .child(div().absolute().left(100).top(10).flex().flex_col()
        .child(div().text_size(20).font_semibold().text_color("#143a5c").child("The pasture"))
        .child(div().text_size(11).text_color("#143a5c").child(`${list.length} ${list.length === 1 ? "cow" : "cows"}, one happy herd.`)))
      .child(h_flex().absolute().right(16).top(10).h(24).px(10).gap(12).items_center().rounded(12).bg("#ffffffe6")
        .child(stat(n("eat"), "grazing", "#1f7a2e")).child(stat(n("need"), "need you", "#d62828"))
        .child(stat(n("done"), "done", "#16222b")).child(stat(n("sleep"), "sleeping", "#7a8791")))
      // welcome sign for the open space
      .child(div().absolute().left(14).top(70).w(8).h(100).bg("#5a3f22"))
      .child(div().absolute().left(8).top(58).px(10).py(6).rounded(5).border(2).border_color("#7a5530").bg("#3a2614").flex().flex_col()
        .child(div().text_size(8).text_color("#c9a878").child("WELCOME TO"))
        .child(div().text_size(14).text_color("#f1efe6").max_w(120).truncate().child(here)))
      .children(ordered.map((a, i) => this.cow(a, this.pos[a.address], i)))
      .when(list.length === 0, (el) => el.child(div().absolute().left(130).top(120).text_size(12).text_color("#14210f").child("The pasture is empty. Start an agent to bring a cow.")));
  }
}
