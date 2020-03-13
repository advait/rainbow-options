import React from 'react';
import './App.css';
import {GPU} from "gpu.js";

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
    renderCanvas(this.canvasContainerRef.current);
  }

  render() {
    return (
        <div id="canvas-container" ref={this.canvasContainerRef} onClick={() => {this.forceUpdate(); alert("hi"); }} />
    )
  }
}

const gpu = new GPU();
const color = function (width, height) {
  let nx = this.thread.x / width;
  nx -= 0.5;
  nx *= (width / height); // Correct for aspect ratio
  let ny = this.thread.y / height;
  ny -= 0.5;

  const dis = Math.sqrt(nx * nx + ny * ny);
  const val = Math.pow(dis, 1);
  this.color(val, val, val, 1);
};
const colorKernel = gpu.createKernel(color);

function renderCanvas(container) {
  const width = container.offsetWidth || 100.;
  const height = container.offsetHeight || 100.;

  const render = colorKernel
      .setOutput([width, height])
      .setGraphical(true);

  render(width, height);
  container.appendChild(render.canvas);
}

export default App;
