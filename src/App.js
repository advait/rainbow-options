import React from 'react';
import './App.css';
import {GPU} from "gpu.js";

function App() {
  return (
      <Canvas/>
  );
}

class Canvas extends React.Component {
  componentDidMount() {
    const canvas = this.refs.canvas;
    renderCanvas(canvas);
  }

  render() {
    return (
        <div>
          <canvas id="main-canvas" ref="canvas"/>
        </div>
    )
  }
}

function renderCanvas(canvas) {
  const gl = canvas.getContext('webgl2');
  const gpu = new GPU({canvas, context: gl});

  const width = 1000.;
  const height = width / 1.6;

  const color = function (width, height) {
    let nx = this.thread.x / width;
    nx -= 0.5;
    nx *= (width / height); // Correct for aspect ratio
    let ny = this.thread.y / height;
    ny -= 0.5;

    const dis = Math.sqrt(nx * nx + ny * ny);
    const val = Math.pow(dis, 0.5);
    this.color(val, val, val, 1);
  };
  const render = gpu
      .createKernel(color)
      .setOutput([width, height])
      .setGraphical(true);

  render(width, height);
}

export default App;
