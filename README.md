# UA-CH retrofill

This snippet illustrates how to reconstruct the legacy `navigator.userAgent`
string value from the modern `navigator.userAgentData` values. The legacy
`navigator.userAgent` is created only if the current `navigator.userAgent`
string matches the reduced User-Agent specification outlined in
[User-Agent Reduction](https://www.chromium.org/updates/ua-reduction).

## Usage instructions

Copy the contents of `uach-retrofill.js` to the relevant location in your project.

Import the function from the module:

```js
import { overrideUserAgentUsingClientHints } from './uach-retrofill.js';
```

The `overrideUserAgentUsingClientHints()` function takes an array of hints that will be used to generate the legacy user-agent string format and update the value in `navigator.userAgent`.

The various hints used, which you can optionally pass in based on your needs are:
* `architecture` - the CPU architecture
* `bitness` - the Operating System's underlying CPU architecture bitness (e.g., "32" or "64")
* `model` - the model on Android
* `platformVersion` - the Operating System's version
* `uaFullVersion` - the browser's full version, in case the significant version (provided by default) is not enough
* `wow64` - whether or not the browser is running in 32-bit mode on 64-bit Windows

For example, if you need the full `uaFullVersion`, you would specify:

```js
overrideUserAgentUsingClientHints(["uaFullVersion"]).then(() => {
  // navigator.userAgent will be updated with the generated string
  document.getElementById("output").innerHTML = navigator.userAgent;
})
```

## Demo

https://googlechromelabs.github.io/uach-retrofill/demo.html

## Contributing

Please see the [Code of Conduct](docs/code-of-conduct.md) and [Contributing](docs/contributing.md) guides.
