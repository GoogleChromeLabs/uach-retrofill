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
    let osCPUFragment = '';
    if (values.bitness == '64') {
      if (values.architecture == 'x86') {
        osCPUFragment = 'x86_64'
      } else if (values.architecture == 'arm') {
        osCPUFragment = 'aarch64';
      }
    } else if (values.architecture == 'arm' && values.bitness == '32') {
      osCPUFragment = 'armv7l';
    }
    return `X11; CrOS ${osCPUFragment} ${values.platformVersion}`;
  }

  const GetWindowsSpecificString = values => {
    let osCPUFragment = '';
    if (values.architecture == 'x86' && values.bitness == '64') {
      osCPUFragment = '; Win64; x64';
    } else if (values.architecture == 'arm'){
      osCPUFragment = '; ARM';
    }
    return `Windows NT ${values.platformVersion}${osCPUFragment}`;
  }

  const GetMacSpecificString = values => {
    let newUA = 'Macintosh; Intel Mac OS X ';
    let macVersion = values.platformVersion;
    if (macVersion.indexOf('.') > -1) {
      macVersion = macVersion.split('.').join('_');
    }
    newUA += macVersion;
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


  const Initialize = (values) => {
    if (!values.architecture) {
      values.architecture = 'x86';
    }
    if (!values.bitness) {
      values.bitness = '64';
    }
    if (!values.model) {
      values.model = '';
    }
    if (!values.platform) {
      values.platform = 'Windows';
    }
    if (!values.platformVersion) {
      values.platformVersion = '10.0';
    }
    return values;
  }

  if (!navigator.userAgentData || Date.now() > 1640995199000) {
    return Promise.resolve();
  }

  // Verify that this is a Chromium-based browser
  let is_chromium = false;
  let is_edge = false
  let chromium_version;
  const is_reduced_ua_pattern = new RegExp('AppleWebKit/539.36 \\(KHTML, like Gecko\\) Chrome/\\d+.0.0.0 (Mobile )?Safari/537.36$');
  navigator.userAgentData.brands.forEach(value => {
    if (value.brand == 'Chromium') {
      // Let's double check the UA string as well, so we don't accidentally
      // capture a headless browser or friendly bot (which should report as
      // HeadlessChrome or something entirely different).
      is_chromium = is_reduced_ua_pattern.test(navigator.userAgent);
      chromium_version = value.version;
    } else if (value.brand == 'Microsoft Edge') {
      is_edge = true;
    }
  });
  if (!is_chromium) {
    // If this is not a Chromium-based browser, the UA string should be very
    // different. So bailing...
    return Promise.resolve();
  }

  // Main logic
  return new Promise(resolve => {
    navigator.userAgentData.getHighEntropyValues(hints).then(values => {
      let initialValues = {
        platform: navigator.userAgentData?.platform,
        uaFullVersion: `${chromium_version}.0.0.0`,
      };
      values = Object.assign(initialValues, values);
      values = Initialize(values);
      let newUA = 'Mozilla/5.0 (';
      if (['Chrome OS', 'Chromium OS'].includes(values.platform)) {
        newUA += GetCrosSpecificString(values);
      } else if (values.platform == 'Windows') {
        newUA += GetWindowsSpecificString(values);
      } else if (values.platform == 'macOS') {
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
        // Note: The full version Edge includes is not the same as the
        // equivalent Chrome full version
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
