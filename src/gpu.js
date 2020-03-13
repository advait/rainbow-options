import {GPU} from "gpu.js";
import {normalCdf, euroCall, euroPut} from "./blackscholes";

function color(width, height) {
  let nx = this.thread.x / width;
  nx *= (width / height); // Correct for aspect ratio
  let ny = this.thread.y / height;

  const dis = Math.sqrt(nx * nx + ny * ny);
  const val = Math.pow(dis, 1);
  this.color(val, this.thread.x % 3 === 0 ? 0 : 1, 1-val, 1);
}

export class SaiyanGPU {
  constructor() {
    this.gpu = new GPU();
    this.gpu.addFunction(normalCdf);
    this.gpu.addFunction(euroCall);
    this.gpu.addFunction(euroPut);

    this.colorKernel = this.gpu.createKernel(color);
  }

  renderColorCanvas(width, height) {
    const render = this.colorKernel
        .setOutput([width, height])
        .setGraphical(true);

    render(width, height);
    return this.colorKernel.canvas;
  }

  destroy() {
    return this.gpu.destroy();
  }
}
