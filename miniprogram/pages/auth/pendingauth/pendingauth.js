import {
  fetchCompanies,
  fetchPendingAuthUsers,
  updateEnterpriseAuth,
} from "../../../repository/userRepo";
import { navigateToProfile } from "../../router";

Page({
  data: {
    pendingAuthUsers: [],
    selectedUserIds: [],
    selectAllChecked: false,
  },

  onLoad() {
    this.initializeData();
  },

  onCheckboxChange(e) {
    const selectedUserIds = e.detail.value;

    // Update individual check status
    const pendingAuthUsers = this.data.pendingAuthUsers.map((user) => ({
      ...user,
      checked: selectedUserIds.includes(user._id),
    }));

    // Update select all checkbox status
    const selectAllChecked = selectedUserIds.length === pendingAuthUsers.length;

    this.setData({
      selectedUserIds,
      pendingAuthUsers,
      selectAllChecked,
    });
  },

  onSelectAllChange(e) {
    const selectAllChecked = e.detail.value.length > 0;

    // Update all users' checked status
    const pendingAuthUsers = this.data.pendingAuthUsers.map((user) => ({
      ...user,
      checked: selectAllChecked,
    }));

    // Set selectedUserIds accordingly
    const selectedUserIds = selectAllChecked
      ? pendingAuthUsers.map((user) => user._id)
      : [];

    this.setData({
      pendingAuthUsers,
      selectedUserIds,
      selectAllChecked,
    });
  },

  initializeData() {
    const companies = wx.getStorageSync("companies");
    if (companies) {
      this.setData({ companies });
      this.fetchAndSetPendingAuthUsers(companies);
    } else {
      fetchCompanies().then((companies) => {
        wx.setStorageSync("companies", companies);
        this.setData({ companies });
        this.fetchAndSetPendingAuthUsers(companies);
      });
    }
  },

  fetchAndSetPendingAuthUsers(companies) {
    fetchPendingAuthUsers().then((res) => {
      if (res.success) {
        // Extend data for testing large data if needed
        const pendingAuthUsers = res.data;
        this.setData({
          pendingAuthUsers: pendingAuthUsers.map((user) => ({
            ...user,
            checked: false,
            companyName: companies.find(
              (company) => company._id === user.company
            )?.name,
          })),
        });
      }
    });
  },

  onApproveBtnClick() {
    const { selectedUserIds } = this.data;
    if (!selectedUserIds.length) {
      wx.showToast({
        icon: "none",
        title: "Please select at least one user",
      });
      return;
    }

    updateEnterpriseAuth(selectedUserIds)
      .then((res) => {
        wx.showToast({
          icon: "none",
          title: res.success ? "Approved successfully" : "Approval failed",
        });
        if (res.success) {
          this.setData({
            selectedUserIds: [],
            selectAllChecked: false,
          });
          this.initializeData();
        }
      })
      .catch((err) => {
        wx.showToast({
          icon: "none",
          title: "Approval failed: " + err,
        });
      });
  },

  onAvatarClick(e) {
    const userId = e.currentTarget.dataset.id;
    navigateToProfile(userId);
  },
});
