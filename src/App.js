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
  }

  componentDidMount() {
    this.renderCanvas(this.canvasContainerRef.current);
  }

  componentWillUnmount() {
    // TODO(advait): Destroy here
  }

  renderCanvas(container) {
    const width = container.offsetWidth || 100.;
    const height = container.offsetHeight || 100.;

    // const canvas = euroCallCanvas(width, height, 2, 0, 0, 200, 100, 0.01, 0.2);
    const canvas = portfolioCanvas(width, height, 0, 1, 100, 1000, portfolio, 0.007, 0.6824);

    container.appendChild(canvas);
  }

  render() {
    return (
        <div id="canvas-container" ref={this.canvasContainerRef}/>
    )
  }
}


export default App;
