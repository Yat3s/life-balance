import {
  navigateToAuth
} from "../../pages/router";
import {
  fetchCarpool,
  joinCarpool
} from "../../repository/carpoolRepo";
import {
  notifyCarpoolHost
} from "../../repository/notificationHelper";
import {
  fetchUserInfoOrSignup
} from "../../repository/userRepo";

// components/carpoolitem/carpoolitem.js
Component({
  options: {
    addGlobalClass: true
  },

  properties: {
    carpool: Object
  },

  /**
   * 组件的初始数据
   */
  data: {
    selectedCount: 1,
    policyChecked: true
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onCopy(e) {
      const content = e.currentTarget.dataset.content;
      wx.setClipboardData({
        data: content,
      })

      wx.showToast({
        icon: 'none',
        title: 'Copied to clipboard',
      })
    },
    onSelectCount(e) {
      const selectedCount = parseInt(e.currentTarget.dataset.count);
      this.setData({
        selectedCount
      })
    },

    onActionBtnClick() {
      const {
        carpool
      } = this.data;

      wx.showLoading();

      fetchUserInfoOrSignup().then(userInfo => {
        fetchCarpool(carpool._id).then(newCarpool => {
          wx.hideLoading();

          let isHost = newCarpool.host._openid === userInfo._openid;
          let isParticipanted = false;
          for (const participant of newCarpool.participants) {
            if (participant._openid === userInfo._openid) {
              isParticipanted = true;
              break;
            }
          };

          let showingModal = null;
          if (isHost) {
            showingModal = 'contactForHost';
          } else if (isParticipanted) {
            showingModal = 'contactForParticipant';
          } else if (!newCarpool.isFull && !newCarpool.isExpired) {
            showingModal = 'action';
          }

          this.setData({
            showingModal,
            carpool: newCarpool
          })
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: 'Failed to fetch carpool: ' + err,
          })
        })
      }).catch(err => {
        wx.showToast({
          icon: 'none',
          title: 'Failed to fetch user info: ' + err,
        })
        wx.hideLoading();
      });
    },

    onConfirmBtnClick() {
      const {
        carpool,
        selectedCount,
        policyChecked
      } = this.data;

      if (!policyChecked) {
        wx.showToast({
          icon: 'none',
          title: 'Please agree the policy',
        })
        return;
      }

      wx.showLoading();

      fetchUserInfoOrSignup().then(userInfo => {
        wx.hideLoading();

        if (!userInfo.company) {
          navigateToAuth();

          return;
        }

        if (userInfo._openid === carpool.host._openid) {
          wx.showToast({
            icon: 'none',
            title: "Are you picking up yourself?",
          })
          return;
        }

        let index = 0;
        for (; index < selectedCount;) {
          index++;
          carpool.participants.push(userInfo);
          joinCarpool(carpool._id, userInfo).then(res => {

            this.setData({
              showingModal: 'contact'
            })
          })
        }
        this.sendNotification();

        // Local lie
        carpool.isFull = carpool.hostType === 'driver' ? carpool.seatCount <= carpool.participants.length : carpool.participants.length > 0;
        this.setData({
          carpool
        })
      }).catch(err => {
        wx.hideLoading();
        console.log(err);
        wx.showToast({
          icon: 'error',
          title: 'Failed' + err,
        })
      })
    },

    sendNotification() {
      const {
        carpool,
      } = this.data;

      notifyCarpoolHost(carpool);
    },

    onDimissModal() {
      this.setData({
        showingModal: null
      })
    },

    onPolicyCheckChanged(e) {
      const values = e.detail.value;
      this.setData({
        policyChecked: values.length > 0
      })
    }
  }
})