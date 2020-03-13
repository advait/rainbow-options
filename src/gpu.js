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

export default function initGpu() {
  const gpu = new GPU();

  gpu.addFunction(normalCdf);
  gpu.addFunction(euroCall);
  gpu.addFunction(euroPut);

  const colorKernel = gpu.createKernel(color);

  return {
    gpu,
    colorKernel,
  }
}