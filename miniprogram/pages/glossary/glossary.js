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
    showingModal: false,
    proposeName: '',
    proposeDefinition: '',
    proposeSynonyms: ''
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
    },
    onShowModal() {
      this.setData({
        showingModal: true
      })
    },
    onDismissModal() {
      this.setData({
        showingModal: false
      })
    },
    onFormNameChanged(e) {
      this.data.proposeName = e.detail.value;
    },
    onFormDefinitionChanged(e) {
      this.data.proposeDefinition = e.detail.value;
    },
    onSynonymsChanged(e) {
      this.data.proposeSynonyms = e.detail.value;
    },
    onSubmitClicked() {
      if (this.data.proposeName === '') {
        wx.showToast({
          icon: 'none',
          title: 'name不能为空',
        });
        return;
      }
      if (this.data.proposeDefinition === '') {
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
        let synonyms = this.data.proposeSynonyms.split(',').filter(item => item.length > 0);
        let data = {
          synonyms: synonyms,
          definition: this.data.proposeDefinition,
          name: this.data.proposeName,
          author: [author]
        }
        proposeTerm(data).then(res => {
          if (res === 'Propose successfully!') {
            wx.showToast({
              icon: 'none',
              title: '提交成功',
            });
            this.setData({
              showingModal: false
            })
          } else {
            wx.showToast({
              icon: 'none',
              title: 'name已存在！',
            });
          }
        });
      })
    }
  }
})