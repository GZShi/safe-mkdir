var fs = require('fs');
var path = require('path');

// 将回调式的nodejs-api转换成promise式
function promised(asyncFn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    return new Promise((resolve, reject) => {
      args.push(function (err, data) {
        if (err) reject(err);
        else resolve(data);
      });
      asyncFn.apply(this, args);
    });
  }
}

var stat = promised(fs.stat.bind(fs));
var mkdir = promised(fs.mkdir.bind(fs));


function makeAbsoluteDirectroy(pathname, mode) {
  var pathname = path.normalize(pathname);
  if (pathname[pathname.length - 1] === path.sep) {
    pathname = pathname.substr(0, pathname.length - 1);
  }
  var paths = pathname.split(path.sep);

  // 递归创建不存在的目录
  function _mkdir(paths, stack) {
    if (stack.length <= 0) return Promise.resolve(true);
    paths.push(stack.pop());
    return mkdir(paths.join(path.sep), mode).then(() => {
      return _mkdir(paths, stack);
    }, (reason) => {
      return false;
    });
  }

  // 递归检查不存在的父目录
  function _detect(paths, stack) {
    if (paths.length <= 0) return Promise.reject('根路径不正确');
    return stat(paths.join(path.sep)).then((stat) => {
      return _mkdir(paths, stack);
    }, (reason) => {
      stack.push(paths.pop());
      return _detect(paths, stack);
    });
  }

  return _detect(paths, []);
}


module.exports = makeAbsoluteDirectroy;
