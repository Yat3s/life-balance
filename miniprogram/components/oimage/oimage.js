const httpsBaseUrl =
  "https://6c69-life-6go5gey72a61a773-1259260883.tcb.qcloud.la/";
const cloudBasePath =
  "cloud://life-6go5gey72a61a773.6c69-life-6go5gey72a61a773-1259260883/";

Component({
  options: {
    addGlobalClass: true,
  },
  /**
   * Component properties
   */
  properties: {
    className: {
      type: String,
      value: "",
    },
    url: {
      type: String,
      value: "",
      observer: function (newVal, oldVal) {
        this.convertCloudToHttps();
      },
    },
    useThumbnail: {
      type: Boolean,
      value: false,
    },
    width: {
      type: Number,
      value: 0,
    },
    height: {
      type: Number,
      value: 0,
    },
  },

  /**
   * Component initial data
   */
  data: {
    imageUrl: "",
  },

  lifetimes: {
    attached() {
      this.convertCloudToHttps();
    },
  },

  /**
   * Component methods
   */
  methods: {
    convertCloudToHttps() {
      const { url, width, height, useThumbnail } = this.data;

      if (!url) {
        return;
      }

      let imageUrl = url;
      if (url.startsWith(cloudBasePath)) {
        const filePath = url.replace(cloudBasePath, "");
        const rule = useThumbnail
          ? `imageView2/2/w/${width}/h/${height}/format/webp`
          : "";
        imageUrl = rule ? `${httpsBaseUrl}${filePath}?${rule}` : url;
      }

      this.setData({
        imageUrl,
      });
    },
  },
});
