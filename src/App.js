import React from "react";
import "./App.css";
import {portfolioCanvas} from "./blackscholes";
import {portfolio} from "./portfolio";
import * as d3 from "d3";

function App() {
  return (
      <Canvas/>
  );
}

class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.canvasContainerRef = React.createRef();
    this.state = {
      x0: 0,
      xFinal: 1,
      y0: 1000,
      yFinal: 100,
      portfolio: portfolio,
      r: 0.007,
      sigma: 0.6824,
    };
  }

  componentDidMount() {
    this.computePortfolioValue();
    this.updateD3();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.computePortfolioValue();
  }

  componentWillUnmount() {
    // TODO(advait): Destroy here
  }

  render() {
    return (
        <div id="canvas-container" ref={this.canvasContainerRef} />
    )
  }

  updateD3() {
    const container = this.canvasContainerRef.current;
    if (!container) {
      console.log("No canvas container");
      return;
    }

    const portfolioValue = this.computePortfolioValue();

    const currentPrice = 556; // TODO(advait): Pipe from props
    const width = container.offsetWidth || 100.;
    const height = container.offsetHeight || 100.;

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);

    const yScale = d3.scaleLinear()
        .domain([this.state.y0, this.state.yFinal])
        .range([0, height]);
    const yAxis = (g) => {
      g.call(d3.axisRight().scale(yScale))
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick:not(:first-of-type) line").clone()
              .attr("x2", width)
              .attr("stroke", "#ffffff11"))
      ;
    };

    const xScale = d3.scaleLinear()
        .domain([this.state.x0, this.state.xFinal])
        .range([0, width]);
    const xAxis = d3.axisBottom().scale(xScale);

    // Concat the data into one single monolithic array
    let pctGain1d = [];
    for (let y = 0; y < height; y++) {
      portfolioValue.pctGain[y].forEach((v) => pctGain1d.push(v));
    }
    const thresholds = [-1, -0.8, -0.6, -0.3, -0.10, 0, 0.1, 0.3, 0.6, 0.8, 1, 2];
    const color = d3.scaleLinear()
        .domain(d3.extent(thresholds))
        .interpolate(d => d3.interpolateSpectral);

    const contours = d3.contours()
        .size([width, height])
        (pctGain1d);

    svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.5)
        .selectAll("path")
        .data(contours)
        .join("path")
        .attr("fill", d => color(d.value))
        .attr("d", d3.geoPath());

    svg.append("g")
        .attr("transform", `translate(0,${yScale(currentPrice)})`)
        .call(xAxis);
    svg.append("g").call(yAxis);

    container.appendChild(svg.node());
  }

  computePortfolioValue(scaleDownFactor = 1) {
    const container = this.canvasContainerRef.current;
    if (!container) {
      console.log("No canvas container");
      return;
    }
    const width = container.offsetWidth / scaleDownFactor || 100.;
    const height = container.offsetHeight / scaleDownFactor || 100.;

    // const canvas = euroCallCanvas(width, height, 2, 0, 0, 200, 100, 0.01, 0.2);
    return portfolioCanvas(
        width,
        height,
        this.state.x0,
        this.state.xFinal,
        this.state.y0,
        this.state.yFinal,
        this.state.portfolio,
        this.state.r,
        this.state.sigma);
  }
}


export default App;
