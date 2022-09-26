/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// This function's role is to enable smooth transition to the brave new world of
// User-Agent Client Hints. If you have legacy code that relies on
// `navigator.userAgent` and which relies on entropy that will go away by
// default, you *need* to refactor it to use UA-CH. This function is to be used
// as a stop gap, to enable smooth transition during that period.

/**
* @param {string[]} hints
* @return {Promise<string|undefined>} A Promise that resolves to a string if a
*   UA could be synthesized from client hints, otherwise undefined.
*/
async function getUserAgentUsingClientHints(hints) {
  // Helper functions for platform specific strings
  const GetCrosSpecificString = (values) => {
    let osCPUFragment = "";
    if (values.bitness == "64") {
      if (values.architecture == "x86") {
        osCPUFragment = "x86_64";
      } else if (values.architecture == "arm") {
        osCPUFragment = "aarch64";
      }
    } else if (values.architecture == "arm" && values.bitness == "32") {
      osCPUFragment = "armv7l";
    }
    if (osCPUFragment == "") {
      return `X11; CrOS ${values.platformVersion}`;
    }
    return `X11; CrOS ${osCPUFragment} ${values.platformVersion}`;
  };

  const GetWindowsSpecificString = (values) => {
    let osCPUFragment = "";
    if (values.architecture == "x86" && values.bitness == "64") {
      osCPUFragment = "; Win64; x64";
    } else if (values.architecture == "arm") {
      osCPUFragment = "; ARM";
    } else if (values.wow64 === true) {
      osCPUFragment = "; WOW64";
    }
    return `Windows NT ${getWindowsPlatformVersion(
      values.platformVersion
    )}${osCPUFragment}`;
  };

  const GetMacSpecificString = (values) => {
    let newUA = "Macintosh; Intel Mac OS X ";
    let macVersion = values.platformVersion;
    if (macVersion.indexOf(".") > -1) {
      macVersion = macVersion.split(".").join("_");
    }
    newUA += macVersion;
    return newUA;
  };

  const GetAndroidSpecificString = (values) => {
    let newUA = "Linux; Android ";
    newUA += values.platformVersion;
    if (values.model) {
      newUA += "; ";
      newUA += values.model;
    }
    return newUA;
  };

  const Initialize = (values) => {
    if (!values.architecture) {
      values.architecture = "x86";
    }
    if (!values.bitness) {
      values.bitness = "64";
    }
    if (!values.model) {
      values.model = "";
    }
    if (!values.platform) {
      values.platform = "Windows";
    }
    if (!values.platformVersion) {
      values.platformVersion = "10.0";
    }
    if (!values.wow64) {
      values.wow64 = false;
    }

    return values;
  };

  if (!navigator.userAgentData) {
    return Promise.resolve();
  }

  // Verify that this is a Chromium-based browser
  let is_chromium = false;
  let chromium_version;
  const is_chrome_ua_pattern = new RegExp(
    "AppleWebKit/537.36 \\(KHTML, like Gecko\\) Chrome/\\d+.\\d+.\\d+.\\d+ (Mobile )?Safari/537.36$"
  );
  navigator.userAgentData.brands.forEach((value) => {
    if (value.brand == "Chromium") {
      // Let's double check the UA string as well, so we don't accidentally
      // capture a headless browser or friendly bot (which should report as
      // HeadlessChrome or something entirely different).
      is_chromium = is_chrome_ua_pattern.test(navigator.userAgent);
      chromium_version = value.version;
    }
  });
  if (!is_chromium || chromium_version < 100) {
    // If this is not a Chromium-based browser, the UA string should be very
    // different. Or, if this is a Chromium lower than 100, it doesn't have
    // all the hints we rely on. So let's bail.
    return Promise.resolve();
  }

  // Main logic
  return new Promise((resolve) => {
    navigator.userAgentData.getHighEntropyValues(hints).then((values) => {
      let initialValues = {
        platform: navigator.userAgentData?.platform,
        version: chromium_version,
      };
      values = Object.assign(initialValues, values);
      values = Initialize(values);
      let newUA = "Mozilla/5.0 (";
      if (["Chrome OS", "Chromium OS"].includes(values.platform)) {
        newUA += GetCrosSpecificString(values);
      } else if (values.platform == "Windows") {
        newUA += GetWindowsSpecificString(values);
      } else if (values.platform == "macOS") {
        newUA += GetMacSpecificString(values);
      } else if (values.platform == "Android") {
        newUA += GetAndroidSpecificString(values);
      } else {
        newUA += "X11; Linux x86_64";
      }
      newUA += ") AppleWebKit/537.36 (KHTML, like Gecko) Chrome/";
      newUA += getVersion(values?.fullVersionList, initialValues.version);
      if (navigator.userAgentData.mobile) {
        newUA += " Mobile";
      }
      newUA += " Safari/537.36";
      resolve(newUA);
    });
  });
}

function getVersion(fullVersionList, majorVersion) {
  if (!fullVersionList) {
    return `${majorVersion}.0.0.0`;
  }

  return fullVersionList.find((item) => item.brand == "Google Chrome")?.version;
}

function getWindowsPlatformVersion(platformVersion) {
  // https://wicg.github.io/ua-client-hints/#get-the-legacy-windows-version-number
  const versionMap = new Map([
    ["0.3.0", "6.3"], // Windows 8.1
    ["0.2.0", "6.2"], // Windows 8
    ["0.1.0", "6.1"], // Windows 7
  ]);

  if (versionMap.has(platformVersion)) {
    return versionMap.get(platformVersion);
  }

  // Windows 10 and above send "Windows NT 10.0"
  return "10.0";
}

/**
 * @param {string[]} hints
 * @return {Promise<string|undefined>} A Promise that resolves on overriding the
 *   navigator.userAgent string.
 */
async function overrideUserAgentUsingClientHints(hints) {
  return new Promise((resolve) => {
    getUserAgentUsingClientHints(hints).then((newUA) => {
      if (newUA) {
        // Got a new UA value. Now override `navigator.userAgent`.
        Object.defineProperty(navigator, "userAgent", {
          value: newUA,
          writable: false,
          configurable: true,
        });
      }
      resolve();
    });
  });
}

export const exportedForTests = { getVersion, getWindowsPlatformVersion };
export { getUserAgentUsingClientHints, overrideUserAgentUsingClientHints };
