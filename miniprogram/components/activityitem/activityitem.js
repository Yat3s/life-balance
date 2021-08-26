Component({

  options: {
    addGlobalClass: true
  },

  properties: {
    activity: Object
  },

  data: {

  },

  methods: {
    onActivityItemClick(e) {
      const id = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/pages/activity/activitydetail/activitydetail?id=${id}`
      });
    },
    
  },

  pageLifetimes: {
    show() {
    }
  },

  lifetimes: {
    attached() {

    },
    ready() {
    },
  }
})