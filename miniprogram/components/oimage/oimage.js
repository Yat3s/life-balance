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
    /**
     * Converts cloud URLs to HTTPS and applies transformations if necessary.
     */
    convertCloudToHttps() {
      const { url, useThumbnail, width, height } = this.data;

      // If no URL or URL is not from the cloud base path, no transformation is needed
      if (!url || !url.startsWith(cloudBasePath)) {
        return this.setData({ imageUrl: url });
      }

      // If useThumbnail is false, return the original URL
      if (!useThumbnail) {
        return this.setData({ imageUrl: url });
      }

      // Prepare file path and generate the transformed URL
      const filePath = url.replace(cloudBasePath, "");
      const transformedUrl = this.buildThumbnailUrl(filePath, width, height);

      // Set the transformed image URL
      this.setData({ imageUrl: transformedUrl });
    },

    /**
     * Builds the transformed image URL with thumbnail options.
     * @param {string} filePath - The cloud file path.
     * @param {number} width - The width for the thumbnail.
     * @param {number} height - The height for the thumbnail.
     * @returns {string} - The transformed image URL.
     */
    buildThumbnailUrl(filePath, width, height) {
      let rule = "imageView2/2"; // Apply basic transformation
      if (width) rule += `/w/${width}`; // Apply width if provided
      if (height) rule += `/h/${height}`; // Apply height if provided
      rule += "/format/webp"; // Ensure the format is webp

      return `${httpsBaseUrl}${filePath}?${rule}`;
    },
  },
});