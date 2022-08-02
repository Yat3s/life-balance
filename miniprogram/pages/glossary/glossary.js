// pages/glossary/glossary.js
import { proposeTerm, queryGlossary } from "../../repository/glossaryRepo";

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
      this.setData({
        searchGlossaryInput: keyword
      })
      this.searchInput(keyword);
    },
    searchInput(keyword = "") {
       const event = {
        data: {
          term: {
            synonyms: ["Chris", "A Ice"],
            definition: "The most handsome man in OM",
            name: "sssssseee",
            authors: [{ id: "0", name: "adminn" }],
          }
        },
      }
      proposeTerm(event.data.term).then(e => console.log(e))

      queryGlossary(keyword).then(res => {
        this.setData({
          glossaries: res && res.length > 0 ? res : [],
        })
      });
    },
    onClearInputClicked() {
      this.setData({
        searchGlossaryInput: ''
      })
      this.searchInput();
    }
  }
})