const esbuild = require("esbuild");
const fs = require("fs");

const outfile = "file.js";

async function build(prod, test, agent) {
  await esbuild.build({
    entryPoints: [
      test
        ? "./test/test.js"
        : agent
        ? "./agent.js"
        : "./device.js",
    ],
    bundle: true,
    outfile,
    minify: prod,
    plugins: [shim],
  });
}

let shim = {
  name: "shim",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      const shims = [
        { name: "buffer", entry: "@frida/buffer/index.js" },
        { name: "http", entry: "@frida/http/index.js" },
        { name: "events", entry: "@frida/events/events.js" },
        { name: "net", entry: "@frida/net/index.js" },
        { name: "util", entry: "@frida/util/util.js" },
        { name: "stream", entry: "@frida/stream/index.js" },
        { name: "assert", entry: "@frida/assert/assert.js" },
        { name: "process", entry: "@frida/process/index.js" },
        {
          name: "string_decoder",
          entry: "@frida/string_decoder/lib/string_decoder.js",
        },
        { name: "path", entry: "@frida/path/index.js" },
        { name: "timers", entry: "@frida/timers/index.js" },
        { name: "url", entry: "@frida/url/url.js" },
        { name: "crypto", entry: "crypto-browserify/index.js" },
      ];
      const shim = shims.find((el) => el.name == args.path);
      if (shim) {
        return {
          path: `${__dirname}/node_modules/${shim.entry}`,
          namespace: "file",
        };
      }
    });
  },
};

/**
 * Something in the assert library is broken so we need to do some patching here.
 * - assert2 in the non minified file is undefined to we comment out those asserts
 * - in the minified file we add an empty OK function to the exported assert object
 */
async function run() {
  const prod = process.argv.includes("-prod");
  const test = process.argv.includes("-test");
  const agent = process.argv.includes("-agent");

  await build(prod, test, agent);
  let file = fs
    .readFileSync(`./${outfile}`)
    .toString()
    .split("\n");

  if (prod) {
    const write = prod ? xor(file.join("\n")) : file.join("\n");
    fs.writeFileSync(`./${outfile}`, Buffer.from(write).toString("base64"));
  } else {
    fs.writeFileSync(`./${outfile}`, file.join("\n"));
  }
}

run();
