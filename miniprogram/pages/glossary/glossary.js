// pages/glossary/glossary.js
import { proposeTerm, queryGlossary } from "../../repository/glossaryRepo";
import { fetchUserInfo } from "../../repository/userRepo";

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
    glossariesLength: 0,
    showingModal: "",
    pageNumber: 1,
    pageSize: 20,
    proposeFrom: {
      termID: '',
      name: '',
      definition: '',
      synonyms: ''
    },
    editTerm: false,
    scrollTop: 0
  },

  pageLifetimes: {
    show() {
      let query = {
        keyword: '',
        pageNumber: this.data.pageNumber++,
        pageSize: 20
      }
      this.searchInput(query);
      this.onListScrolled();
    },
    hide() {
      if (this._observer) this._observer.disconnect();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onSearchGlossaryChanged(e) {
      const keyword = e.detail.value;
      this.resetListData(keyword);
      let query = {
        keyword: keyword ? keyword : '',
        pageNumber: this.data.pageNumber++,
        pageSize: 20
      }
      this.searchInput(query);
    },
    searchInput(keyword) {
      queryGlossary(keyword).then(res => {
        let list = this.data.glossaries ? this.data.glossaries : [];
        list = list.concat(res && res.length > 0 ? res : []);
        this.setData({
          glossaries: list,
        })
      });
    },
    onClearInputClicked() {
      this.resetListData();
      let query = {
        keyword: '',
        pageNumber: this.data.pageNumber++,
        pageSize: 20
      }
      this.searchInput(query);
    },
    onShowModal() {
      this.setData({
        showingModal: "new"
      })
    },
    onDismissModal() {
      this.setData({
        showingModal: ""
      })
    },
    formSubmit(e) {
      const {
        proposeName,
        proposeDefinition,
        proposeSynonyms
      } = e.detail.value;
      if (proposeName === '') {
        wx.showToast({
          icon: 'none',
          title: 'name不能为空',
        });
        return;
      }
      if (proposeDefinition === '') {
        wx.showToast({
          icon: 'none',
          title: 'Definition不能为空',
        });
        return;
      }
      let author;
      fetchUserInfo().then(userMessage => {
        author = userMessage;
      }).then(e => {
        let synonyms = proposeSynonyms.split(',').filter(item => item.length > 0);
        let data = {
          synonyms: synonyms,
          definition: proposeDefinition,
          name: proposeName,
          author: [author]
        }
        proposeTerm(data).then(res => {
          if (res === 'Propose successfully!') {
            wx.showToast({
              icon: 'none',
              title: '提交成功',
            });
            this.setData({
              showingModal: "",
            })
            this.searchInput(this.data.searchGlossaryInput);
          } else {
            wx.showToast({
              icon: 'none',
              title: 'name已存在！',
            });
          }
        });
      }).catch(err => {
        wx.showToast({
          icon: 'none',
          title: '网络错误，请重试！',
        });
      })
    },
    resetListData(keyword = '') {
      this.setData({
        searchGlossaryInput: keyword,
        pageNumber: 1,
        glossaries: [],
        glossariesLength: 0,
        scrollTop: 0
      })
    },
    onListScrolled() {
      let that = this;
      this._observer = wx.createIntersectionObserver(this);
      this._observer
        .relativeToViewport({ bottom: 500 })
        .observe('.glossary-suggestion', (res) => {
          // record glossary.length
          // if front glossary.length = cur，represent has send a request
          if (that.data.glossaries) {
            let length = that.data.glossaries.length;
            if (length > that.data.glossariesLength) {
              that.data.glossariesLength = length;
              let query = {
                keyword: that.data.searchSynonymsInput ? that.data.searchSynonymsInput : '',
                pageNumber: this.data.pageNumber++,
                pageSize: 20
              }
              that.searchInput(query);
            }
          }
        })
    }
  }
})