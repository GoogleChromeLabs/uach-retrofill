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

import test from "ava";
import { exportedForTests } from "./uach-retrofill.js";
const { getWindowsPlatformVersion } = exportedForTests;

test("test getWindowsPlatformVersion helper", (t) => {
  t.is(getWindowsPlatformVersion("0.3.0"), "6.3");
  t.is(getWindowsPlatformVersion("0.2.0"), "6.2");
  t.is(getWindowsPlatformVersion("0.1.0"), "6.1");

  for (let defaultRV of ["13.0.0", "", undefined, null, 10, "0.0.0"]) {
    t.is(getWindowsPlatformVersion(defaultRV), "10.0");
  }
});
