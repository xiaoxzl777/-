/**
 * 广州景点插画库：统一的扁平画风，颜色全部走 CSS 令牌（深色模式自动换成夜景配色）。
 * 带 a-* 类的部件在鼠标悬停时会动（样式见 base.css）。
 * 数据库 poi.illustration 存的就是这里的名字。
 */

export const ILLUSTRATIONS = [
  { name: 'canton-tower', label: '广州塔与江景' },
  { name: 'ancestral-hall', label: '岭南祠堂' },
  { name: 'arcade-street', label: '骑楼老街' },
  { name: 'western-villa', label: '欧式老建筑' },
  { name: 'city-park', label: '城市公园' },
  { name: 'mountain', label: '山景' },
  { name: 'river-night', label: '珠江夜景' },
  { name: 'safari', label: '动物园' },
  { name: 'museum', label: '博物馆' },
  { name: 'temple', label: '寺庙' },
  { name: 'water-town', label: '湿地水乡' },
  { name: 'dim-sum', label: '早茶与粤菜' },
] as const;

export type SceneName = (typeof ILLUSTRATIONS)[number]['name'] | 'hero';

const W = 400;
const H = 300;

const sky = (id: string, w = W, h = H) => `<rect width="${w}" height="${h}" fill="url(#${id}s)"/>`;
const water = (id: string, y: number, w = W, h = H) => `<rect y="${y}" width="${w}" height="${h - y}" fill="url(#${id}w)"/>`;
const sun = (x: number, y: number, r: number) =>
  `<g class="a-sun"><circle class="f-glow" cx="${x}" cy="${y}" r="${r * 1.8}"/><circle class="f-sun" cx="${x}" cy="${y}" r="${r}"/></g>`;
const ripples = (d: string) => `<path class="s-line a-ripple" stroke-width="1.6" d="${d}"/>`;
const steam = (d: string) => `<path class="s-line a-steam" stroke-width="2" d="${d}"/>`;
const birds = (x: number, y: number) =>
  `<path class="s-ink a-birds" stroke-width="1.8" d="M${x} ${y}q6-5 12 0q6-5 12 0M${x + 30} ${y + 14}q4-4 8 0q4-4 8 0"/>`;
const FAR = '<path class="f-far" d="M0 150C40 122 84 112 124 128C164 144 196 100 244 112C292 124 324 96 364 110C382 116 394 122 400 126V230H0Z"/>';
const MID = '<path class="f-mid" d="M0 178C52 152 92 158 132 168C182 180 214 150 262 160C312 170 352 156 400 166V230H0Z"/>';

const trees = (x: number, y: number, s = 1, cls = 'f-deep') =>
  `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-14" r="14"/><circle cx="14" cy="-10" r="11"/><circle cx="-13" cy="-9" r="10"/><rect x="-3" y="-4" width="6" height="10"/></g>`;

/** 中式屋顶：两端微微翘起 */
function roof(cx: number, y: number, w: number, h: number, cls: string) {
  const l = cx - w / 2;
  const r = cx + w / 2;
  return `<path class="${cls}" d="M${l} ${y}Q${l + w * 0.12} ${y - 2} ${l + w * 0.18} ${y - h * 0.45}L${cx - w * 0.22} ${y - h}H${cx + w * 0.22}L${r - w * 0.18} ${y - h * 0.45}Q${r - w * 0.12} ${y - 2} ${r} ${y}Q${cx} ${y - h * 0.28} ${l} ${y}Z"/>`;
}

const boat = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><g class="a-boat"><path class="f-ink2" d="M-42 0Q0 16 42 0L36-6H-36Z"/><path class="f-ink" d="M-18-6V-22Q0-34 18-22V-6Z"/><path class="s-line" stroke-width="1.6" d="M-36 8h72"/></g></g>`;

function leaf(x: number, y: number, r: number, cls: string) {
  const p1 = [x + r * 0.985, y - r * 0.174];
  const p2 = [x + r * 0.766, y - r * 0.643];
  return `<path class="${cls}" d="M${x} ${y}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}A${r} ${r} 0 1 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z"/>`;
}

const lotus = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><g class="a-lotus"><path class="s-deep" stroke-width="3" d="M0 4V48"/><path class="f-warm2" d="M0 0C-10-8-10-24 0-34C10-24 10-8 0 0Z"/><path class="f-warm2" opacity=".85" d="M0 0C-18-2-26-16-22-28C-10-24-2-12 0 0Z"/><path class="f-warm2" opacity=".85" d="M0 0C18-2 26-16 22-28C10-24 2-12 0 0Z"/><path class="f-warm" opacity=".5" d="M0 0C-6-6-6-16 0-22C6-16 6-6 0 0Z"/></g></g>`;

/** 广州塔（小蛮腰）：上下宽、中间细 */
function cantonTower(cx: number, base: number, s: number) {
  const body = 'M-24 0C-12-52-7-86-8-104C-9-126-14-150-15-164H15C14-150 9-126 8-104C7-86 12-52 24 0Z';
  let rings = '';
  for (let i = 1; i <= 7; i++) {
    const y = -i * 21;
    const half = y > -104 ? 24 - (Math.abs(y) / 104) * 16 : 8 + ((Math.abs(y) - 104) / 60) * 7;
    rings += `M${(-half).toFixed(1)} ${y}H${half.toFixed(1)}`;
  }
  return `<g transform="translate(${cx} ${base}) scale(${s})">` +
    `<path class="f-ink" d="${body}"/>` +
    `<path class="s-line" stroke-width="1.4" opacity=".45" d="${rings}M-20-10L12-150M20-10L-12-150"/>` +
    '<rect class="f-ink2" x="-17" y="-172" width="34" height="9" rx="2"/>' +
    '<rect class="f-ink" x="-2" y="-214" width="4" height="44"/>' +
    '<circle class="f-warm2 a-twinkle" cx="0" cy="-216" r="3.5"/></g>';
}

/** 岭南镬耳墙 */
const wokGable = (x: number, base: number, w: number, h: number, cls: string) =>
  `<path class="${cls}" d="M${x} ${base}V${base - h * 0.62}C${x} ${base - h} ${x + w} ${base - h} ${x + w} ${base - h * 0.62}V${base}Z"/>`;

/** 榕树：宽树冠 + 气根 */
function banyan(x: number, y: number, s = 1) {
  let roots = '';
  [-30, -18, -6, 10, 24, 36].forEach((dx, i) => {
    roots += `M${dx} -46C${dx + 2} -34 ${dx - 2} -22 ${dx + 1} ${-12 + (i % 3) * 6}`;
  });
  return `<g transform="translate(${x} ${y}) scale(${s})"><path class="f-ink2" d="M-6 0L-4-44H6L8 0Z"/>` +
    `<path class="s-deep a-sway" stroke-width="1.6" d="${roots}"/>` +
    '<g class="a-tree f-deep"><circle cx="-26" cy="-58" r="22"/><circle cx="0" cy="-70" r="28"/><circle cx="28" cy="-58" r="22"/><circle cx="-8" cy="-50" r="18"/><circle cx="16" cy="-48" r="18"/></g></g>';
}

/** 木棉：枝干 + 橙红花朵（广州市花） */
function kapok(x: number, y: number, s = 1) {
  const flowers = [[-26, -70], [-12, -88], [8, -94], [26, -78], [-34, -52], [34, -58], [-2, -66], [16, -60]]
    .map(([fx, fy], i) => `<circle class="${i % 3 === 2 ? 'f-warm2' : 'f-warm'}" cx="${fx}" cy="${fy}" r="${i % 2 ? 6 : 7.5}"/>`)
    .join('');
  return `<g transform="translate(${x} ${y}) scale(${s})"><path class="s-ink" stroke-width="5" d="M0 0V-48"/>` +
    '<path class="s-ink" stroke-width="3" d="M0-40L-28-66M0-46L-10-86M0-48L10-90M0-42L26-74M0-30L-32-48M0-32L32-54"/>' +
    `<g class="a-bloom">${flowers}</g></g>`;
}

/** 城市天际线 */
function skyline(y: number, cls: string, seed: number, width = W) {
  let d = '';
  let x = -6;
  let i = seed;
  while (x < width) {
    const w = 16 + ((i * 13) % 18);
    const h = 18 + ((i * 29) % 46);
    d += `M${x} ${y}V${y - h}H${x + w}V${y}Z`;
    x += w + 3;
    i++;
  }
  return `<path class="${cls}" d="${d}"/>`;
}

const giraffe = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><g class="a-walker">` +
  '<path class="f-warm2" d="M-12 0V-26M12 0V-26" stroke-width="0"/>' +
  '<rect class="f-warm2" x="-26" y="-30" width="6" height="30"/><rect class="f-warm2" x="-12" y="-30" width="6" height="30"/><rect class="f-warm2" x="14" y="-30" width="6" height="30"/><rect class="f-warm2" x="26" y="-30" width="6" height="30"/>' +
  '<ellipse class="f-warm2" cx="3" cy="-38" rx="34" ry="15"/>' +
  '<g class="a-neck"><path class="f-warm2" d="M18-44L42-118L54-114L34-40Z"/><ellipse class="f-warm2" cx="54" cy="-118" rx="14" ry="8"/>' +
  '<path class="s-ink" stroke-width="2.4" d="M46-126V-136M54-126V-136"/><circle class="f-ink" cx="56" cy="-121" r="1.8"/>' +
  '<g class="f-warm"><circle cx="40" cy="-94" r="4"/><circle cx="34" cy="-72" r="4.5"/><circle cx="46" cy="-108" r="3"/></g></g>' +
  '<g class="f-warm"><circle cx="-14" cy="-40" r="5"/><circle cx="4" cy="-44" r="5.5"/><circle cx="20" cy="-36" r="4.5"/><circle cx="-4" cy="-32" r="4"/></g>' +
  '</g></g>';

const acacia = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path class="s-ink" stroke-width="4" d="M0 0V-36L-16-52M0-36L18-50"/><g class="a-tree"><ellipse class="f-deep" cx="0" cy="-56" rx="46" ry="11"/><ellipse class="f-near" cx="6" cy="-62" rx="30" ry="7"/></g></g>`;

/** 蒸笼：一圈包子，避免排成三角形看起来像一张脸 */
function steamer(x: number, y: number, r: number) {
  const buns = [0, 1, 2, 3, 4]
    .map(i => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const bx = (Math.cos(a) * r * 0.46).toFixed(1);
      const by = (Math.sin(a) * r * 0.46).toFixed(1);
      return `<circle class="f-sun" cx="${bx}" cy="${by}" r="${(r * 0.24).toFixed(1)}"/>` +
        `<path class="s-ink" stroke-width="1.2" opacity=".28" d="M${bx} ${by}m-${(r * 0.09).toFixed(1)} 0l${(r * 0.09).toFixed(1)}-${(r * 0.1).toFixed(1)}l${(r * 0.09).toFixed(1)} ${(r * 0.1).toFixed(1)}"/>`;
    })
    .join('');
  return `<g transform="translate(${x} ${y})"><circle class="f-warm2" r="${r}"/><circle class="s-ink" stroke-width="2" opacity=".3" r="${r - 6}"/>` +
    `${buns}<circle class="f-sun" r="${(r * 0.2).toFixed(1)}"/></g>`;
}

/** 首页大图用的木棉花枝，从左上角伸进画面 */
function kapokBranch() {
  const flowers = [[100, 154], [190, 20], [264, 108], [48, 22], [304, 48], [132, 70], [236, 58], [10, 132]]
    .map(([x, y], i) => `<circle class="f-warm" cx="${x}" cy="${y}" r="${i % 2 ? 11 : 14}"/><circle class="f-warm2" cx="${x}" cy="${y}" r="${i % 2 ? 4 : 5}"/>`)
    .join('');
  return '<path class="s-ink" stroke-width="15" d="M-24 98C30 88 80 76 124 70"/>' +
    '<path class="s-ink" stroke-width="10" d="M120 70C160 64 190 66 214 64"/>' +
    '<path class="s-ink" stroke-width="6" d="M210 64C250 62 280 58 304 48"/>' +
    '<path class="s-ink" stroke-width="6" d="M68 82C82 108 96 130 100 152M150 66C156 42 172 26 190 18M226 62C242 82 252 98 264 106M36 88C28 60 34 38 48 22M20 94C12 110 10 120 10 132"/>' +
    `<g class="a-bloom">${flowers}</g>` +
    '<g class="f-warm2 a-ripple"><ellipse cx="338" cy="214" rx="6" ry="3" transform="rotate(30 338 214)"/><ellipse cx="286" cy="300" rx="5" ry="2.6" transform="rotate(-20 286 300)"/><ellipse cx="364" cy="470" rx="6" ry="3" transform="rotate(10 364 470)"/></g>';
}

const SCENES: Record<SceneName, (id: string) => string> = {
  hero: id =>
    sky(id, 600, 600) +
    `<g class="p1">${sun(486, 150, 42)}<path class="f-far" d="M0 318C80 280 160 290 240 306C320 322 380 280 460 288C520 294 560 282 600 288V420H0Z"/></g>` +
    '<g class="p2">' + skyline(404, 'f-mid', 3, 600) + cantonTower(390, 404, 1.8) + birds(250, 230) + '</g>' +
    water(id, 402, 600, 600) +
    '<rect class="f-ink" x="372" y="404" width="36" height="120" opacity=".12"/>' +
    '<g class="p3"><path class="f-near" d="M-30 452C140 446 260 448 640 456V466C260 458 140 458-30 462Z"/>' +
    ripples('M40 520h60M150 560h90M320 500h60M470 588h80M520 480h50') + boat(200, 532, 1.7) + '</g>' +
    '<g class="p4">' + kapokBranch() + '</g>',

  'canton-tower': id =>
    sky(id) + sun(318, 72, 20) + FAR + skyline(222, 'f-mid', 1) +
    cantonTower(146, 222, 0.9) + water(id, 220) +
    '<rect class="f-ink" x="134" y="222" width="24" height="46" opacity=".12"/>' +
    '<path class="f-near" d="M0 220H400V226H0Z"/>' +
    ripples('M30 246h40M200 256h60M300 244h50M60 280h60M250 286h70') + boat(300, 270, 0.85) + birds(220, 70),

  'ancestral-hall': id =>
    sky(id) + sun(334, 60, 18) + FAR +
    '<rect class="f-near" y="214" width="400" height="86"/>' +
    wokGable(86, 214, 52, 110, 'f-ink2') + wokGable(262, 214, 52, 110, 'f-ink2') +
    '<rect class="f-wall" x="110" y="150" width="180" height="64"/>' +
    roof(200, 154, 206, 30, 'f-ink') +
    '<rect class="f-ink" x="132" y="118" width="136" height="6"/>' +
    '<g class="f-warm2"><rect x="138" y="110" width="10" height="8" rx="2"/><rect x="170" y="112" width="14" height="6" rx="2"/><rect x="216" y="112" width="14" height="6" rx="2"/><rect x="252" y="110" width="10" height="8" rx="2"/></g>' +
    '<rect class="f-ink2" x="184" y="170" width="32" height="44" rx="2"/>' +
    '<g class="f-win"><rect x="130" y="172" width="22" height="18"/><rect x="248" y="172" width="22" height="18"/></g>' +
    '<g class="a-lantern"><rect class="f-ink" x="170" y="160" width="4" height="3"/><ellipse class="f-warm" cx="172" cy="170" rx="6" ry="8"/></g>' +
    '<g class="a-lantern"><rect class="f-ink" x="226" y="160" width="4" height="3"/><ellipse class="f-warm" cx="228" cy="170" rx="6" ry="8"/></g>' +
    '<path class="s-line" stroke-width="1.5" opacity=".45" d="M150 232H250M136 250H264M122 268H278"/>' +
    trees(40, 214, 1.2, 'f-deep') + trees(362, 214, 1.1, 'f-deep') + birds(206, 62),

  'arcade-street': id =>
    sky(id) + sun(200, 118, 26) +
    '<path class="f-wall" opacity=".6" d="M150 300L186 198H214L250 300Z"/>' +
    '<path class="f-ink2" d="M0 300V120L152 186V300Z"/><path class="f-ink" d="M0 108L162 182L152 186L0 122Z"/>' +
    '<g class="f-wall" opacity=".75"><path d="M14 300V240Q14 222 30 226Q46 230 46 250V300Z"/><path d="M68 300V256Q68 240 82 244Q96 248 96 264V300Z"/><path d="M114 300V270Q114 258 124 261Q134 264 134 276V300Z"/></g>' +
    '<g class="f-win a-shop"><rect x="16" y="150" width="14" height="20"/><rect x="42" y="162" width="14" height="20"/><rect x="72" y="176" width="12" height="18"/><rect x="100" y="188" width="12" height="16"/></g>' +
    '<path class="f-ink2" d="M400 300V120L248 186V300Z"/><path class="f-ink" d="M400 108L238 182L248 186L400 122Z"/>' +
    '<g class="f-wall" opacity=".75"><path d="M386 300V240Q386 222 370 226Q354 230 354 250V300Z"/><path d="M332 300V256Q332 240 318 244Q304 248 304 264V300Z"/><path d="M286 300V270Q286 258 276 261Q266 264 266 276V300Z"/></g>' +
    '<g class="f-win a-shop"><rect x="370" y="150" width="14" height="20"/><rect x="344" y="162" width="14" height="20"/><rect x="316" y="176" width="12" height="18"/><rect x="288" y="188" width="12" height="16"/></g>' +
    '<path class="s-ink" stroke-width="1.2" d="M0 96Q100 150 186 168M400 96Q300 150 214 168"/>' +
    [[30, 112], [70, 132], [110, 148], [150, 160], [370, 112], [330, 132], [290, 148], [250, 160]]
      .map(([x, y]) => `<g class="a-lantern"><rect class="f-ink" x="${x - 3}" y="${y}" width="6" height="3"/><ellipse class="f-warm" cx="${x}" cy="${y + 11}" rx="7" ry="9"/></g>`)
      .join('') +
    '<g class="f-ink a-walker"><circle cx="192" cy="236" r="5"/><path d="M186 242h12l3 24h-18Z"/><circle cx="214" cy="252" r="6"/><path d="M207 259h14l4 30h-22Z"/></g>',

  'western-villa': id =>
    sky(id) + sun(84, 62, 18) + FAR +
    '<rect class="f-near" y="222" width="400" height="78"/>' +
    '<rect class="f-wall" x="118" y="124" width="164" height="98"/>' +
    '<rect class="f-ink" x="108" y="116" width="184" height="10"/>' +
    '<path class="f-ink" d="M168 116L200 92L232 116Z"/><circle class="f-win" cx="200" cy="108" r="5"/>' +
    '<g class="f-ink2">' +
    [132, 158, 184, 210, 236, 262].map(x => `<rect x="${x}" y="156" width="7" height="66"/>`).join('') +
    '</g>' +
    '<g class="f-win">' +
    [140, 166, 192, 218, 244].map(x => `<path d="M${x} 150V138A7 7 0 0 1 ${x + 14} 138V150Z"/>`).join('') +
    '</g>' +
    '<rect class="f-ink" x="118" y="150" width="164" height="4"/>' +
    '<path class="s-line" stroke-width="1.5" opacity=".5" d="M110 240H290M96 262H304"/>' +
    '<g><rect class="f-ink" x="316" y="176" width="3" height="46"/><circle class="f-warm2 a-twinkle" cx="317.5" cy="174" r="5"/></g>' +
    banyan(52, 224, 1.05) + banyan(360, 226, 0.95) + birds(220, 56),

  'city-park': id =>
    sky(id) + sun(96, 64, 20) + FAR + MID +
    '<path class="f-near" d="M180 206C220 150 330 142 400 168V300H180Z"/>' +
    '<rect class="f-warm" x="268" y="126" width="56" height="58"/>' +
    '<g class="f-ink2"><rect x="276" y="136" width="8" height="10"/><rect x="292" y="136" width="8" height="10"/><rect x="308" y="136" width="8" height="10"/><rect x="276" y="156" width="8" height="10"/><rect x="308" y="156" width="8" height="10"/><rect x="290" y="160" width="12" height="24"/></g>' +
    roof(296, 130, 78, 18, 'f-ink') + roof(296, 108, 62, 16, 'f-ink') + '<rect class="f-warm" x="276" y="108" width="40" height="8"/>' +
    trees(236, 206, 1.1, 'f-deep') + trees(368, 196, 1.2, 'f-deep') +
    water(id, 232) +
    '<path class="f-near" d="M0 228C120 224 260 226 400 230V236C260 232 120 232 0 234Z"/>' +
    ripples('M40 256h40M150 268h60M260 262h50M300 286h60') +
    kapok(70, 232, 1.05) + birds(170, 58),

  mountain: id =>
    sky(id) + sun(92, 58, 18) +
    '<path class="f-far" d="M0 176L64 110L118 150L190 72L262 138L316 96L400 158V300H0Z"/>' +
    '<path class="f-mid" d="M0 214C60 180 120 170 170 188C220 206 270 150 330 158C360 162 384 176 400 184V300H0Z"/>' +
    '<path class="f-near" d="M0 256C80 230 170 236 240 250C300 262 350 244 400 250V300H0Z"/>' +
    '<g class="a-cloud"><ellipse class="f-wall" cx="252" cy="110" rx="36" ry="9" opacity=".75"/><ellipse class="f-wall" cx="110" cy="132" rx="28" ry="7" opacity=".65"/></g>' +
    '<rect class="f-ink" x="178" y="62" width="4" height="12"/><rect class="f-ink" x="198" y="62" width="4" height="12"/>' + roof(190, 62, 40, 12, 'f-ink') +
    '<path class="s-ink" stroke-width="1.6" d="M20 222L372 60"/>' +
    '<g class="a-cable"><path class="s-ink" stroke-width="1.6" d="M120 176V186"/><rect class="f-warm2" x="110" y="186" width="20" height="16" rx="4"/><rect class="f-win" x="114" y="190" width="12" height="6" rx="1"/></g>' +
    trees(40, 244, 1, 'f-deep') + trees(74, 236, 0.8, 'f-near') + trees(300, 222, 1, 'f-deep') + trees(340, 234, 0.9, 'f-deep') +
    birds(280, 44),

  'river-night': id =>
    sky(id) + sun(80, 56, 14) +
    skyline(196, 'f-ink2', 5) +
    '<g class="f-win a-twinkle">' +
    [[20, 170], [48, 160], [90, 176], [132, 166], [176, 158], [226, 172], [268, 162], [310, 174], [352, 164]]
      .map(([x, y]) => `<rect x="${x}" y="${y}" width="4" height="5"/>`)
      .join('') +
    '</g>' +
    cantonTower(330, 196, 0.62) +
    water(id, 194) +
    '<g class="f-warm2 a-ripple" opacity=".45"><rect x="40" y="214" width="46" height="3" rx="1.5"/><rect x="150" y="228" width="60" height="3" rx="1.5"/><rect x="250" y="216" width="40" height="3" rx="1.5"/><rect x="318" y="236" width="30" height="3" rx="1.5"/><rect x="80" y="262" width="54" height="3" rx="1.5"/></g>' +
    '<g transform="translate(196 266)"><g class="a-boat"><path class="f-ink2" d="M-58 0Q0 14 58 0L50-8H-50Z"/><rect class="f-ink" x="-40" y="-22" width="80" height="14" rx="3"/><rect class="f-ink" x="-24" y="-32" width="48" height="10" rx="3"/>' +
    '<g class="f-warm2"><rect x="-34" y="-18" width="8" height="5" rx="1"/><rect x="-20" y="-18" width="8" height="5" rx="1"/><rect x="-6" y="-18" width="8" height="5" rx="1"/><rect x="8" y="-18" width="8" height="5" rx="1"/><rect x="22" y="-18" width="8" height="5" rx="1"/></g></g></g>' +
    ripples('M20 284h40M300 280h60'),

  safari: id =>
    sky(id) + sun(330, 62, 22) + FAR +
    '<path class="f-mid" d="M0 196C80 186 170 190 250 196C320 202 360 192 400 196V300H0Z"/>' +
    '<path class="s-line" stroke-width="1.6" opacity=".45" d="M30 236l4-10M36 238l6-9M300 252l4-10M306 254l6-9M140 276l4-10M146 278l6-9"/>' +
    acacia(80, 200, 1.1) + acacia(344, 196, 0.8) +
    giraffe(210, 262, 0.95) + trees(28, 206, 0.9, 'f-deep') + birds(120, 60),

  museum: id =>
    sky(id) + sun(80, 60, 18) + FAR +
    '<rect class="f-near" y="222" width="400" height="78"/>' +
    '<rect class="f-wall" x="108" y="206" width="184" height="16" opacity=".8"/>' +
    '<rect class="f-ink2" x="118" y="112" width="164" height="94" rx="3"/>' +
    '<path class="s-line" stroke-width="1.4" opacity=".4" d="M130 130H188L206 150H270M130 150H170L182 164H270M130 178H214L230 192H270M150 124V200M246 124V200"/>' +
    '<rect class="f-win" x="186" y="176" width="28" height="30" opacity=".85"/>' +
    '<g class="f-win" opacity=".7"><rect x="136" y="186" width="4" height="12"/><rect x="258" y="186" width="4" height="12"/></g>' +
    water(id, 232) + '<rect class="f-ink" x="118" y="234" width="164" height="30" opacity=".12"/>' +
    '<path class="f-near" d="M0 228H400V234H0Z"/>' +
    ripples('M30 254h40M150 272h70M300 258h50M320 286h40') +
    trees(60, 222, 1.2, 'f-deep') + trees(344, 222, 1.1, 'f-deep') +
    '<g class="f-ink a-walker"><circle cx="100" cy="206" r="4"/><path d="M95 211h10l2 14h-14Z"/></g>' + birds(236, 64),

  temple: id =>
    sky(id) + sun(318, 58, 18) + FAR +
    '<rect class="f-near" y="218" width="400" height="82"/>' +
    '<rect class="f-warm2" x="130" y="150" width="160" height="68"/>' +
    '<g class="f-ink2"><rect x="146" y="162" width="8" height="56"/><rect x="180" y="162" width="8" height="56"/><rect x="232" y="162" width="8" height="56"/><rect x="266" y="162" width="8" height="56"/><rect x="194" y="172" width="32" height="46"/></g>' +
    roof(210, 156, 224, 30, 'f-ink') + '<rect class="f-warm2" x="160" y="118" width="100" height="14"/>' + roof(210, 122, 150, 26, 'f-ink') +
    '<path class="s-line" stroke-width="1.5" opacity=".45" d="M160 236H260M148 254H272"/>' +
    '<g transform="translate(96 214)"><path class="f-ink2" d="M-14 0L-10-18H10L14 0Z"/><rect class="f-ink" x="-16" y="-22" width="32" height="6" rx="2"/></g>' +
    steam('M92 186c-6-10 6-16 0-26M102 188c-5-9 5-14 0-22') +
    '<g class="a-tree"><path class="f-ink2" d="M340 218L344 170H352L356 218Z"/><g class="f-deep"><circle cx="330" cy="150" r="24"/><circle cx="356" cy="136" r="28"/><circle cx="378" cy="158" r="20"/><circle cx="346" cy="166" r="18"/></g></g>' +
    birds(186, 60),

  'water-town': id =>
    sky(id) + sun(318, 60, 18) + FAR + water(id, 168) +
    wokGable(36, 172, 26, 56, 'f-ink2') + '<rect class="f-wall" x="58" y="136" width="62" height="36"/>' + roof(89, 140, 70, 16, 'f-ink') +
    '<rect class="f-ink2" x="80" y="150" width="14" height="22"/>' +
    '<path class="f-ink2" d="M150 190Q210 132 270 190H250Q210 156 170 190Z"/>' +
    '<path class="s-ink" stroke-width="2" opacity=".22" d="M170 196Q210 228 250 196"/>' +
    '<path class="s-deep a-sway" stroke-width="2.4" d="M322 240C318 214 326 196 320 176M334 244C332 218 342 198 338 180M346 242C348 222 352 206 360 190M306 246C302 226 308 206 300 192"/>' +
    leaf(40, 262, 30, 'f-near') + leaf(120, 286, 26, 'f-deep') + leaf(260, 272, 32, 'f-near') + leaf(380, 280, 24, 'f-deep') +
    lotus(88, 236, 0.75) + lotus(232, 250, 0.65) +
    boat(214, 226, 0.7) + ripples('M150 210h40M280 218h36M20 206h40') + birds(150, 64),

  'dim-sum': () =>
    '<rect class="f-far" width="400" height="300"/>' +
    '<path class="s-line" stroke-width="1.2" opacity=".35" d="M0 60H400M0 120H400M0 180H400M0 240H400"/>' +
    steamer(148, 156, 70) + steamer(282, 110, 48) +
    steam('M130 70c-6-10 6-16 0-26M154 64c-5-9 5-14 0-22M176 72c-6-10 6-16 0-26M272 44c-5-9 5-14 0-22') +
    '<g transform="translate(310 226)"><path class="f-ink2" d="M-32 0C-36-30-18-44 0-44C18-44 36-30 32 0Z"/><path class="s-ink" stroke-width="6" d="M30-26C46-28 52-40 58-50"/><path class="s-ink" stroke-width="5" d="M-32-24C-46-22-48-4-32-4"/><rect class="f-ink" x="-12" y="-52" width="24" height="8" rx="3"/></g>' +
    '<circle class="f-wall" cx="60" cy="250" r="24"/><circle class="f-near" cx="60" cy="250" r="16" opacity=".8"/>' +
    '<path class="s-ink" stroke-width="5" d="M196 290L262 214M210 296L276 220"/>',
};

let seq = 0;

/** 生成插画的 SVG 内容（不含外层 svg 标签） */
export function sceneMarkup(name: string, uid?: string): { viewBox: string; markup: string } {
  const scene = (SCENES as Record<string, (id: string) => string>)[name] ?? SCENES['city-park'];
  const id = `il${(uid ?? String(++seq)).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const viewBox = name === 'hero' ? '0 0 600 600' : `0 0 ${W} ${H}`;
  const defs = `<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s-sky1"/><stop offset="1" class="s-sky2"/></linearGradient>` +
    `<linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s-wat1"/><stop offset="1" class="s-wat2"/></linearGradient></defs>`;
  return { viewBox, markup: defs + scene(id) };
}
