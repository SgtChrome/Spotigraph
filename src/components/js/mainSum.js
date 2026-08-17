import * as d3 from "d3";

// Format date to a readable format
const formatDate = d3.timeFormat("%d. %B %Y");

const formatDuration = (durationInMilliseconds) => {
  if (!durationInMilliseconds || durationInMilliseconds < 0) return "0:00:00";
  const totalSeconds = Math.floor(durationInMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
};

class Tracki {
  constructor(trackName, artistName, msPlayed) {
    this.trackName = trackName;
    this.artistName = artistName;
    this.msPlayed = msPlayed;
  }
}

class Diagramm {
  constructor(
    data,
    filtering,
    charti,
    frame,
    running,
    onlyLastFrame,
    stoppedFrameIndex,
    singleSongFunction,
    externalDate,
    useListenedTime
  ) {
    this.data = data;
    this.filtering = filtering;
    this.charti = charti;
    this.frame = frame;
    this.running = running;
    this.onlyLastFrame = onlyLastFrame;
    this.stoppedFrameIndex = stoppedFrameIndex;
    this.singleSongFunction = singleSongFunction;
    this.externalDate = externalDate;

    this.useListenedTime = true;
    this.useListenedTimeReactive = useListenedTime;
    this.duration = 350;
    this.stepDelay = 180;
    this.n = 15;
    this.period = "all";

    this.margin = { top: 15, right: 90, bottom: 20, left: 15 };
    this.d3data = null;

    this.x = d3
      .scaleLinear()
      .domain([0, 1])
      .range([this.margin.left, this.width() - this.margin.right]);

    this.y = d3
      .scaleBand()
      .domain(d3.range(this.n + 1))
      .rangeRound([this.margin.top, this.height() - this.margin.bottom])
      .padding(0.18);

    this.currentData = {};
    this.visibleData = [];
    this.lastVisibleData = [];
    this.currentMinimum = 10000000;
    this.colorMap = new Map();
    this.consideredEvents = [];
    this.initChart();
  }

  updateVisibleData(idx, previousRank, trackNameAndArtist) {
    this.lastVisibleData = this.visibleData;
    const initialValue = this.currentData[trackNameAndArtist];
    const item = [
      this.data[idx].trackName,
      initialValue,
      previousRank,
      0,
      null,
      this.data[idx].artistName,
      this.data[idx].spotifyUri
        ? [this.data[idx].spotifyUri]
        : [this.data[idx].trackName, this.data[idx].artistName],
      this.filtering === "Albums" ? this.data[idx].albumName : "",
    ];
    item.currentValue = 0;
    this.visibleData.push(item);
    this.calculateRanks();
    this.currentMinimum = this.visibleData[this.visibleData.length - 1][1];
  }

  getTrackNameAndArtist(artistName, trackName, albumName) {
    let trackNameAndArtist = "";
    switch (this.filtering) {
      case "Songs":
        trackNameAndArtist = (trackName || "") + "___" + (artistName || "");
        break;
      case "Artists":
        trackNameAndArtist = artistName || "";
        break;
      case "Albums":
        trackNameAndArtist = (albumName || "") + "___" + (artistName || "");
        break;
      default:
        trackNameAndArtist = (trackName || "") + "___" + (artistName || "");
        break;
    }
    return trackNameAndArtist;
  }

  calcNewPositions(idx) {
    // visible data is [0 name, 1 value, 2 rank, 3 previous value, 4 previous rank, 5 artist, 6 spotifyUri, 7 albumName]
    // exclude tracks that are played for less than 5 seconds
    let triggerUpdate = false;
    if (this.data[idx].msPlayed < 1000 * 5) return false;

    let trackNameAndArtist = this.getTrackNameAndArtist(
      this.data[idx].artistName,
      this.data[idx].trackName,
      this.data[idx].albumName
    );

    if (this.period === "month") {
      let date = new Date(this.data[idx].endTime);
      while (
        this.consideredEvents.length > 0 &&
        this.consideredEvents[0].endTime < date.setDate(date.getDate() - 30)
      ) {
        if (this.useListenedTime) {
          this.currentData[trackNameAndArtist] -=
            this.consideredEvents.shift().msPlayed;
        } else {
          this.currentData[trackNameAndArtist] -= 1;
        }
        if (!triggerUpdate) {
          for (let i = 0; i < this.visibleData.length; ++i) {
            if (this.visibleData[i][0] === this.consideredEvents[0].trackName) {
              triggerUpdate = true;
              break;
            }
          }
        }
      }
      this.consideredEvents.push(this.data[idx]);
    }

    if (this.useListenedTime) {
      if (Object.prototype.hasOwnProperty.call(this.currentData, trackNameAndArtist)) {
        this.currentData[trackNameAndArtist] += this.data[idx].msPlayed;
      } else {
        this.currentData[trackNameAndArtist] = this.data[idx].msPlayed;
      }
    } else {
      if (Object.prototype.hasOwnProperty.call(this.currentData, trackNameAndArtist)) {
        this.currentData[trackNameAndArtist] += 1;
      } else {
        this.currentData[trackNameAndArtist] = 1;
      }
    }

    // check if track is in visible data
    for (let i = 0; i < this.visibleData.length; ++i) {
      if (
        this.getTrackNameAndArtist(
          this.visibleData[i][5],
          this.visibleData[i][0],
          this.visibleData[i][7]
        ) === trackNameAndArtist
      ) {
        this.visibleData[i][3] = this.visibleData[i][1];
        this.visibleData[i][1] = this.currentData[trackNameAndArtist];
        this.calculateRanks();
        this.currentMinimum = this.visibleData[this.visibleData.length - 1][1];
        return true;
      }
    }

    if (this.visibleData.length < this.n) {
      this.updateVisibleData(idx, this.visibleData.length, trackNameAndArtist);
      return true;
    } else if (this.currentData[trackNameAndArtist] > this.currentMinimum) {
      this.visibleData.splice(this.visibleData.length - 1, 1);
      this.updateVisibleData(idx, this.n, trackNameAndArtist);
      return true;
    }
    return triggerUpdate;
  }

  calculateRanks() {
    this.visibleData.sort(function (a, b) {
      return b[1] - a[1];
    });
    for (let i = 0; i < this.visibleData.length; ++i) {
      this.visibleData[i][4] = this.visibleData[i][2];
      this.visibleData[i][2] = i;
    }
  }

  doLabels(d) {
    if (this.filtering === "Songs") {
      return d[5] ? `${d[0]}  —  ${d[5]}` : (d[0] || "");
    } else if (this.filtering === "Albums") {
      return d[5] ? `${d[7]}  —  ${d[5]}` : (d[7] || "");
    } else {
      return d[5] || "";
    }
  }

  isLabelInside(d) {
    const barWidth = Math.max(0, this.x(d[1]) - this.x(0));
    if (barWidth >= 220) return true;

    const fullLabel = this.doLabels(d);
    const estimatedLabelWidth = (fullLabel ? fullLabel.length : 0) * 7.5;
    return barWidth >= estimatedLabelWidth + 100;
  }

  formatTruncatedLabel(label, availableWidth) {
    if (!label || availableWidth <= 20) return "";
    const maxChars = Math.floor(availableWidth / 7.5);
    if (maxChars <= 3) return "";
    if (label.length > maxChars) {
      return label.slice(0, Math.max(1, maxChars - 3)) + "...";
    }
    return label;
  }

  getRenderedLabel(d) {
    const fullLabel = this.doLabels(d);
    if (!fullLabel) return "";

    if (this.isLabelInside(d)) {
      const barWidth = Math.max(0, this.x(d[1]) - this.x(0));
      const availableWidth = barWidth - 12 - 75 - 15;
      return this.formatTruncatedLabel(fullLabel, availableWidth);
    } else {
      // Outside the bar: remaining space to the right edge of chart
      const spaceToRight = Math.max(
        0,
        this.width() - this.margin.right - this.x(d[1]) - 10 - 75 - 15
      );
      return this.formatTruncatedLabel(fullLabel, spaceToRight);
    }
  }

  getLabelX(d) {
    if (this.isLabelInside(d)) {
      return this.x(0) + 12;
    } else {
      return this.x(d[1]) + 10;
    }
  }

  getNumberX(d) {
    if (this.isLabelInside(d)) {
      return this.x(d[1]) - 10;
    } else {
      const renderedLabel = this.getRenderedLabel(d);
      const labelWidth = renderedLabel ? renderedLabel.length * 7.5 : 0;
      return this.x(d[1]) + 10 + labelWidth + 10;
    }
  }

  getNumberAnchor(d) {
    return this.isLabelInside(d) ? "end" : "start";
  }

  formatValue(val) {
    if (val === null || val === undefined) return "";
    if (this.useListenedTime) {
      return formatDuration(val);
    } else {
      return Math.round(val).toLocaleString();
    }
  }

  labels(svg) {
    let label = svg
      .append("g")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .style(
        "font-family",
        "Inter, BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, sans-serif"
      )
      .style("fill", "white")
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.75))")
      .attr("text-anchor", "start")
      .selectAll("text");

    return (transition) =>
      (label = label
        .data(this.visibleData, (d) => this.getTrackNameAndArtist(d[5], d[0], d[7]))
        .join(
          (enter) =>
            enter
              .append("text")
              .attr("dominant-baseline", "central")
              .attr("text-anchor", "start")
              .attr(
                "transform",
                (d) =>
                  `translate(${this.getLabelX(d)}, ${
                    this.y(d[4] !== null && d[4] !== undefined ? d[4] : this.n) +
                    this.y.bandwidth() / 2
                  })`
              )
              .text((d) => this.getRenderedLabel(d))
              .on("click", (_, d) => this.singleSongFunction(d[6])),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr(
                "transform",
                (d) =>
                  `translate(${this.getLabelX(d)}, ${
                    this.y(this.n) + this.y.bandwidth() / 2
                  })`
              )
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr(
              "transform",
              (d) =>
                `translate(${this.getLabelX(d)}, ${
                  this.y(d[2]) + this.y.bandwidth() / 2
                })`
            )
            .text((d) => this.getRenderedLabel(d))
        ));
  }

  numbers(svg) {
    const self = this;
    let label = svg
      .append("g")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style(
        "font-family",
        "Inter, BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, sans-serif"
      )
      .style("font-variant-numeric", "tabular-nums")
      .style("fill", "white")
      .style("filter", "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.75))")
      .selectAll("text");

    return (transition) =>
      (label = label
        .data(this.visibleData, (d) => this.getTrackNameAndArtist(d[5], d[0], d[7]))
        .join(
          (enter) =>
            enter
              .append("text")
              .attr("dominant-baseline", "central")
              .attr("transform", (d) => {
                const xPos = this.getNumberX(d);
                const yPos =
                  this.y(d[4] !== null && d[4] !== undefined ? d[4] : this.n) +
                  this.y.bandwidth() / 2;
                return `translate(${xPos}, ${yPos})`;
              })
              .attr("text-anchor", (d) => this.getNumberAnchor(d))
              .attr("fill-opacity", 0.95)
              .text((d) => self.formatValue(d.currentValue !== undefined ? d.currentValue : (d[3] || 0))),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr("transform", (d) => {
                const xPos = this.getNumberX(d);
                const yPos = this.y(this.n) + this.y.bandwidth() / 2;
                return `translate(${xPos}, ${yPos})`;
              })
              .attr("text-anchor", (d) => this.getNumberAnchor(d))
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr("transform", (d) => {
              const xPos = this.getNumberX(d);
              const yPos = this.y(d[2]) + this.y.bandwidth() / 2;
              return `translate(${xPos}, ${yPos})`;
            })
            .attr("text-anchor", (d) => this.getNumberAnchor(d))
            .tween("text", function (d) {
              const fromVal = d.currentValue !== undefined ? d.currentValue : (d[3] || 0);
              const toVal = d[1];
              if (fromVal === toVal) {
                this.textContent = self.formatValue(toVal);
                return;
              }
              const i = d3.interpolateNumber(fromVal, toVal);
              return function (t) {
                const val = i(t);
                d.currentValue = val;
                this.textContent = self.formatValue(val);
              };
            })
        ));
  }

  axis(svg) {
    const g = svg
      .append("g")
      .attr("transform", `translate(0,${this.margin.top})`);

    const axis = d3
      .axisTop(this.x)
      .ticks(this.width() / 150)
      .tickSizeOuter(0)
      .tickSizeInner(-(this.height() - this.margin.top - this.margin.bottom))
      .tickFormat(() => ""); // No x-axis labels

    return (transition) => {
      g.transition(transition).call(axis);
      g.selectAll(".tick text").remove();
      g.selectAll(".tick line")
        .attr("stroke", "rgba(255, 255, 255, 0.08)")
        .attr("stroke-dasharray", "2,2");
      g.select(".domain").remove();
    };
  }

  ticker(svg) {
    const now = svg
      .append("text")
      .style("font-family", "Inter, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif")
      .style("font-size", "28px")
      .style("font-weight", "700")
      .style("font-variant-numeric", "tabular-nums")
      .style("fill", "rgba(255, 255, 255, 0.45)")
      .attr("text-anchor", "end")
      .attr("x", this.width() - this.margin.right)
      .attr("y", this.height() - this.margin.bottom - 4)
      .text(
        this.data && this.data[0]
          ? formatDate(new Date(this.data[0].endTime))
          : ""
      );

    return (idx) => {
      if (!this.data[idx]) return;
      const parsed =
        d3.timeParse("%Y-%m-%d")(this.data[idx].endTime.split(" ")[0]) ||
        new Date(this.data[idx].endTime);
      now.text(formatDate(parsed));
    };
  }

  color(artist) {
    if (this.colorMap.has(artist)) {
      return this.colorMap.get(artist);
    } else {
      const color = d3.color(d3.interpolateWarm(Math.random()));
      this.colorMap.set(artist, color);
      return color;
    }
  }

  bars(svg) {
    let bar = svg
      .append("g")
      .selectAll("rect");

    return (transition) =>
      (bar = bar
        .data(this.visibleData, (d) => this.getTrackNameAndArtist(d[5], d[0], d[7]))
        .join(
          (enter) =>
            enter
              .append("rect")
              .attr("rx", 5)
              .attr("ry", 5)
              .attr("fill", (d) => this.color(d[5]))
              .attr("height", this.y.bandwidth())
              .attr("x", this.x(0))
              .attr(
                "y",
                (d) =>
                  this.y(d[4] !== null && d[4] !== undefined ? d[4] : this.n)
              )
              .attr("width", (d) => Math.max(0, this.x(d[3] || 0) - this.x(0))),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr("y", this.y(this.n))
              .attr("width", (d) => Math.max(0, this.x(d[1]) - this.x(0)))
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr("y", (d) => this.y(d[2]))
            .attr("width", (d) => Math.max(0, this.x(d[1]) - this.x(0)))
            .attr("height", this.y.bandwidth())
        ));
  }

  height() {
    return 500;
  }

  width() {
    return 1200;
  }

  initChart() {
    this.svg = d3
      .select(this.charti)
      .append("svg")
      .attr("viewBox", [0, 0, this.width(), this.height()])
      .attr("preserveAspectRatio", "xMidYMid meet")
      .classed("svg-content-responsive", true);

    this.y = d3
      .scaleBand()
      .domain(d3.range(this.n + 1))
      .rangeRound([this.margin.top, this.height() - this.margin.bottom])
      .padding(0.18);

    this.x = d3
      .scaleLinear()
      .domain([0, 1])
      .range([this.margin.left, this.width() - this.margin.right]);

    this.updateBars = this.bars(this.svg);
    this.updateAxis = this.axis(this.svg);
    this.updateLabels = this.labels(this.svg);
    this.updateNumbers = this.numbers(this.svg);
    this.updateTicker = this.ticker(this.svg);
  }

  initData(data) {
    if (this.svg) {
      this.svg.remove();
    }
    this.initChart();
    this.data = data;
    this.visibleData = [];
    this.lastVisibleData = [];
    this.currentData = {};
    this.consideredEvents = [];
    this.currentMinimum = 0;
    this.useListenedTime = this.useListenedTimeReactive.value;
  }

  replay(i) {
    return new Promise(async (resolve) => {
      if (!i) i = 0;
      while (i < this.data.length) {
        if (!this.running.value) {
          if (this.svg) this.svg.transition();
          this.stoppedFrameIndex.value = i;
          resolve();
          return;
        }
        this.frame.value = i;

        if (this.calcNewPositions(i)) {
          if (!this.onlyLastFrame.value) {
            this.render(i);
            await new Promise((r) => setTimeout(r, this.stepDelay));
          }
        }
        i++;
      }
      if (this.onlyLastFrame.value) {
        this.render(this.data.length - 1);
        resolve();
      } else {
        resolve();
      }
    });
  }

  updateExternalDate(idx) {
    if (!this.data || !this.data[idx]) return;
    this.externalDate.value =
      formatDate(d3.timeParse("%Y-%m-%d")(this.data[0].endTime.split(" ")[0])) +
      " - " +
      formatDate(
        d3.timeParse("%Y-%m-%d")(this.data[idx].endTime.split(" ")[0])
      );
  }

  render(i) {
    const transition = this.svg
      .transition()
      .duration(this.duration)
      .ease(d3.easeLinear);

    const maxVal =
      this.visibleData && this.visibleData.length > 0
        ? this.visibleData[0][1]
        : 1;
    this.x.domain([0, Math.max(1, maxVal)]);

    this.updateAxis(transition);
    this.updateBars(transition);
    this.updateLabels(transition);
    this.updateNumbers(transition);
    this.updateTicker(i);
  }
}

export { Diagramm };

