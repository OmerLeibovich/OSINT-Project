
const isDocker = window.location.hostname !== "localhost";

const config_Api = {
  apiUrl: isDocker
    ? "http://backend:5000"     // when React is built and served inside Docker
    : "http://localhost:5000",  // when React is run from npm start locally
};

export { config_Api };
