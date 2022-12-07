"use strict";

function start() {
  let inst = new Diagramm();

  /* fetch('data/category-brands.csv')
  .then(response => response.text())
  .then(response => inst.init(response)) */

  fetch('data/example/StreamingHistory0.json')
  .then(response => response.json())
  .then(response => inst.initJSON(response))
}

const formatDate = d3.utcFormat("%B %Y");
// format ms to minutes d3
const formatNumber = d3.utcFormat("%H:%M:%S");

class Diagramm {
  constructor() {
    this.d3data = null,
    this.duration = 100,
    this.n = 15,
    this.k = 10,
    this.barsize = 12,
    this.margin = {top: 0, right: 6, bottom: 6, left: 0},
    this.x = d3.scaleLinear()
      .domain([0, 1])
      .range([this.margin.left, this.width() - this.margin.right])
    this.y = d3.scaleBand()
      .domain(d3.range(this.n + 1))
      .rangeRound([this.margin.top, this.margin.top + this.barsize * (this.n + 1 + 0.1)])
      .padding(0.1)
    this.data = null
    this.currentData = {}
    this.visibleData = []
    this.currentMinimum = 10000000
    this.colorMap = new Map()
  }

  initCSV(data) {
    this.data = d3.csvParse(data, d3.autoType)
    console.log(this.data)
    this.prepareData(this.data)
    this.replay()
  }
  initJSON(data) {
    this.data = data
    console.log(this.data)
    //this.prepareData(this.data)
    this.replay()
  }
  rank(value) {
    const data = Array.from(this.names, name => ({name, value: value(name)}));
    data.sort((a, b) => d3.descending(a.value, b.value));
    for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(this.n, i);
    return data;
  }
  updateVisibleData(idx, previousRank) {
    this.lastVisibleData = this.visibleData;
    this.visibleData.push([this.data[idx].trackName, this.currentData[this.data[idx].trackName], previousRank, 0, null, this.data[idx].artistName]);
    this.calculateRanks();
    this.currentMinimum = this.visibleData[this.visibleData.length - 1][1];
  }

  calcNewPositions(idx) {
    // visible data is [0 name, 1 value, 2 rank, 3 previous value, 4 previous rank, 5 artist]
    // check if track is in current data
    if (this.currentData.hasOwnProperty(this.data[idx].trackName)) {
      this.currentData[this.data[idx].trackName] += this.data[idx].msPlayed;
    } else {
      this.currentData[this.data[idx].trackName] = this.data[idx].msPlayed;
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
      this.updateVisibleData(idx, this.visibleData.length)
      return true;
    } else if (this.currentData[this.data[idx].trackName] > this.currentMinimum) {
      this.visibleData.splice(this.visibleData.length - 1, 1);
      // add the new entry to visibleData
      this.updateVisibleData(idx, this.n);
      return true;
    }
    return false;
  }

  calculateRanks() {
    // calculate the ranks for the entries in visible data
    this.visibleData.sort(function(a,b){
      return b[1] - a[1];
    });
    for (let i = 0; i < this.visibleData.length; ++i) {
      // set previous rank
      this.visibleData[i][4] = this.visibleData[i][2];
      // set new rank
      this.visibleData[i][2] = i;
    }
  }
  prepareData(data) {
    d3.group(data, d => d.trackName)
    this.names = new Set(data.map(d => d.trackName))

    this.datevalues = Array.from(d3.rollup(data, ([d]) => d.msPlayed, d => d.endTime.split(" ")[0], d => d.trackName))
    let test = this.datevalues
      .map(([endTime, data]) => [new Date(endTime), data])
      .sort(([a], [b]) => d3.ascending(a, b))

    this.keyframes = this.keyframesFun()
    let nameframes = d3.groups(this.keyframes.flatMap(([, data]) => data), d => d.name)

    this.prev = new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])))
    this.next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)))
  }

  keyframesFun() {
    const keyframes = [];
    let ka, a, kb, b;
    for ([[ka, a], [kb, b]] of d3.pairs(this.datevalues)) {
      for (let i = 0; i < this.k; ++i) {
        const t = i / this.k;
        keyframes.push([
          new Date(ka * (1 - t) + kb * t),
          this.rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
        ]);
      }
    }
    keyframes.push([new Date(kb), this.rank(name => b.get(name) || 0)]);
    return keyframes;
  }
  labels(svg) {
    let label = svg.append("g")
        .style("font-size", "8px")
        .style("font-weight", "bold")
        .style("font-family", "Inter,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif")
        .style("font-variant-numeric", "tabular-nums")
        .style("fill", "white")
        .attr("text-anchor", "start")
        .selectAll("text");

        return ([date, data], transition) => label = label
        .data(this.visibleData, d => d)
        .join(
          enter => enter.append("text")
          .attr("transform", d => `translate(0,${this.y(d[4])})`)
          .attr("y", this.y.bandwidth() / 2)
          .attr("x", 1)
          .attr("dy", "0.4em")
          .text(d => d[0]),
            //.attr("dy", "-1.15em")),
        update => update,
        exit => exit.transition(transition).remove()
          .attr("transform", d => `translate(0,${this.y(this.n)})`)
          //.call(g => g.select("tspan").tween("text", d => this.textTween(d.value, (this.next.get(d) || d).value)))
      )
      .call(bar => bar.transition(transition)
        .attr("transform", d => `translate(0,${this.y(d[2])})`)
        //.call(g => g.select("tspan").tween("text", d => this.textTween((this.prev.get(d) || d).value, d.value))))
      )
  }
  images (svg) {
    let image = svg.append("g")
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", -6)
        .attr("y", this.y.bandwidth() / 2)

    return ([date, data], transition) => image = image
        .data(this.visibleData, d => d)
        .join(
          enter => enter.append("image")
          .attr("transform", d => `translate(0,${this.y((this.prev.get(d) || d).rank)})`)
          .attr("y", this.y.bandwidth() / 2)
          .attr("x", 1)
          .attr("href", "https://www.redditstatic.com/awards2/8_year_club-40.png"),
        update => update,
        exit => exit.transition(transition).remove()
          .attr("transform", d => `translate(0,${this.y((this.next.get(d) || d).rank)})`)
        )
        .call(bar => bar.transition(transition)
          .attr("transform", d => `translate(0,${this.y(d.rank)})`)
        )
  }
  numbers(svg) {
    let label = svg.append("g")
        .style("font-size", "8px")
        .style("font-family", "Inter,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif")
        .style("font-variant-numeric", "tabular-nums")
        .style("fill", "white")
        .attr("text-anchor", "end")
      .selectAll("text");

    return ([date, data], transition) => label = label
      .data(this.visibleData, d => d)
      .join(
        enter => enter.append("text")
            .attr("transform", d => `translate(${this.x(d[3])},${this.y(d[4])})`)
            .attr("fill-opacity", 0.8)
            .attr("font-weight", "normal")
            .attr("dy", "1.05em")
            .attr("dx", "-0.2em"),
        update => update,
        exit => exit.transition(transition).remove()
          .attr("transform", d => `translate(${this.x(d[1])},${this.y(this.n)})`)
          .call(g => g.select("text").tween("text", d => this.textTween(d[3], d[1])))
      )
      .call(bar => bar.transition(transition)
        .attr("transform", d => `translate(${this.x(d[1])},${this.y(d[2])})`)
        .tween("text", d => this.textTween(d[3], d[1])))
  }
  textTween(a, b) {
    const i = d3.interpolateNumber(a, b);
    return function(t) {
      this.textContent = formatNumber(i(t));
    };
  }
  axis(svg) {
    const g = svg.append("g")
        .attr("transform", `translate(0,${this.margin.top})`);

    const axis = d3.axisTop(this.x)
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
    const now = svg.append("text")
        .style("font", `bold ${this.barsize}px var(--sans-serif)`)
        .style("font-variant-numeric", "tabular-nums")
        .style("fill", "white")
        .attr("text-anchor", "end")
        .attr("x", this.width() - 6)
        .attr("y", this.margin.top + this.barsize * (this.n - 0.45))
        .attr("dy", "0.32em")
        .text(formatDate(this.data[0].endTime));

    return (idx, transition) => {
      transition.end().then(() => now.text(formatDate(d3.timeParse("%Y-%m-%d")(this.data[idx].endTime.split(" ")[0]))));
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
      //const color = d3.color(d3.interpolateWarm(Math.random()));
      const color = d3.color(d3.interpolateTurbo(Math.random()));

      // Add the new category and color to the map
      this.colorMap.set(artist, color);
      // Return the newly generated color
      return color;
    }
  }
  bars(svg) {
    let bar = svg.append("g")
        //.attr("fill-opacity", 1)
      .selectAll("rect");

    return ([date, data], transition) => bar = bar
      .data(this.visibleData, d => d)
      .join(
        enter => enter.append("rect")
          .attr("rx", 2)
          .attr("fill", d => this.color(d[5]))
          .attr("height", this.y.bandwidth())
          .attr("x", this.x(0))
          .attr("y", d => this.y(d[4]))
          .attr("width", d => this.x(d[3]) - this.x(0)),
        update => update,
        exit => exit.transition(transition).remove()
          .attr("y", d => this.y(this.n))
          .attr("width", d => this.x(d[1]) - this.x(0))
      )
      .call(bar => bar.transition(transition)
        .attr("y", d => this.y(d[2]))
        .attr("width", d => this.x(d[1]) - this.x(0)));
  }
  height() {
    return this.margin.top + this.barsize * this.n + this.margin.bottom
  }
  width() {
    return 500
  }
  async replay() {
    const svg = d3.select("#charti")
        .append("svg")
        .attr("viewBox", [0, 0, this.width(), this.height()]);

    const updateBars = this.bars(svg);
    const updateAxis = this.axis(svg);
    //const updateImages = this.images(svg);
    const updateLabels = this.labels(svg);
    const updateNumbers = this.numbers(svg);
    const updateTicker = this.ticker(svg);

    for (let i = 0; i < this.data.length; ++i) { //this.data.length
      const transition = svg.transition()
        .duration(this.duration)
        .ease(d3.easeLinear);

      if (this.calcNewPositions(i)) {
        // scale the graph
        this.x.domain([0, this.visibleData[0][1]]);
        updateAxis(transition);
        updateBars(transition);
        //updateImages(transition);
        updateLabels(transition);
        updateNumbers(transition);
        updateTicker(i, transition);
        await transition.end();
        // set previous value
        for (let i = 0; i < this.visibleData.length; ++i) {
          this.visibleData[i][3] = this.lastVisibleData[i][1];
        }
      }
    }
  }
}

start()