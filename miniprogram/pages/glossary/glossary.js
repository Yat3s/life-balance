// pages/glossary/glossary.js
import { proposeTerm, queryGlossary } from "../../repository/glossaryRepo";
import { fetchUserInfo } from "../../repository/userRepo";

Page({
  /**
   * 页面的初始数据
   */
  data: {
    searchGlossaryInput: '',
    glossaries: null,
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
    scrollTop: 0,
    onReachBottomDistance: 300,
    isRequesting: false,
    isFinished: false,
  },

  resetListData(keyword = '') {
    this.data.pageNumber = 1;
    this.data.glossaries = null;
    this.data.glossariesLength = 0;
    this.data.scrollTop = 0;
    this.data.searchGlossaryInput = keyword;

    let query = {
      keyword: keyword ? keyword : '',
      pageNumber: this.data.pageNumber
    }
    this.searchInput(query.keyword, query.pageNumber);

    this.setData({
      scrollTop: 0,
      isFinished: false
    })
  },
  onSearchGlossaryChanged(e) {
    const keyword = e.detail.value;
    this.resetListData(keyword);
  },
  searchInput(keyword, pageNumber) {
    this.data.isRequesting = true;
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
      this.data.pageNumber = pageNumber + 1;
      this.data.isRequesting = false;
      if (res.length === 0) {
        this.setData({
          isFinished: true
        })
        return;
      }
      list = list.concat(res && res.length > 0 ? res : []);
      this.setData({
        glossaries: list
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
      .relativeToViewport({ bottom: this.data.onReachBottomDistance })
      .observe('.glossary-suggestion', (res) => {
        if (!this.data.glossaries || this.data.isRequesting || this.data.isFinished) {
          return;
        }
        let query = {
          keyword: this.data.searchGlossaryInput ? this.data.searchGlossaryInput : '',
          pageNumber: this.data.pageNumber
        }
        this.searchInput(query.keyword, query.pageNumber);
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
  /**
 * 生命周期函数--监听页面初次渲染完成
 */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    let query = {
      keyword: '',
      pageNumber: this.data.pageNumber
    }
    this.onListScrolled();
    this.searchInput(query.keyword, query.pageNumber);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})