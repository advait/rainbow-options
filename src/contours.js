import React from "react";
import * as d3 from "d3";
import {portfolioValue} from "./blackscholes";
import moment from "moment";

export class Contours extends React.Component {

  render() {
    return (
        <div id="canvas-container">
          <D3Contours {...this.props} />
          <GainsTooltip
              st={this.props.st}
              pctGain={this.props.portfolioValue.pctGain}
          />
        </div>
    )
  }
}

class D3Contours extends React.Component {
  constructor(props) {
    super(props);
    this.d3ContainerRef = React.createRef();
    this.state = {
      y0: 1000,
      yFinal: 100,
    };

    this.timeWindow = this.props.timeWindow;
    this.portfolio = this.props.portfolio;
    this.r = this.props.r;
    this.sigma = this.props.sigma;
  }

  /**
   * Handle a mouse move/out event, update the S and T positions based on the coordinates of the mouse.
   * @param e {MouseEvent}
   * @param show {boolean} whether to show the gains tooltip (is the mouse over the contour graph?)
   */
  updateST(e, show) {
    let node = e.target;
    while (node.id !== "canvas-container") {
      node = node.parentElement;
      if (!node) {
        throw new Error("Could not find canvas-container");
      }
    }
    const bounds = node.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    const t = this.tScale.invert(x);
    const s = this.yScale.invert(y);
    this.props.setST({s, t: moment(t), mouseX: e.clientX, mouseY: e.clientY, show});
  }

  componentDidMount() {
    this.initD3();
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    // Major hacks to get d3 to play nicely with react's lifecycle
    // Here, we only want to update D3 if any portfolio/options-related props have changed
    if (this.timeWindow.t0 !== nextProps.timeWindow.t0 ||
        this.timeWindow.tFinal !== nextProps.timeWindow.tFinal ||
        JSON.stringify(this.props.portfolio) !== JSON.stringify(nextProps.portfolio) ||
        this.r !== nextProps.r ||
        this.sigma !== nextProps.sigma) {

      // Now that we've confirmed that the props have changed, we need to manually overwrite them
      this.timeWindow.t0 = nextProps.timeWindow.t0;
      this.timeWindow.tFinal = nextProps.timeWindow.tFinal;
      this.portfolio = nextProps.portfolio;
      this.r = nextProps.r;
      this.sigma = nextProps.sigma;

      this.updateD3();
    }

    // Always prevent react from re-rendering our DOM as d3 is reponsible for managing it.
    return false;
  }

  render() {
    return (
        <div ref={this.d3ContainerRef}
             id="d3-container"
             onMouseMove={e => this.updateST(e, true)}
             onMouseOut={e => this.updateST(e, false)} />
    );
  }

  initD3() {
    const container = this.d3ContainerRef.current;
    if (!container) {
      console.log("No canvas container");
      return;
    }

    const currentPrice = 556; // TODO(advait): Pipe from props

    const width = container.offsetWidth || 100.;
    const height = container.offsetHeight || 100.;
    this.svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);

    this.yScale = this.yScale = d3.scaleLinear()
        .domain([this.state.y0, this.state.yFinal])
        .range([0, height]);

    // TODO(advait): Figure out how to deal with horizontal ticks with this updating
    /*
    this.yAxis = (g) => {
      g.call(d3.axisRight().scale(this.yScale))
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick:not(:first-of-type) line").clone()
              .attr("x2", width)
              .attr("stroke", "#ffffff11"))
      ;
    };
     */
    this.yAxis = d3.axisRight().scale(this.yScale);

    this.tScale = this.tScale = d3.scaleUtc()
        .domain([this.timeWindow.t0.valueOf(), this.timeWindow.tFinal.valueOf()])
        .range([0, width]);

    this.tAxis = d3.axisBottom().scale(this.tScale);

    // Concat the data into one single monolithic array
    const portfolioValue = this.computePortfolioValue();
    let pctGain1d = [];
    for (let y = 0; y < height; y++) {
      portfolioValue.pctGain[y].forEach((v) => pctGain1d.push(v));
    }

    // Contour thresholds (pct gains) and the corresponding colors
    const thresholds = [-1, -0.8, -0.6, -0.3, -0.2, -.1, 0, 0.1, 0.3, 0.6, 0.8, 1, 1.5, 2, 3, 5];
    const colors = [
      '#9E0142',
      // '#C1294A',
      '#DE4D4A',
      '#F1704A',
      '#F99858',
      '#FDBF70',
      '#FEDD8E',
      '#F5FAAF',
      '#E0F3A1',
      '#BEE5A0',
      '#94D4A4',
      '#69BDA9',
      '#499BB3',
      '#4675B2',
      '#5E4FA2',
    ];
    const colorTable = (value) => {
      for (let i = 0; i <= thresholds.length - 1; i++) {
        if (value < thresholds[i + 1]) {
          return colors[i];
        }
      }
      console.log("Color clipped (gain too high)", value);
      return colors[colors.length - 1];
    };

    const contours = d3.contours()
        .size([width, height])
        (pctGain1d);

    this.svg.append("g")
        .attr("class", "contours")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.5)
        .selectAll("path")
        .data(contours)
        .join("path")
        .attr("fill", d => colorTable(d.value))
        .attr("d", d3.geoPath());

    this.svg.append("g")
        .attr("class", "t-axis")
        .attr("transform", `translate(0,${this.yScale(currentPrice)})`)
        .call(this.tAxis);
    this.svg.append("g")
        .attr("class", "y-axis")
        .call(this.yAxis);

    container.appendChild(this.svg.node());
  }

  updateD3() {
    const container = this.d3ContainerRef.current;
    if (!container) {
      console.log("No canvas container");
      return;
    }

    const currentPrice = 556; // TODO(advait): Pipe from props

    const width = container.offsetWidth || 100.;
    const height = container.offsetHeight || 100.;

    this.yScale
        .domain([this.state.y0, this.state.yFinal])
        .range([0, height]);

    this.tScale
        .domain([this.timeWindow.t0.valueOf(), this.timeWindow.tFinal.valueOf()])
        .range([0, width]);

    const portfolioValue = this.computePortfolioValue();

    // Concat the data into one single monolithic array
    let pctGain1d = [];
    for (let y = 0; y < height; y++) {
      portfolioValue.pctGain[y].forEach((v) => pctGain1d.push(v));
    }

    // Contour thresholds (pct gains) and the corresponding colors
    const thresholds = [-1, -0.8, -0.6, -0.3, -0.2, -.1, 0, 0.1, 0.3, 0.6, 0.8, 1, 1.5, 2, 3, 5];
    const colors = [
      '#9E0142',
      // '#C1294A',
      '#DE4D4A',
      '#F1704A',
      '#F99858',
      '#FDBF70',
      '#FEDD8E',
      '#F5FAAF',
      '#E0F3A1',
      '#BEE5A0',
      '#94D4A4',
      '#69BDA9',
      '#499BB3',
      '#4675B2',
      '#5E4FA2',
    ];
    const colorTable = (value) => {
      for (let i = 0; i <= thresholds.length - 1; i++) {
        if (value < thresholds[i + 1]) {
          return colors[i];
        }
      }
      console.log("Color clipped (gain too high)", value);
      return colors[colors.length - 1];
    };

    const contours = d3.contours()
        .size([width, height])
        (pctGain1d);

    this.svg.select(".contours")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.5)
        .selectAll("path")
        .data(contours)
        .join("path")
        .attr("fill", d => colorTable(d.value))
        .attr("d", d3.geoPath());

    const animDuration = 750;

    this.svg.select(".t-axis")
        .transition()
        .duration(animDuration)
        .attr("transform", `translate(0,${this.yScale(currentPrice)})`)
        .call(this.tAxis);

    this.svg.select(".y-axis")
        .transition()
        .duration(animDuration)
        .call(this.yAxis);
  }

  computePortfolioValue(scaleDownFactor = 1) {
    const container = this.d3ContainerRef.current;
    if (!container) {
      console.log("No canvas container");
      return;
    }
    const width = container.offsetWidth / scaleDownFactor || 100.;
    const height = container.offsetHeight / scaleDownFactor || 100.;

    return portfolioValue(
        width,
        height,
        this.timeWindow.t0,
        this.timeWindow.tFinal,
        this.state.y0,
        this.state.yFinal,
        this.portfolio,
        this.r,
        this.sigma);
  }
}


function GainsTooltip(props) {
  const display = props.hidden ? "hidden" : "inline";
  const style = {
    display,
    position: 'fixed',
    top: props.st.mouseY + 20,
    left: props.st.mouseX,
    zIndex: 3,
    backgroundColor: '#33333344',
    padding: '6px',
    borderRadius: '4px',
    transform: 'translate(-40%, -200%)',
  };

  return (
      <div className="gains-tooltip" style={style}>
        {(props.pctGain * 100).toFixed(2)}%
      </div>
  );
}
