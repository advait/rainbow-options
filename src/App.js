import React, {useState} from "react";
import "./App.css";
import {portfolioValue, portfolioValuePoint} from "./blackscholes";
import * as Portfolio from "./portfolio";
import * as d3 from "d3";
import {makeStyles} from '@material-ui/core/styles';
import {AppBar, Drawer, Icon, IconButton, Toolbar} from '@material-ui/core';
import 'typeface-roboto';
import Divider from "@material-ui/core/Divider";
import GitHubIcon from '@material-ui/icons/GitHub';
import Link from "@material-ui/core/Link";
import LooksIcon from '@material-ui/icons/Looks';
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";

const drawerWidth = 300;

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  titleLink: {
    color: '#FFF',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerTypography: {
    padding: theme.spacing(2),
  },
  drawerTypographySmall: {
    paddingBottom: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  toolbar: theme.mixins.toolbar,
  menuButton: {
    marginRight: theme.spacing(2),
  },
  content: {
    top: 0,
    right: 0,
    width: `calc(100% - ${drawerWidth}px)`,
    height: '100%',
    display: 'flex',
    position: 'fixed',
    overflowY: 'hidden',
    padding: 0,
  },
}));

function App() {
  const classes = useStyles();

  const [r, setR] = useState(0.007);
  const [sigma, setSigma] = useState(0.9);
  const [portfolio, setPortfolio] = useState(Portfolio.portfolio);
  const [mouseST, setMouseST] = useState({s: 550, t: 0});

  const portfolioValue = portfolioValuePoint(mouseST.s, mouseST.t, portfolio, r, sigma);

  return (
      <div className={classes.root}>
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <Icon edge="start" className={classes.menuButton}>
              <Link href="/" underline='none' className={classes.titleLink}>
                <LooksIcon/>
              </Link>
            </Icon>
            <Link href="/" underline='none' variant="h6" className={classes.titleLink}>
              Rainbow Options Calculator
            </Link>
            <div style={{flexGrow: 1}}/>
            <div>
              <IconButton
                  aria-label="link to github"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  color="inherit">
                <Link href="https://www.github.com/" className={classes.titleLink} target="_blank">
                  <GitHubIcon/>
                </Link>
              </IconButton>
            </div>
          </Toolbar>
        </AppBar>
        <Drawer
            className={classes.drawer}
            variant="permanent"
            classes={{
              paper: classes.drawerPaper,
            }}
            anchor="left"
        >
          <div className={classes.toolbar}/>
          <Divider />
          <Typography variant="h6" className={classes.drawerTypography}>Portfolio Value</Typography>
          <Typography className={classes.drawerTypographySmall} color="textSecondary">Gains</Typography>
          <Typography className={classes.drawerTypographySmall} color="textPrimary">{portfolioValue.pctGain * 100}%</Typography>
          <Typography className={classes.drawerTypographySmall} color="textSecondary">Initial Cost</Typography>
          <Typography className={classes.drawerTypographySmall} color="textPrimary">${portfolio.entryCost}</Typography>
          <Typography className={classes.drawerTypographySmall} color="textSecondary">S</Typography>
          <Typography className={classes.drawerTypographySmall} color="textPrimary">{mouseST.s}</Typography>
          <Typography className={classes.drawerTypographySmall} color="textSecondary">T</Typography>
          <Typography className={classes.drawerTypographySmall} color="textPrimary">{mouseST.t}</Typography>
          <Divider/>
          <Typography variant="h6" className={classes.drawerTypography}>Variables</Typography>
          <form className={classes.drawerTypography} noValidate autoComplete="off">
            <TextField
                label={"r (risk-free rate)"} fullWidth variant="filled"
                value={r}
                onChange={e => setR(e.target.value)}
            />
            <TextField
                label={"sigma (volatility)"} fullWidth variant="filled"
                value={sigma}
                onChange={e => setSigma(e.target.value)}
            />
          </form>
        </Drawer>
        <main className={classes.content}>
          <Canvas portfolio={portfolio} r={r} sigma={sigma} st={mouseST} setST={setMouseST}/>
        </main>
      </div>
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
    };
  }

  componentDidMount() {
    this.computePortfolioValue();
    this.updateD3();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    //this.computePortfolioValue();
  }

  mouseMove(e) {
    const bounds = e.target.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    const t = this.xScale.invert(x);
    const s = this.yScale.invert(y);
    this.props.setST({s, t});
  }

  render() {
    return (
        <div
            id="canvas-container"
            ref={this.canvasContainerRef}
            onMouseMove={this.mouseMove.bind(this)}
        />
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

    const xScale = this.xScale = d3.scaleLinear()
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

    return portfolioValue(
        width,
        height,
        this.state.x0,
        this.state.xFinal,
        this.state.y0,
        this.state.yFinal,
        this.props.portfolio,
        this.props.r,
        this.props.sigma);
  }
}


export default App;
