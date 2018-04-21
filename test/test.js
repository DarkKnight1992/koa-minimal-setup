"use strict";

import { describe, it, expect } from "chai";

describe("test", function () {
  it("should pass", function () {
    expect("string").to.be.a("string");
  });
});