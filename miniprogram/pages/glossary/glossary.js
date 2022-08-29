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
    pageSize: 100,
    proposeForm: {
      termID: '',
      name: '',
      definition: '',
      synonyms: ''
    },
    scrollTop: 0,
    onReachBottomDistance: 300,
    isRequesting: false,
    isFinished: false,
    onEdit: false,
    newTerm: {
      title: 'Suggest a New Term',
      subTitle: 'Are you confused by a word, phrase, or acronym? Request that our researchers include the definition here:'
    },
    editTerm: {
      title: 'Suggest a Edit',
      subTitle: 'Have you noticed something is missing or inaccurate? Request that our researchers include the change here:'
    },
  },

  resetListData(keyword = '') {
    this.data.pageNumber = 1;
    this.data.glossaries = null;
    this.data.searchGlossaryInput = keyword;
    this.data.isFinished = false;

    let query = {
      keyword: keyword ? keyword : '',
      pageNumber: this.data.pageNumber
    }
    this.searchInput(query.keyword, query.pageNumber);

    this.setData({
      scrollTop: 0,
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
      this.data.isRequesting = false;
      this.data.pageNumber = pageNumber + 1;
      if (pageNumber === 1) {
        this.setData({
          glossaries: res && res.length > 0 ? res : [],
        })
      } else {
        if (res === null || res.length === 0) {
          this.setData({
            isFinished: true
          })
          return;
        }
        let list = this.data.glossaries.concat(res && res.length > 0 ? res : []);
        this.setData({
          glossaries: list
        })
      }
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
    this.resetForm();
  },
  editTerm(e) {
    let newProposeForm = {
      termID: e.detail._id,
      name: e.detail.name,
      definition: e.detail.definition,
      synonyms: e.detail.synonyms.join(',')
    };
    this.onShowModal();
    this.setData({
      proposeForm: newProposeForm,
      onEdit: true
    })
  },
  resetForm() {
    let newProposeForm = {
      termID: '',
      name: '',
      definition: '',
      synonyms: ''
    };
    this.setData({
      proposeForm: newProposeForm,
      onEdit: false,
      showingModal: ""
    })
  },
  formSubmit(e) {
    const {
      termID,
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
        author: [author._id]
      }
      if (this.data.onEdit) {
        data.id = termID
      }
      proposeTerm(data).then(res => {
        if (res.errMsg.includes('ok')) {
          wx.showToast({
            icon: 'none',
            title: '提交成功',
          });
          this.resetForm();
          this.resetListData(this.data.searchGlossaryInput);
        } else {
          wx.showToast({
            icon: 'none',
            title: '提交失败，请重试！',
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