# UA-CH retrofill

This snippet illustrates how to reconstruct the legacy `navigator.userAgent`
string value from the modern `navigator.userAgentData` values. The legacy
`navigator.userAgent` is created only if the current `navigator.userAgent`
string matches the reduced User-Agent specification outlined in
[User-Agent Reduction](https://www.chromium.org/updates/ua-reduction).

## Usage instructions

Copy the contents of `uach-retrofill.js` to the relevant location in your project.

If you need any of the following values:

* `architecture` - the CPU architecture
* `bitness` - the Operating System's underlying CPU architecture bitness (e.g., "32" or "64")
* `model` - the model on Android
* `platformVersion` - the Operating System's version
* `platform` - the Operating System's name
* `uaFullVersion` - the browser's full version, in case the significant version (provided by default) is not enough
* `wow64` - whether or not the browser is running in 32-bit mode on 64-bit Windows

Then you will need to specify these as an array of strings to the parameter in `OverrideUserAgentUsingClientHints()` at the end of the file. For example, if you need the `platform` and `platformVersion`, you would specify:

```js
OverrideUserAgentUsingClientHints(["platform", "platformVersion"]).then(() => {
  document.getElementById("output").innerHTML = navigator.userAgent;
})
```

## Contributing

Please see the [Code of Conduct](docs/code-of-conduct.md) and [Contributing](docs/contributing.md) guides.
