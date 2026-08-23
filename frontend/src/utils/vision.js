const COLOR_HINTS = [
  { name: "tomato", test: (r, g, b) => r > 140 && r > g + 30 && r > b + 40 && g < 130 },
  { name: "apple", test: (r, g, b) => r > 150 && g < 90 && b < 90 },
  { name: "banana", test: (r, g, b) => r > 170 && g > 150 && b < 90 },
  { name: "wheat", test: (r, g, b) => r > 160 && g > 130 && b < 90 && Math.abs(r - g) < 50 },
  { name: "spinach", test: (r, g, b) => g > 110 && g > r + 20 && g > b + 10 },
  { name: "orange", test: (r, g, b) => r > 180 && g > 90 && g < 150 && b < 70 },
  { name: "potato", test: (r, g, b) => isPotatoColor(r, g, b) },
];

const saturation = (r, g, b) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : ((max - min) / max) * 100;
};

const rgbToHsv = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max };
};

export const isPotatoColor = (r, g, b) => {
  const { h, s, v } = rgbToHsv(r, g, b);
  const earth = h >= 12 && h <= 62 && s >= 0.08 && s <= 0.78 && v >= 0.22 && v <= 0.93;
  const beige = h >= 18 && h <= 70 && s >= 0.04 && s <= 0.22 && v >= 0.4 && v <= 0.9;
  return earth || beige;
};

export const analyzeShelfImage = (image) => {
  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const grid = 4;
  const cell = size / grid;
  const cells = [];
  const votes = {};

  for (let row = 0; row < grid; row += 1) {
    for (let col = 0; col < grid; col += 1) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let count = 0;
      for (let y = row * cell; y < (row + 1) * cell; y += 2) {
        for (let x = col * cell; x < (col + 1) * cell; x += 2) {
          const i = (y * size + x) * 4;
          rSum += data[i];
          gSum += data[i + 1];
          bSum += data[i + 2];
          count += 1;
        }
      }
      const r = rSum / count;
      const g = gSum / count;
      const b = bSum / count;
      const brightness = (r + g + b) / 3;
      const sat = saturation(r, g, b);
      const empty = brightness > 175 && sat < 28;
      cells.push({
        row,
        col,
        brightness: Math.round(brightness),
        sat: Math.round(sat),
        empty,
        potato: isPotatoColor(r, g, b),
      });

      if (!empty) {
        COLOR_HINTS.forEach((hint) => {
          if (hint.test(r, g, b)) votes[hint.name] = (votes[hint.name] || 0) + 1;
        });
      }
    }
  }

  const emptyCount = cells.filter((cellItem) => cellItem.empty).length;
  const emptinessScore = emptyCount / cells.length;
  const colorHints = Object.entries(votes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, score]) => ({ name, score }));

  return {
    emptinessScore,
    emptyCellRatio: emptinessScore,
    cells,
    colorHints,
    preview: canvas.toDataURL("image/jpeg", 0.6),
  };
};

const workCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;

export const detectPotatoFrame = (video, overlay) => {
  if (!video?.videoWidth || !workCanvas) return null;

  const size = 140;
  workCanvas.width = size;
  workCanvas.height = size;
  const ctx = workCanvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const grid = 5;
  const cell = size / grid;
  const cells = [];
  let potatoPixels = 0;
  let totalPixels = 0;

  for (let row = 0; row < grid; row += 1) {
    for (let col = 0; col < grid; col += 1) {
      let potato = 0;
      let count = 0;
      for (let y = row * cell; y < (row + 1) * cell; y += 2) {
        for (let x = col * cell; x < (col + 1) * cell; x += 2) {
          const i = (Math.floor(y) * size + Math.floor(x)) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          count += 1;
          totalPixels += 1;
          if (isPotatoColor(r, g, b)) {
            potato += 1;
            potatoPixels += 1;
          }
        }
      }
      cells.push({ row, col, potato: potato / count > 0.12, empty: potato / count < 0.04 });
    }
  }

  const potatoScore = potatoPixels / totalPixels;
  const potatoCells = cells.filter((item) => item.potato).length;
  const potatoPresent = potatoScore >= 0.02 || potatoCells >= 2;

  if (overlay) {
    const width = overlay.clientWidth || overlay.offsetWidth || 320;
    const height = overlay.clientHeight || overlay.offsetHeight || 220;
    if (overlay.width !== width) overlay.width = width;
    if (overlay.height !== height) overlay.height = height;
    const draw = overlay.getContext("2d");
    draw.clearRect(0, 0, overlay.width, overlay.height);
    const cw = overlay.width / grid;
    const ch = overlay.height / grid;
    cells.forEach((item) => {
      if (!item.potato) return;
      draw.fillStyle = "rgba(196, 149, 58, 0.4)";
      draw.fillRect(item.col * cw, item.row * ch, cw - 2, ch - 2);
    });
  }

  return {
    potatoScore,
    potatoPresent,
    potatoCells,
    emptiness: 1 - potatoScore,
    cells,
    empty: !potatoPresent,
  };
};

export const fileToImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });
