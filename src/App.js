import React from 'react';
import './App.css';
import {GPU} from "gpu.js";

function App() {
  return (
      <Canvas />
  );
}

class Canvas extends React.Component {
    componentDidMount() {
        const canvas = this.refs.canvas;
        renderCanvas(canvas);
    }

    render() {
        return(
            <div>
                <canvas id="main-canvas" ref="canvas" />
            </div>
        )
    }
}

function renderCanvas(canvas) {
    const gl = canvas.getContext('webgl2');
    const gpu = new GPU({canvas, context: gl});

    const width = 500;
    const color = function (x) {
        this.color(this.thread.x / 500, this.thread.y / 500, x[0], 1);
    };
    const render = gpu
        .createKernel(color)
        .setOutput([width, width / 1.6])
        .setGraphical(true);

    render([0.8]);
}

export default App;
