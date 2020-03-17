# Rainbow Options

A web-based options portfolio profitability visualizer.

It's really hard to build intuition on the profitability dynamics of a particular options trade. Traditional textbook graphs are typically two dimensional and non-interactive. You might learn general ideas like "long puts are for bearish scenarios" but you fail to intuitively grasp how changes in strike price and expiration date actually affect the trade's profitability. Rainbow Options was built for interactive exploration to help the spatial parts of your brain build intuition on how various trade parameters impact profitability dynamics.

![Rainbow Options](https://user-images.githubusercontent.com/504011/76897686-6dae4a80-6851-11ea-9c22-43f6a2a4539b.png)

# Roadmap

- [x] Compute options leg values on gpu with [gpu.js](https://gpu.rocks/)
- [x] Render portfolio performance with d3 [contour maps](https://github.com/d3/d3-contour)
- [ ] Keyboard shortcuts to modify leg parameters
- [ ] Fetch option prices via some API
