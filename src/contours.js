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
    this.updateD3();
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
             onMouseOut={e => this.updateST(e, false)}/>
    );
  }

  initD3() {
    const container = this.d3ContainerRef.current;
    console.assert(container, "No canvas container");

    const currentPrice = 556; // TODO(advait): Pipe from props

    const width = container.offsetWidth || 100.;
    const height = container.offsetHeight || 100.;
    this.svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);

    this.yScale = this.yScale = d3.scaleLinear()
        .domain([this.state.y0, this.state.yFinal])
        .range([0, height]);

    this.yAxis = d3.axisRight().scale(this.yScale);

    this.tScale = this.tScale = d3.scaleUtc()
        .domain([this.timeWindow.t0.valueOf(), this.timeWindow.tFinal.valueOf()])
        .range([0, width]);

    this.tAxis = d3.axisBottom().scale(this.tScale);

    this.svg.append("g")
        .attr("class", "contours")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.5);

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
    console.assert(container, "No canvas container");

    const currentPrice = 556; // TODO(advait): Pipe from props

    const width = container.offsetWidth || 100.;
    const height = container.offsetHeight || 100.;

    this.yScale
        .domain([this.state.y0, this.state.yFinal])
        .range([0, height]);

    this.tScale
        .domain([this.timeWindow.t0.valueOf(), this.timeWindow.tFinal.valueOf()])
        .range([0, width]);

    // Rather than compute the price for every pixel (resource intensive), we first scale down
    // and then scale up the d3 contour projection below.
    const scaleDownFactor = 4;
    const portfolioValue = this.computePortfolioValue(scaleDownFactor);

    // Concat the data into one single monolithic array
    performance.mark("arrayConcatStart");
    let pctGain1d = [];
    for (let y = 0; y < height / scaleDownFactor; y++) {
      portfolioValue.pctGain[y].forEach((v) => pctGain1d.push(v));
    }
    performance.mark("arrayConcatEnd");
    performance.measure("arrayConcat", "arrayConcatStart", "arrayConcatEnd");

    // Contour thresholds (pct gains) and the corresponding colors
    const interpolatePctGain = (pctGain) => {
      if (pctGain <= 0) {
        return d3.scaleLinear().domain([-1, 0]).range([0, 0.5])(pctGain);
      } else {
        return d3.scalePow().domain([0, 3]).range([0.5, 1])(pctGain);
      }
    };

    performance.mark("d3ContoursStart");
    const contours = d3.contours()
        .size([width / scaleDownFactor, height / scaleDownFactor])
        (pctGain1d);
    performance.mark("d3ContoursEnd");
    performance.measure("d3Contours", "d3ContoursStart", "d3ContoursEnd");
    console.log(performance.getEntriesByType("measure"));

    const d3Path = d3.geoPath().projection(d3.geoTransform({
      point: function (x, y) {
        this.stream.point(x * scaleDownFactor, y * scaleDownFactor)
      }
    }));

    this.svg.select(".contours")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.5)
        .selectAll("path")
        .data(contours)
        .join("path")
        .attr("fill", d => d3.interpolateSpectral(interpolatePctGain(d.value)))
        .attr("d", d3Path);

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
