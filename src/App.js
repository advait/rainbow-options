import React from 'react';
import './App.css';
import {portfolioCanvas} from "./blackscholes";
import {portfolio} from "./portfolio";

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
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.updateCanvas();
    setTimeout(() => {
      this.randomize();
    }, 10);
  }

  randomize() {
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
    const width = container.offsetWidth || 100.;
    const height = container.offsetHeight || 100.;

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
}


export default App;
