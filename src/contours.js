import React from "react";
import * as d3 from "d3";
import {portfolioValue} from "./blackscholes";
import moment from "moment";

export class Contours extends React.Component {
  constructor(props) {
    super(props);
    this.canvasContainerRef = React.createRef();
    this.state = {
      y0: 1000,
      yFinal: 100,
    };
  }

  componentDidMount() {
    this.updateD3();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.timeWindow.t0 !== prevProps.timeWindow.t0 ||
        this.props.timeWindow.tFinal !== prevProps.timeWindow.tFinal ||
        JSON.stringify(this.props.portfolio) !== JSON.stringify(prevProps.portfolio) ||
        this.props.r !== prevProps.r ||
        this.props.sigma !== prevProps.sigma) {
      // Only update D3 if any portfolio/options-related props have changed
      this.updateD3();
    }
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

  render() {
    return (
        <div
            id="canvas-container"
            ref={this.canvasContainerRef}
            onMouseMove={e => this.updateST(e, true)}
            onMouseOut={e => this.updateST(e, false)}>
          <GainsTooltip
              st={this.props.st}
              pctGain={this.props.portfolioValue.pctGain}
          />
        </div>
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

    const yScale = this.yScale = d3.scaleLinear()
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

    const tScale = this.tScale = d3.scaleUtc()
        .domain([this.props.timeWindow.t0.valueOf(), this.props.timeWindow.tFinal.valueOf()])
        .range([0, width]);
    const tAxis = d3.axisBottom().scale(tScale);

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

    svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.5)
        .selectAll("path")
        .data(contours)
        .join("path")
        .attr("fill", d => colorTable(d.value))
        .attr("d", d3.geoPath());

    svg.append("g")
        .attr("transform", `translate(0,${yScale(currentPrice)})`)
        .call(tAxis);
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

    return portfolioValue(
        width,
        height,
        this.props.timeWindow.t0,
        this.props.timeWindow.tFinal,
        this.state.y0,
        this.state.yFinal,
        this.props.portfolio,
        this.props.r,
        this.props.sigma);
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
