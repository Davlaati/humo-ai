'use strict';

const ANSI_PATTERN = /[\u001B\u009B][[\]()#;?]*(?:(?:(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*|[a-zA-Z\d]+(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g;

function stripAnsi(input) {
  if (typeof input !== 'string') {
    return input;
  }

  return input.replace(ANSI_PATTERN, '');
}

module.exports = stripAnsi;
module.exports.default = stripAnsi;
