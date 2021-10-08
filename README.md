# UA-CH retrofill

This snippet illustrates how to reconstruct the legacy `navigator.userAgent`
string value from the modern `navigator.userAgentData` values.

## Usage instructions

Copy the contents of `uach-retrofill.js` to the relevant location in your project.

If you need any of the following values:

* `platform` - the Operating System's name
* `platformVersion` - the Operating System's version
* `architecture` - the CPU architecture
* `model` - the model on Android
* `uaFullVersion` - the browser's full version, in case the significant version (provided by default) is not enough

Then you will need to specify these as an array of strings to the parameter in `OverrideUserAgentUsingClientHints()` at the end of the file. For example, if you need the `platform` and `platformVersion`, you would specify:

```js
OverrideUserAgentUsingClientHints(["platform", "platformVersion"]).then(() => {
  document.getElementById("output").innerHTML = navigator.userAgent;
})
```

## Contributing

Please see the [Code of Conduct](docs/code-of-conduct.md) and [Contributing](docs/contributing.md) guides.
