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
    showingModal: ""
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
          console.log(res)
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
    }
  }
})