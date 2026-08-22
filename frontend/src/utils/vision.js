const COLOR_HINTS = [
  { name: "tomato", test: (r, g, b) => r > 140 && r > g + 30 && r > b + 40 && g < 130 },
  { name: "apple", test: (r, g, b) => r > 150 && g < 90 && b < 90 },
  { name: "banana", test: (r, g, b) => r > 170 && g > 150 && b < 90 },
  { name: "wheat", test: (r, g, b) => r > 160 && g > 130 && b < 90 && Math.abs(r - g) < 50 },
  { name: "spinach", test: (r, g, b) => g > 110 && g > r + 20 && g > b + 10 },
  { name: "orange", test: (r, g, b) => r > 180 && g > 90 && g < 150 && b < 70 },
  { name: "potato", test: (r, g, b) => r > 110 && r < 180 && Math.abs(r - g) < 25 && b < 100 && (r + g + b) / 3 < 160 },
];

const saturation = (r, g, b) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : ((max - min) / max) * 100;
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
