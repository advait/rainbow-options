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
      y0: 100,
      yFinal: 1000,
      portfolio: portfolio,
      r: 0.007,
      sigma: 0.6824,
    };
  }

  componentDidMount() {
    this.updateCanvas();
    this.updateD3();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.updateCanvas();
    setTimeout(() => {
      this.randomize();
    }, 10);
  }

  randomize() {
    return;
    this.setState({
      ...this.state,
      yFinal: Math.random() * (1200 - 800) + 800,
    });
  }

  componentWillUnmount() {
    // TODO(advait): Destroy here
  }

  render() {
    return (
        <div id="canvas-container" ref={this.canvasContainerRef} onClick={() => this.randomize()}/>
    )
  }

  updateCanvas() {
    const container = this.canvasContainerRef.current;
    if (!container) {
      console.log("No canvas container");
      return;
    }
    const scaleDownFactor = 1;
    const width = container.offsetWidth / scaleDownFactor || 100.;
    const height = container.offsetHeight / scaleDownFactor || 100.;

    // const canvas = euroCallCanvas(width, height, 2, 0, 0, 200, 100, 0.01, 0.2);
    const canvas = portfolioCanvas(
        width,
        height,
        this.state.x0,
        this.state.xFinal,
        this.state.y0,
        this.state.yFinal,
        this.state.portfolio,
        this.state.r,
        this.state.sigma);

    container.appendChild(canvas);
  }

  updateD3() {
    const container = this.canvasContainerRef.current;
    if (!container) {
      console.log("No canvas container");
      return;
    }
    const width = container.offsetWidth || 100.;
    const height = container.offsetHeight || 100.;

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);

    const xScale = d3.scaleLinear()
        .domain([this.state.x0, this.state.xFinal])
        .range([0, width]);

    const xAxis = d3.axisBottom().scale(xScale);

    debugger;
    svg.append("g").call(xAxis);

    container.appendChild(svg.node());
  }
}


export default App;
