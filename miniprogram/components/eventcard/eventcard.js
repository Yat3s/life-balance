Component({
  options: {
    addGlobalClass: true,
  },

  properties: {
    onClick: {
      type: Function,
      value: () => {},
    },
    cardConfig: {
      type: Object,
      value: {
        title: "",
        cardTitle: "",
        description: "",
        members: [],
        memberCount: 0,
        showDescription: true,
        showAvatars: true,
        showMemberCount: false,
      },
    },
  },

  methods: {
    onCardClick() {
      const onClick = this.data.onClick;
      if (typeof onClick === "function") {
        onClick();
      } else {
        wx.redirectTo({
          url: "/pages/index/index?page=connection",
        });
      }
    },
  },
});
