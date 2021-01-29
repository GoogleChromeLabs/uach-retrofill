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
  const GetCrosSpecificString = values => {
    let newUA = 'X11; CrOS ';
    // Working around the lack of bitness value.
    if (values.architecture == 'x86') {
      newUA += 'x86_64';
    } else {
      newUA += 'aarch64';
    }
    newUA += ' ';
    newUA += values.platformVersion;
    return newUA;
  }

  const GetWindowsSpecificString = values => {
    let newUA = 'Windows NT ';
    newUA += values.platformVersion;
    newUA += '; ';
    // Working around the lack of bitness value.
    if (values.architecture == "x86") {
      newUA += "Win64; x64";
    } else {
      newUA += "ARM";
    }
    return newUA;
  }

  const GetMacSpecificString = values => {
    let newUA = 'Macintosh; Intel Mac OS X ';
    newUA += values.platformVersion;
    return newUA;
  }

  const GetAndroidSpecificString = values => {
    let newUA = 'Linux; Android ';
    newUA += values.platformVersion;
    if (values.model) {
      newUA += '; ';
      newUA += values.model;
    }
    return newUA;
  }

  const Initialize = (values, fallback_version) => {
    if (!values.platform) {
      values.platform = 'Windows';
    }
    if (!values.platformVersion) {
      values.platformVersion = '10.0';
    }
    if (!values.architecture) {
      values.architecture = 'x86';
    }
    if (!values.uaFullVersion) {
      values.uaFullVersion = fallback_version + '.0.0.0';
    }
    if (!values.model) {
      values.model = '';
    }
    return values;
  }

  if (!navigator.userAgentData || Date.now() > 1640995199000) {
    return Promise.resolve();
  }

  // Verify that this is a Chromium
  let is_chromium = false;
  let is_edge = false
  let chromium_version;
  navigator.userAgentData.brands.forEach(value => {
    if (value.brand == 'Chromium') {
      is_chromium = true;
      chromium_version = value.version;
    } else if (value.brand == 'Microsoft Edge') {
      is_edge = true;
    }
  });
  if (!is_chromium) {
    // If this is not a Chromium based browser, the UA string should be very different. So bailing...
    return Promise.resolve();
  }

  // Main logic
  return new Promise(resolve => {
    navigator.userAgentData.getHighEntropyValues(hints).then(values => {
      values = Initialize(values, chromium_version);
      let newUA = 'Mozilla/5.0 (';
      if (values.platform == 'Chrome OS') {
        newUA += GetCrosSpecificString(values);
      } else if (values.platform == 'Windows') {
        newUA += GetWindowsSpecificString(values);
        // TODO: 'Mac OS X' can be removed in the near future
        // See Issue #13
      } else if (['macOS', 'Mac OS X'].includes(values.platform)) {
        newUA += GetMacSpecificString(values);
      } else if (values.platform == 'Android') {
        newUA += GetAndroidSpecificString(values);
      } else {
        newUA += 'X11; Linux x86_64';
      }
      newUA += ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/';
      newUA += values.uaFullVersion;
      if (navigator.userAgentData.mobile) {
        newUA += ' Mobile';
      }
      newUA += ' Safari/537.36';

      if (is_edge) {
        newUA += ' Edg/';
        // Note: The full version Edge includes is not the same as the equivalent Chrome full version
        newUA += values.uaFullVersion;
      }

      resolve(newUA);
    })
  })
}

/**
* @param {string[]} hints
* @return {Promise<string|undefined>} A Promise that resolves on overriding the
*   navigator.userAgent string.
*/
async function overrideUserAgentUsingClientHints(hints) {
  return new Promise(resolve => {
    getUserAgentUsingClientHints(hints).then(newUA => {
      // Got a new UA value. Now override `navigator.userAgent`.
      Object.defineProperty(navigator, 'userAgent', {
        value: newUA,
        writable: false,
        configurable: true
      });
      resolve();
    })
  });
}

export { getUserAgentUsingClientHints, overrideUserAgentUsingClientHints };
