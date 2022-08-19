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
        pageNumber: this.data.pageNumber
      }
      this.onListScrolled();
      this.searchInput(query.keyword, query.pageNumber);
    },
    hide() {
      if (this._observer) {
        this._observer.disconnect();
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    resetListData(keyword = '') {
      this.setData({
        searchGlossaryInput: keyword,
        pageNumber: 1,
        glossaries: null,
        glossariesLength: 0,
        scrollTop: 0
      }, function () {
        let query = {
          keyword: keyword ? keyword : '',
          pageNumber: this.data.pageNumber
        }
        this.searchInput(query.keyword, query.pageNumber);
      })
    },
    onSearchGlossaryChanged(e) {
      const keyword = e.detail.value;
      this.resetListData(keyword);
    },
    searchInput(keyword, pageNumber) {
      let query = {
        keyword: keyword ? keyword : '',
        pageNumber: pageNumber,
        pageSize: this.data.pageSize
      }
      queryGlossary(query).then(res => {
        let list = this.data.glossaries ? this.data.glossaries : [];
        if (list.includes(res[0])) {
          return;
        }
        list = list.concat(res && res.length > 0 ? res : []);
        this.setData({
          glossaries: list,
          pageNumber: query.pageNumber + 1
        })
      }).catch(error => {
        console.log(error);
      });
    },
    onClearInputClicked() {
      this.resetListData();
    },
    onListScrolled() {
      this._observer = wx.createIntersectionObserver(this);
      this._observer
        .relativeToViewport({ bottom: 300 })
        .observe('.glossary-suggestion', (res) => {
          // record glossary.length
          // if front glossary.length = cur，represent has send a request
          if (!this.data.glossaries) {
            return;
          }
          let length = this.data.glossaries.length;
          if (length > this.data.glossariesLength) {
            this.data.glossariesLength = length;
            let query = {
              keyword: this.data.searchGlossaryInput ? this.data.searchGlossaryInput : '',
              pageNumber: this.data.pageNumber
            }
            this.searchInput(query.keyword, query.pageNumber);
          }
        })
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
            this.searchInput(this.data.searchGlossaryInput, this.data.pageNumber);
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
  }
})