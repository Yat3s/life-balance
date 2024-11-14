import {
  navigateToBusInfo,
  navigationToAppConfigWebView,
} from "../../pages/router";
import { fetchParkingSpace } from "../../repository/dashboardRepo";

Component({
  options: {
    addGlobalClass: true,
  },
  data: {
    maxB25Spaces: 508,
    maxZhongmengSpaces: 223,
    loadingParkingSpace: true,
    parkingSpace: {
      b25Used: 0,
      zhongmengUsed: 0,
    },
  },

  lifetimes: {
    attached() {
      this.fetchParkingData();
      this.drawProgressRing("progressCanvasB25", 100);
      this.drawProgressRing("progressCanvasZhongmeng", 100);
    },
  },

  methods: {
    refresh() {
      this.setData({
        loadingParkingSpace: true,
      });
      this.fetchParkingData();
    },

    toShuttleBusDetail() {
      navigateToBusInfo();
    },

    toParkingTip() {
      navigationToAppConfigWebView("parkingTip");
    },

    toShuttleTip() {
      navigationToAppConfigWebView("shuttleTip");
    },

    fetchParkingData() {
      const { maxB25Spaces, maxZhongmengSpaces } = this.data;
      fetchParkingSpace().then((parkingSpace) => {
        console.log("parkingSpace", parkingSpace);

        const b25Used = parkingSpace.b25;
        const zhongmengUsed = parkingSpace.zhongmeng;

        // Calculate remaining spaces
        const b25Remaining = maxB25Spaces - b25Used;
        const zhongmengRemaining = maxZhongmengSpaces - zhongmengUsed;

        // Set the remaining spaces data
        this.setData({
          parkingSpace: {
            b25Remaining,
            zhongmengRemaining,
          },
          loadingParkingSpace: false,
        });

        // Draw progress rings for both spaces
        this.drawProgressRing(
          "progressCanvasB25",
          (b25Remaining / maxB25Spaces) * 100
        );
        this.drawProgressRing(
          "progressCanvasZhongmeng",
          (zhongmengRemaining / maxZhongmengSpaces) * 100
        );
      });
    },

    drawProgressRing(canvasId, progress) {
      const ctx = wx.createCanvasContext(canvasId, this);

      const fullColor = "#D3D3D3";
      const emptyColor = "#3679FF";
      const busyColor = "#FF4D4F";

      const isBusy = progress <= 10;

      const radius = 40;
      const lineWidth = 5;

      // Clear canvas before drawing
      ctx.clearRect(0, 0, 100, 100);

      // Draw background circle
      ctx.beginPath();
      ctx.arc(50, 50, radius, 0, Math.PI * 2);
      ctx.setLineWidth(lineWidth);
      ctx.setStrokeStyle(progress === 100 ? emptyColor : fullColor); // Background circle color
      ctx.setLineCap("round");
      ctx.stroke();

      // Draw progress circle with reversed start angle
      ctx.beginPath();
      ctx.arc(
        50,
        50,
        radius,
        Math.PI * (isBusy ? 2.25 : 0.75), // Start from the left bottom (left of the circle)
        isBusy
          ? Math.PI * 2 * (progress / 100) + Math.PI * (isBusy ? 2.25 : 0.75) // Busy condition (progress <= 10)
          : -Math.PI * 2 * ((100 - progress) / 100) +
              Math.PI * (isBusy ? 2.25 : 0.75) // Remaining spaces (progress > 10)
      );
      ctx.setStrokeStyle(isBusy ? busyColor : emptyColor); // Set progress circle color
      ctx.stroke();

      // Finalize drawing
      ctx.draw();
    },
  },
});
