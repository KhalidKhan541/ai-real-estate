require("@testing-library/jest-dom");

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(window, "getComputedStyle", {
  writable: true,
  value: jest.fn().mockReturnValue({
    getPropertyValue: jest.fn().mockReturnValue(""),
    fontSize: "16px",
    fontFamily: "Inter, system-ui, sans-serif",
  }),
});

window.HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = jest.fn();
window.HTMLMediaElement.prototype.load = jest.fn();

global.fetch = jest.fn((url, options) => {
  const response = {
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    headers: new Map(),
    url: url,
  };
  return Promise.resolve(response);
});

global.Request = jest.fn().mockImplementation((url, options) => ({
  url,
  method: options?.method || "GET",
  headers: new Map(Object.entries(options?.headers || {})),
  json: () => Promise.resolve(options?.body ? JSON.parse(options.body) : {}),
  text: () => Promise.resolve(options?.body || ""),
}));

global.Response = jest.fn().mockImplementation((body, options) => ({
  ok: options?.status ? options.status >= 200 && options.status < 300 : true,
  status: options?.status || 200,
  statusText: options?.statusText || "OK",
  json: () => Promise.resolve(typeof body === "string" ? JSON.parse(body) : body),
  text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  headers: new Map(Object.entries(options?.headers || {})),
  url: "",
  redirected: false,
  type: "basic",
  clone: jest.fn(),
  body: null,
  bodyUsed: false,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
}));

global.URL = jest.fn().mockImplementation((url, base) => ({
  href: base ? new global.URL(url, base).href : url,
  origin: "",
  protocol: "https:",
  host: "",
  hostname: "",
  port: "",
  pathname: "",
  search: "",
  hash: "",
  searchParams: new URLSearchParams(),
  toString: () => url,
}));

jest.spyOn(console, "error").mockImplementation((...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Warning:") || args[0].includes("act("))
  ) {
    return;
  }
  console.warn(...args);
});

jest.useFakeTimers({ advanceTimers: true });

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllTimers();
});
