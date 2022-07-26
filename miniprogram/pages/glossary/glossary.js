// pages/glossary/glossary.js
import { queryGlossary } from "../../repository/glossaryRepo";

Component({
  options: {
    addGlobalClass: true
  },
  /**
   * 页面的初始数据
   */
  data: {
    searchSynonymsInput: '',
    glossary: [],
    emptyGlossary: false
  },

  pageLifetimes: {
    show() {
      this.searchInput();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onSearchGlossaryChanged(e) {
      const keyword = e.detail.value;
      this.searchInput(keyword);
    },
    searchInput(keyword = "") {
      queryGlossary(keyword).then(res => {
        this.setData({
          glossary: res.length > 0 ? res : [],
          emptyGlossary: res.length > 0 ? false : true
        })
      });
    }
  }
})