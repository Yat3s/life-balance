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
    searchGlossaryInput: '',
    glossaries: null,
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
      this.data.searchGlossaryInput = keyword;
      this.searchInput(keyword);
    },
    searchInput(keyword = "") {
      queryGlossary(keyword).then(res => {
        this.setData({
          glossaries: res && res.length > 0 ? res : [],
        })
      });
    }
  }
})