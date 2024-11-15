Component({
  options: {
    addGlobalClass: true,
  },

  properties: {
    items: {
      type: Array,
      value: [],
    },
    company: {
      type: String,
      value: null,
    },
  },

  data: {
    crossAxisCount: 2,
    crossAxisGap: 8,
    mainAxisGap: 8,
  },

  methods: {
    onItemClick(e) {
      const { item } = e.currentTarget.dataset;
      this.triggerEvent('itemclick', { item });
    },
  },
});
