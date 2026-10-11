const cleaner = {
  flashRAM: () => {
    if (global.gc) global.gc();
  },
};

module.exports = cleaner;
