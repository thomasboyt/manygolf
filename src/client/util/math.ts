export function degreesToRadians(degrees: number) {
  return degrees * Math.PI/180;
}

export function calcVectorDegrees(magnitude: number, angle: number) {
  var rad = degreesToRadians(angle);
  return calcVectorRadians(magnitude, rad);
}

export function calcVectorRadians(magnitude: number, rad: number) {
  var x = magnitude * Math.cos(rad);
  var y = magnitude * Math.sin(rad);
  return { x: x, y: y };
}
