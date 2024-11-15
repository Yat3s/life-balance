Component({
  properties: {
    leftColumnProducts: Array,
    rightColumnProducts: Array,
    company: String,
  },

  methods: {
    handleProductClick(e) {
      const item = e.currentTarget.dataset.item;
      if (!item.isInternal || (item.isInternal && this.data.company)) {
        this.triggerEvent('productClick', { ...item });
      }
    },
  },
});
