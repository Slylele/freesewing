import { box } from "./shared";

export default part => {
  let { Point, points, Snippet, snippets } = part.shorthand();

  box(part);

  points.A = new Point(50, 25)
    .attr("data-text", "Point A")
    .attr("data-text-class", "text-xl");
  points.B = points.A.copy().attr("data-text", "Point B");

  snippets.x = new Snippet("x", points.A);

  return part;
};