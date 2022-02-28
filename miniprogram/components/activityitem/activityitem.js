import { navigateToActivityDetail } from "../../pages/router";

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

      navigateToActivityDetail(id);
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