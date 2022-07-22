// pages/glossary/glossary.js
import { queryAcronym } from "../../repository/exploreRepo";
const app = getApp();

Component({
  options: {
    addGlobalClass: true
  },
  /**
   * 页面的初始数据
   */
  data: {
    searchAcronymInput:'',
    glossary:[
      {
        fullname:'Microsoft 365 admin center',
        description:'A Microsoft 365 portal that is used to set up organizations and to manage subscriptions and users.',
        synonyms:['OM', 'MAC']
      },
      {
        fullname:'Microsoft 365 admin center',
        description:'A Microsoft 365 portal that is used to set up organizations and to manage subscriptions and users.',
        synonyms:['OM', 'MAC']
      },
      {
        fullname:'Microsoft 365 admin center',
        description:'A Microsoft 365 portal that is used to set up organizations and to manage subscriptions and users.',
        synonyms:['OM', 'MAC']
      },
      {
        fullname:'Microsoft 365 admin center',
        description:'A Microsoft 365 portal that is used to set up organizations and to manage subscriptions and users.',
        synonyms:['OM', 'MAC']
      },
      {
        fullname:'Microsoft 365 admin center',
        description:'A Microsoft 365 portal that is used to set up organizations and to manage subscriptions and users.',
        synonyms:['OM', 'MAC']
      },
      {
        fullname:'Microsoft 365 admin center',
        description:'A Microsoft 365 portal that is used to set up organizations and to manage subscriptions and users.',
        synonyms:['OM', 'MAC']
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
   
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

  },
  /**
   * 组件的方法列表
   */
  methods: {
    onSearchGlossaryChanged(e){
      const keyword = e.detail.value;
      queryAcronym(keyword).then(res => {
        console.log(res);
        // this.data.glossary = res;
      });
    },
  }
})