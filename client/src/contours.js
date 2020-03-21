import React from "react";
import * as d3 from "d3";
import {portfolioValue} from "./blackscholes";
import moment from "moment";
import {makeStyles} from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import * as _ from "underscore";


const contoursStyles = makeStyles(theme => ({
  outerContainer: {
    width: '100%',
    height: '100%',
  },
  toolbar: theme.mixins.toolbar,
  contoursInnerContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  d3Container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  svg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 2,
  }
}));

export function Contours(props) {
  const classes = contoursStyles();
  return (
      <div className={classes.outerContainer}>
        <Toolbar className={classes.toolbar}/>
        <div id="contoursInnerContainer" className={classes.contoursInnerContainer}>
          <D3Contours {...props} className={classes.d3Container}/>
          <GainsTooltip
              st={props.st}
              pctGain={props.portfolioValue.pctGain}
              className={classes.svg}
          />
        </div>
      </div>
  )
}

class D3Contours extends React.Component {
  constructor(props) {
    super(props);
    this.d3ContainerRef = React.createRef();
    this.state = {
      y0: 15,
      yFinal: 0,
    };

    this.timeWindow = this.props.timeWindow;
    this.stockPrice = this.props.stockPrice;
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
    while (node.id !== "contoursInnerContainer") {
      node = node.parentElement;
      if (!node) {
        throw new Error("Could not find contoursInnerContainer");
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

    this.resizeListener = _.debounce(() => this.updateD3(), 10);
    window.addEventListener("resize", this.resizeListener);
  }

  componentWillUnmount() {
    window.removeEventListener(this.resizeListener);
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    // Major hacks to get d3 to play nicely with react's lifecycle
    // Here, we only want to update D3 if any portfolio/options-related props have changed
    if (this.timeWindow.t0 !== nextProps.timeWindow.t0 ||
        this.timeWindow.tFinal !== nextProps.timeWindow.tFinal ||
        this.stockPrice !== nextProps.stockPrice ||
        JSON.stringify(this.props.portfolio) !== JSON.stringify(nextProps.portfolio) ||
        this.r !== nextProps.r ||
        this.sigma !== nextProps.sigma) {

      // Now that we've confirmed that the props have changed, we need to manually overwrite them
      this.timeWindow.t0 = nextProps.timeWindow.t0;
      this.timeWindow.tFinal = nextProps.timeWindow.tFinal;
      this.stockPrice = nextProps.stockPrice;
      this.portfolio = nextProps.portfolio;
      this.r = nextProps.r;
      this.sigma = nextProps.sigma;

      this.updateD3();
    }

    // Always prevent react from re-rendering our DOM as d3 is responsible for managing it.
    return false;
  }

  render() {
    return (
        <div ref={this.d3ContainerRef}
             onMouseMove={e => this.updateST(e, true)}
             onMouseOut={e => this.updateST(e, false)}
             className={this.props.className}
        />
    );
  }

  initD3() {
    const container = this.d3ContainerRef.current;
    console.assert(container, "No canvas container");

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
        .attr("transform", `translate(0,${this.yScale(556)})`)
        .call(this.tAxis);
    this.svg.append("g")
        .attr("class", "y-axis")
        .call(this.yAxis);

    container.appendChild(this.svg.node());
  }

  updateD3() {
    performance.clearMarks();
    performance.clearMeasures();

    const container = this.d3ContainerRef.current;
    console.assert(container, "No canvas container");

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
    const contourWidth = Math.floor(width / scaleDownFactor);
    const contourHeight = Math.floor(height / scaleDownFactor);
    const portfolioValue = this.computePortfolioValue(contourWidth, contourHeight);

    performance.mark("d3ContoursStart");
    const contours = d3.contours()
        .size([contourWidth, contourHeight])
        (portfolioValue.pctGain);
    performance.mark("d3ContoursEnd");
    performance.measure("d3Contours", "d3ContoursStart", "d3ContoursEnd");
    console.log(performance.getEntriesByType("measure"));

    const contourPath = d3.geoPath().projection(d3.geoTransform({
      point: function (x, y) {
        this.stream.point(x / contourWidth * width, y / contourWidth * width)
      }
    }));

    // Contour thresholds (pct gains) and the corresponding colors
    const interpolatePctGain = (pctGain) => {
      if (pctGain <= 0) {
        return d3.scaleLinear().domain([-1, 0]).range([0, 0.5])(pctGain);
      } else {
        return d3.scalePow().domain([0, 3]).range([0.5, 1])(pctGain);
      }
    };

    this.svg.attr("viewBox", [0, 0, width, height]);

    this.svg.select(".contours")
        .selectAll("path")
        .data(contours)
        .join("path")
        .attr("fill", d => d3.interpolateSpectral(interpolatePctGain(d.value)))
        .attr("d", contourPath);


    this.svg.select(".t-axis")
        .attr("transform", `translate(0,${this.yScale(this.stockPrice)})`)
        .call(this.tAxis);

    this.svg.select(".y-axis")
        .call(this.yAxis);
  }

  computePortfolioValue(width, height) {
    return portfolioValue(
        width,
        height,
        this.timeWindow.t0,
        this.timeWindow.tFinal,
        this.state.y0,
        this.state.yFinal,
        this.stockPrice,
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
