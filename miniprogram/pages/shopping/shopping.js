import { getAppConfig } from '../../repository/baseRepo';
import { fetchAllProducts } from '../../repository/productRepo';
import { navigateToPublishItem } from '../router';

const app = getApp();
const COLLAPSED_SCROLL_TOP = 200;
const MIN_TITLE_SCALE = 0.5;
const MIN_SUBTITLE_SCALE = 0.9;
const MAX_APP_BAR_HEIGHT = 200; //px

Component({
  options: {
    addGlobalClass: true,
  },
  properties: {},
  data: {
    officialProducts: [],
    secondhandProducts: [],
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    appBarHeight: MAX_APP_BAR_HEIGHT,
  },

  lifetimes: {
    attached() {
      this.fetchAllProducts();
    },
  },

  methods: {
    onPageScrolled(e) {
      const scrollTop = Math.min(COLLAPSED_SCROLL_TOP, e.detail.scrollTop);
      const minAppBarHeight =
        app.globalData.toolbarHeight + app.globalData.statusBarHeight;
      const appBarHeight =
        MAX_APP_BAR_HEIGHT -
        (MAX_APP_BAR_HEIGHT - minAppBarHeight) *
          (scrollTop / COLLAPSED_SCROLL_TOP);
      const collapsed = appBarHeight == minAppBarHeight;
      if (this.data.collapsed === true && collapsed === true) {
        return;
      }
      const titleScale =
        1.0 - (scrollTop / COLLAPSED_SCROLL_TOP) * (1.0 - MIN_TITLE_SCALE);
      const subtitleScale =
        1.0 - (scrollTop / COLLAPSED_SCROLL_TOP) * (1.0 - MIN_SUBTITLE_SCALE);

      this.setData({
        titleScale,
        subtitleScale,
        appBarHeight,
        collapsed,
      });
      console.log(e);
    },

    fetchAllProducts() {
      fetchAllProducts().then((res) => {
        if (res) {
          const officialProducts = res.data.filter(
            (product) => product.type === 'official'
          );
          const secondhandProducts = res.data.filter(
            (product) => product.type === 'secondhand'
          );

          this.setData({
            officialProducts: officialProducts,
            secondhandProducts: secondhandProducts,
          });
        }
      });

      getAppConfig().then((config) => {
        this.setData({
          fleaMarketKeywords: config.fleaMarketKeywords,
        });
      });
    },

    onFleaMarketSearchClicked() {
      this.setData({
        showSearchPage: true,
      });
    },

    onCircleSearchPageEnter() {
      console.log('onCircleSearchPageEnter');
      this.setData(
        {
          showFleaMarketSearchContent: true,
        },
        () => {
          setTimeout(() => {
            this.setData({
              fleaMarketSearchFocus: true,
            });
          }, 200);
        }
      );
    },

    onCircleSearchPageExit() {
      this.setData({
        showFleaMarketSearchContent: false,
      });
    },

    handleNavToPublishItemPage() {
      navigateToPublishItem();
    },
  },
});
