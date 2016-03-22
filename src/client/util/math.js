export function degreesToRadians(degrees) {
  return degrees * Math.PI/180;
}

export function calcVectorDegrees(magnitude, angle) {
  var rad = degreesToRadians(angle);
  return calcVectorRadians(magnitude, rad);
}

export function calcVectorRadians(magnitude, rad) {
  var x = magnitude * Math.cos(rad);
  var y = magnitude * Math.sin(rad);
  return { x: x, y: y };
}
