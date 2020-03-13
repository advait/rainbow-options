import React from 'react';
import './App.css';
import initGpu from './gpu';

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
    this.gpu = initGpu();
    this.renderCanvas(this.canvasContainerRef.current);
  }

  componentWillUnmount() {
    this.gpu.gpu.destroy();
  }

  renderCanvas(container) {
    const width = container.offsetWidth || 100.;
    const height = container.offsetHeight || 100.;

    const render = this.gpu.colorKernel
        .setOutput([width, height])
        .setGraphical(true);

    render(width, height);
    container.appendChild(render.canvas);
  }

  render() {
    return (
        <div id="canvas-container" ref={this.canvasContainerRef} onClick={() => {this.forceUpdate(); alert("hi"); }} />
    )
  }
}


export default App;
