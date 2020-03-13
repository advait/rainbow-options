import React from 'react';
import './App.css';
import {SaiyanGPU} from './gpu';

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
    this.gpu = new SaiyanGPU();
    this.renderCanvas(this.canvasContainerRef.current);
  }

  componentWillUnmount() {
    this.gpu.destroy();
  }

  renderCanvas(container) {
    const width = container.offsetWidth || 100.;
    const height = container.offsetHeight || 100.;
    const canvas = this.gpu.renderColorCanvas(width, height);
    container.appendChild(canvas);
  }

  render() {
    return (
        <div id="canvas-container" ref={this.canvasContainerRef}/>
    )
  }
}


export default App;
