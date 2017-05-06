export function getWsApiUrl() {
  let protocol = 'ws';
  if (document.location.protocol === 'https:') {
    protocol = 'wss';
  }

  return `${protocol}://${process.env.SERVER_URL}`;
}

export function getHttpApiUrl() {
  let protocol = 'http';
  if (document.location.protocol === 'https:') {
    protocol = 'https';
  }

  return `${protocol}://${process.env.SERVER_URL}`;
}
