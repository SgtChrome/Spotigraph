import * as d3 from "d3";

// format the date time to a readable format in
const formatDate = d3.timeFormat("%d. %B %Y");
const formatNumber = d3.utcFormat("%H:%M:%S");

class Diagramm {
  constructor(
    data,
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
    this.charti = charti;
    this.frame = frame;
    this.running = running;
    this.onlyLastFrame = onlyLastFrame;
    this.stoppedFrameIndex = stoppedFrameIndex;
    this.singleSongFunction = singleSongFunction;
    this.externalDate = externalDate;

    this.useListenedTime = true;
    this.useListenedTimeReactive = useListenedTime;
    this.duration = 100;
    this.n = 15;
    this.period = "all";

    (this.margin = { top: 0, right: 6, bottom: 6, left: 0 }),
      (this.barsize = 12),
      (this.d3data = null),
      (this.x = d3
        .scaleLinear()
        .domain([0, 1])
        .range([this.margin.left, this.width() - this.margin.right]));
    this.y = d3
      .scaleBand()
      .domain(d3.range(this.n + 1))
      .rangeRound([
        this.margin.top,
        this.margin.top + this.barsize * (this.n + 1 + 0.1),
      ])
      .padding(0.1);

    this.currentData = {};
    this.visibleData = [];
    this.currentMinimum = 10000000;
    this.colorMap = new Map();
    this.consideredEvents = [];
    this.initChart();
  }
  updateVisibleData(idx, previousRank) {
    this.lastVisibleData = this.visibleData;
    this.visibleData.push([
      this.data[idx].trackName,
      this.currentData[this.data[idx].trackName],
      previousRank,
      0,
      null,
      this.data[idx].artistName,
    ]);
    this.calculateRanks();
    this.currentMinimum = this.visibleData[this.visibleData.length - 1][1];
  }

  calcNewPositions(idx) {
    // visible data is [0 name, 1 value, 2 rank, 3 previous value, 4 previous rank, 5 artist]
    // exclude tracks that are played for less than 5 seconds
    let triggerUpdate = false;
    if (this.data[idx].msPlayed < 1000 * 5) return false;

    if (this.period === "month") {
      // check if event occured in the last 30 days
      let date = new Date(this.data[idx].endTime);
      // while the first event is older than 30 days, remove it from the considered events
      while (
        this.consideredEvents.length > 0 &&
        this.consideredEvents[0].endTime < date.setDate(date.getDate() - 30)
      ) {
        if (this.useListenedTime) {
          this.currentData[this.consideredEvents[0].trackName] -=
            this.consideredEvents.shift().msPlayed;
        } else {
          this.currentData[this.consideredEvents[0].trackName] -= 1;
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
      // check if track is in current data
      if (this.currentData.hasOwnProperty(this.data[idx].trackName)) {
        this.currentData[this.data[idx].trackName] += this.data[idx].msPlayed;
      } else {
        this.currentData[this.data[idx].trackName] = this.data[idx].msPlayed;
      }
    } else {
      if (this.currentData.hasOwnProperty(this.data[idx].trackName)) {
        this.currentData[this.data[idx].trackName] += 1;
      } else {
        this.currentData[this.data[idx].trackName] = 1;
      }
    }

    // check if track is in visible data
    for (let i = 0; i < this.visibleData.length; ++i) {
      if (this.visibleData[i][0] === this.data[idx].trackName) {
        // set new value
        this.visibleData[i][1] = this.currentData[this.data[idx].trackName];
        this.calculateRanks();
        this.currentMinimum = this.visibleData[this.visibleData.length - 1][1];
        return true;
      }
    }

    if (this.visibleData.length < this.n) {
      this.updateVisibleData(idx, this.visibleData.length);
      return true;
    } else if (
      this.currentData[this.data[idx].trackName] > this.currentMinimum
    ) {
      this.visibleData.splice(this.visibleData.length - 1, 1);
      // add the new entry to visibleData
      this.updateVisibleData(idx, this.n);
      return true;
    }
    return triggerUpdate;
  }

  calculateRanks() {
    // calculate the ranks for the entries in visible data
    this.visibleData.sort(function (a, b) {
      return b[1] - a[1];
    });
    for (let i = 0; i < this.visibleData.length; ++i) {
      // set previous rank
      this.visibleData[i][4] = this.visibleData[i][2];
      // set new rank
      this.visibleData[i][2] = i;
    }
  }
  doLabels(d) {
    if (this.x(d[1]) - this.x(0) - 45 < d[0].length * 3) {
      return (
        d[0].substring(0, Math.floor((this.x(d[1]) - this.x(0) - 45) / 3)) +
        "..."
      );
    } else {
      return d[0];
    }
  }
  labels(svg) {
    let label = svg
      .append("g")
      .style("font-size", "8px")
      .style("font-weight", "500")
      .style(
        "font-family",
        "Inter,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif"
      )
      .style("font-variant-numeric", "tabular-nums")
      .style("fill", "white")
      .style("cursor", "pointer")
      .attr("text-anchor", "start")
      .selectAll("text");

    return ([date, data], transition) =>
      (label = label
        .data(this.visibleData, (d) => d)
        .join(
          (enter) =>
            enter
              .append("text")
              .attr("transform", (d) => `translate(0,${this.y(d[4])})`)
              .attr("y", this.y.bandwidth() / 2)
              .attr("x", 1.2)
              .attr("dy", "0.4em")
              .text((d) => this.doLabels(d))
              .on("click", () => this.singleSongFunction(this)),
          //.attr("dy", "-1.15em")),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr("transform", (d) => `translate(0,${this.y(this.n)})`)
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr("transform", (d) => `translate(0,${this.y(d[2])})`)
            .text((d) => this.doLabels(d))
        ));
  }
  images(svg) {
    let image = svg
      .append("g")
      .attr("width", 10)
      .attr("height", 10)
      .attr("x", -6)
      .attr("y", this.y.bandwidth() / 2);

    return ([date, data], transition) =>
      (image = image
        .data(this.visibleData, (d) => d)
        .join(
          (enter) =>
            enter
              .append("image")
              .attr(
                "transform",
                (d) => `translate(0,${this.y((this.prev.get(d) || d).rank)})`
              )
              .attr("y", this.y.bandwidth() / 2)
              .attr("x", 1)
              .attr(
                "href",
                "https://www.redditstatic.com/awards2/8_year_club-40.png"
              ),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr(
                "transform",
                (d) => `translate(0,${this.y((this.next.get(d) || d).rank)})`
              )
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr("transform", (d) => `translate(0,${this.y(d.rank)})`)
        ));
  }
  numbers(svg) {
    let label = svg
      .append("g")
      .style("font-size", "8px")
      .style(
        "font-family",
        "Inter,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif"
      )
      .style("font-variant-numeric", "tabular-nums")
      .style("fill", "white")
      .attr("text-anchor", "end")
      .selectAll("text");

    return ([date, data], transition) =>
      (label = label
        .data(this.visibleData, (d) => d)
        .join(
          (enter) =>
            enter
              .append("text")
              .attr(
                "transform",
                (d) => `translate(${this.x(d[3])},${this.y(d[4])})`
              )
              .attr("fill-opacity", 0.9)
              .attr("font-weight", "normal")
              .attr("dy", "1.05em")
              .attr("dx", "-0.2em"),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr(
                "transform",
                (d) => `translate(${this.x(d[1])},${this.y(this.n)})`
              )
              .call((g) =>
                g
                  .select("text")
                  .tween("text", (d) => this.textTween(d[3], d[1]))
              )
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr(
              "transform",
              (d) => `translate(${this.x(d[1])},${this.y(d[2])})`
            )
            .tween("text", (d) => {
              if (this.useListenedTime) {
                return this.textTween(d[3], d[1]);
              } else {
                return function () {
                  return (this.textContent = d[1]);
                };
              }
            })
        ));
  }
  textTween(a, b) {
    const i = d3.interpolateNumber(a, b);
    return function (t) {
      this.textContent = formatNumber(i(t));
    };
  }
  axis(svg) {
    const g = svg
      .append("g")
      .attr("transform", `translate(0,${this.margin.top})`);

    const axis = d3
      .axisTop(this.x)
      .ticks(this.width / 160)
      .tickSizeOuter(0)
      .tickSizeInner(-this.barsize * (this.n + this.y.padding()));

    return (_, transition) => {
      g.transition(transition).call(axis);
      g.select(".tick:first-of-type text").remove();
      g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
      g.select(".domain").remove();
    };
  }
  ticker(svg) {
    const now = svg
      .append("text")
      .style("font-size", "1px")
      .style("font", `bold ${this.barsize}px var(--sans-serif)`)
      .style("font-variant-numeric", "tabular-nums")
      .style("fill", "white")
      .attr("text-anchor", "end")
      .attr("x", this.width() - 3)
      .attr("y", this.margin.top + this.barsize * (this.n - 0.45))
      .attr("dy", "0.32em")
      .text(formatDate(this.data[0].endTime));

    return (idx, transition) => {
      now.text(
        /* formatDate(
            d3.timeParse("%Y-%m-%d")(this.data[0].endTime.split(" ")[0])
          ) +
            " - \n" + */
        formatDate(
          d3.timeParse("%Y-%m-%d")(this.data[idx].endTime.split(" ")[0])
        )
      );
    };
  }
  color(artist) {
    // lookup color by name or create a new color if name is not in the map
    // get all unique names from data
    // const names = Array.from(new Set(this.data.flatMap(d => d.map(d => d[5]))));
    if (this.colorMap.has(artist)) {
      // If the category exists, return the corresponding color
      return this.colorMap.get(artist);
    } else {
      // If the category does not exist, generate a new random color
      //const color = d3.color(d3.interpolateInferno(Math.random()));
      const color = d3.color(d3.interpolateWarm(Math.random()));
      //const color = d3.color(d3.interpolateTurbo(Math.random()));
      //const color = d3.color(d3.interpolateRainbow(Math.random()));
      //const color = d3.color(d3.interpolateBlues(Math.random()));

      // Add the new category and color to the map
      this.colorMap.set(artist, color); //.darker());
      // Return the newly generated color
      return color;
    }
  }
  bars(svg) {
    let bar = svg
      .append("g")
      //.attr("fill-opacity", 1)
      .selectAll("rect");

    return ([date, data], transition) =>
      (bar = bar
        .data(this.visibleData, (d) => d)
        .join(
          (enter) =>
            enter
              .append("rect")
              .attr("rx", 2)
              .attr("fill", (d) => this.color(d[5]))
              .attr("height", this.y.bandwidth())
              .attr("x", this.x(0) + 0.1)
              .attr("y", (d) => this.y(d[4]))
              .attr("width", (d) => this.x(d[3]) - this.x(0)),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr("y", (d) => this.y(this.n))
              .attr("width", (d) => this.x(d[1]) - this.x(0))
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr("y", (d) => this.y(d[2]))
            .attr("width", (d) => this.x(d[1]) - this.x(0))
        ));
  }
  height() {
    return this.margin.top + this.barsize * this.n + this.margin.bottom;
  }
  width() {
    return 500;
  }
  initChart() {
    this.svg = d3
      .select(this.charti)
      .append("svg")
      .attr("viewBox", [0, 0, this.width(), this.height()])
      .attr("preserveAspectRatio", "xMinYMin meet")
      .classed("svg-content-responsive", true);

    this.updateBars = this.bars(this.svg);
    this.updateAxis = this.axis(this.svg);
    //this.updateImages = this.images(this.svg);
    this.updateLabels = this.labels(this.svg);
    this.updateNumbers = this.numbers(this.svg);
    this.updateTicker = this.ticker(this.svg);
  }
  initData(data) {
    this.svg.remove();
    this.initChart();
    this.data = data;
    this.visibleData = [];
    this.lastVisibleData = [];
    this.currentData = [];
    this.consideredEvents = [];
    this.currentMinimum = 0;
    this.useListenedTime = this.useListenedTimeReactive.value;
  }
  replay(i) {
    return new Promise(async (resolve) => {
      if (!i) i = 0;
      while (i < this.data.length) {
        if (!this.running.value) {
          this.svg.transition();
          this.stoppedFrameIndex.value = i;
          resolve();
          return;
        }
        this.frame.value = i;

        //this.data.length

        if (this.calcNewPositions(i)) {
          if (!this.onlyLastFrame.value) await this.render(i);
          // set previous value
          for (let i = 0; i < this.visibleData.length; ++i) {
            this.visibleData[i][3] = this.lastVisibleData[i][1];
          }
        }
        i++;
      }
      if (this.onlyLastFrame.value) {
        await this.render(this.data.length - 1);
        resolve();
      } else {
        resolve();
      }
    });
  }
  updateExternalDate(idx) {
    this.externalDate.value =
      formatDate(d3.timeParse("%Y-%m-%d")(this.data[0].endTime.split(" ")[0])) +
      " - " +
      formatDate(
        d3.timeParse("%Y-%m-%d")(this.data[idx].endTime.split(" ")[0])
      );
  }
  async render(i) {
    const transition = this.svg
      .transition()
      .duration(this.duration)
      .ease(d3.easeLinear);

    // scale the graph
    this.x.domain([0, this.visibleData[0][1]]);

    this.updateAxis(transition);
    this.updateBars(transition);
    this.updateLabels(transition);
    this.updateNumbers(transition);
    this.updateTicker(i, transition);
    //this.updateImages(transition);
    //this.updateExternalDate(i);
    await transition.end();
  }
}

export { Diagramm };
